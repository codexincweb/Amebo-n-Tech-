import { NextRequest, NextResponse } from "next/server";
import { verifyListenerTicket } from "@/lib/auth";
import {
  getLiveState,
  liveRedis,
  LIVE_REQUESTS_KEY
} from "@/lib/live-room";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let body: { ticket?: unknown };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const ticket = typeof body.ticket === "string" ? body.ticket : "";
  const listener = ticket ? await verifyListenerTicket(ticket) : null;

  if (!listener) {
    return NextResponse.json(
      { error: "Your listener session expired. Please rejoin." },
      { status: 401 }
    );
  }

  try {
    const state = await getLiveState();

    if (!state.active) {
      return NextResponse.json(
        { error: "The live room is currently offline." },
        { status: 409 }
      );
    }

    await liveRedis().hset(LIVE_REQUESTS_KEY, {
      [listener.identity]: {
        identity: listener.identity,
        name: listener.name,
        requestedAt: new Date().toISOString()
      }
    });

    return NextResponse.json(
      { success: true, message: "Your request to speak has been sent to the host." },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Speaker request failed:", error);
    return NextResponse.json(
      { error: "Could not send your request. Please try again." },
      { status: 503 }
    );
  }
}
