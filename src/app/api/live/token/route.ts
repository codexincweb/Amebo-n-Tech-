import { NextRequest, NextResponse } from "next/server";
import { AccessToken } from "livekit-server-sdk";
import {
  createListenerTicket,
  isAdminRequest,
  verifyListenerTicket
} from "@/lib/auth";
import { getLiveState, liveRedis, LIVE_APPROVED_KEY } from "@/lib/live-room";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let body: { name?: unknown; ticket?: unknown };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim().slice(0, 50) : "";
  const ticket = typeof body.ticket === "string" ? body.ticket : "";

  const isHost = await isAdminRequest();
  let identity: string;
  let participantName: string;
  let canPublish = isHost;

  if (isHost) {
    identity = "amebo-host";
    participantName = name || "Amebo 'n Tech Host";
  } else {
    if (!ticket) {
      if (!name) {
        return NextResponse.json({ error: "Enter your display name." }, { status: 400 });
      }

      identity = `listener-${crypto.randomUUID()}`;
      participantName = name;
    } else {
      const listener = await verifyListenerTicket(ticket);

      if (!listener) {
        return NextResponse.json({ error: "Your listener session expired. Please rejoin." }, { status: 401 });
      }

      identity = listener.identity;
      participantName = listener.name;
      const approved = await liveRedis().hget<string>(
        LIVE_APPROVED_KEY,
        identity
      );
      canPublish = approved === "approved";
    }
  }

  try {
    const state = await getLiveState();

    if (!state.active) {
      return NextResponse.json({ error: "The live room is currently offline." }, { status: 409 });
    }

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const serverUrl = process.env.LIVEKIT_URL;

    if (!apiKey || !apiSecret || !serverUrl) {
      throw new Error("LiveKit environment variables are missing.");
    }

    const token = new AccessToken(apiKey, apiSecret, {
      identity,
      name: participantName,
      ttl: "2h"
    });

    token.addGrant({
      roomJoin: true,
      room: state.roomName,
      canSubscribe: true,
      canPublish,
      canPublishData: true
    });

    const listenerTicket = isHost
      ? null
      : ticket || await createListenerTicket(identity, participantName);

    return NextResponse.json(
      {
        token: await token.toJwt(),
        serverUrl,
        identity,
        isHost,
        canPublish,
        listenerTicket
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("LiveKit token creation failed:", error);
    return NextResponse.json(
      { error: "Could not connect to the live room right now." },
      { status: 503 }
    );
  }
}
