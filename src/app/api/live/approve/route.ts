import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/auth";
import {
  getLiveState,
  liveRedis,
  LIVE_APPROVED_KEY,
  LIVE_REQUESTS_KEY
} from "@/lib/live-room";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body: { identity?: unknown; action?: unknown };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const identity =
    typeof body.identity === "string" ? body.identity.trim() : "";
  const action = body.action;

  if (
    !identity.startsWith("listener-") ||
    (action !== "approve" && action !== "deny")
  ) {
    return NextResponse.json(
      { error: "Invalid speaker or action." },
      { status: 400 }
    );
  }

  try {
    const state = await getLiveState();

    if (!state.active) {
      return NextResponse.json(
        { error: "The live room is offline." },
        { status: 409 }
      );
    }

    const redis = liveRedis();
    const requestExists = await redis.hget(LIVE_REQUESTS_KEY, identity);

    if (!requestExists) {
      return NextResponse.json(
        { error: "This speaker request is no longer pending." },
        { status: 404 }
      );
    }

    if (action === "approve") {
      await redis.hset(LIVE_APPROVED_KEY, {
        [identity]: "approved"
      });
    } else {
      await redis.hdel(LIVE_APPROVED_KEY, identity);
    }

    await redis.hdel(LIVE_REQUESTS_KEY, identity);

    return NextResponse.json({
      success: true,
      identity,
      status: action === "approve" ? "approved" : "denied"
    });
  } catch (error) {
    console.error("Speaker approval failed:", error);
    return NextResponse.json(
      { error: "Could not process this speaker request." },
      { status: 503 }
    );
  }
}
