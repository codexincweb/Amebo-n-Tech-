import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/auth";
import {
  clearLiveRoomLists,
  getLiveState,
  getSpeakerRequests,
  liveRoomService,
  saveLiveState
} from "@/lib/live-room";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const [state, requests] = await Promise.all([
      getLiveState(),
      getSpeakerRequests()
    ]);

    return NextResponse.json(
      { success: true, state, requests },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Could not load live-room status:", error);
    return NextResponse.json(
      { error: "Live-room status is temporarily unavailable." },
      { status: 503 }
    );
  }
}

export async function POST(request: NextRequest) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body: { action?: unknown; title?: unknown };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (body.action !== "start" && body.action !== "end") {
    return NextResponse.json({ error: "Unsupported action." }, { status: 400 });
  }

  const title =
    typeof body.title === "string"
      ? body.title.trim().slice(0, 120)
      : "Amebo 'n Tech Live";

  try {
    const state = await getLiveState();
    const rooms = liveRoomService();

    if (body.action === "start") {
      if (state.active) {
        return NextResponse.json({ success: true, state });
      }

      await clearLiveRoomLists();

      const nextState = {
        active: true,
        roomName: "amebo-live-room",
        title: title || "Amebo 'n Tech Live",
        startedAt: new Date().toISOString()
      };

      try {
        await rooms.createRoom({
          name: nextState.roomName,
          emptyTimeout: 300,
          maxParticipants: 100
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "";
        if (!/already exists/i.test(message)) throw error;
      }

      await saveLiveState(nextState);

      return NextResponse.json({ success: true, state: nextState });
    }

    if (state.active) {
      try {
        await rooms.deleteRoom(state.roomName);
      } catch (error) {
        console.error("Could not close LiveKit room:", error);
        return NextResponse.json(
          { error: "The audio room could not be closed. Please retry." },
          { status: 502 }
        );
      }
    }

    const nextState = {
      ...state,
      active: false,
      startedAt: null
    };

    await saveLiveState(nextState);
    await clearLiveRoomLists();

    return NextResponse.json({ success: true, state: nextState });
  } catch (error) {
    console.error("Live-room host action failed:", error);
    return NextResponse.json(
      { error: "Live-room service is temporarily unavailable." },
      { status: 503 }
    );
  }
}
