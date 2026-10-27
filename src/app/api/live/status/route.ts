import { NextResponse } from "next/server";
import { getLiveState } from "@/lib/live-room";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const state = await getLiveState();

    return NextResponse.json(
      {
        active: state.active,
        title: state.title,
        startedAt: state.startedAt
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Could not retrieve public live status:", error);

    return NextResponse.json(
      { error: "Live status is temporarily unavailable." },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }
}
