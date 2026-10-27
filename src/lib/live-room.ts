import { Redis } from "@upstash/redis";
import { RoomServiceClient } from "livekit-server-sdk";

export const LIVE_STATE_KEY = "amebo:live:state";
export const LIVE_REQUESTS_KEY = "amebo:live:requests";
export const LIVE_APPROVED_KEY = "amebo:live:approved";

export type LiveRoomState = {
  active: boolean;
  roomName: string;
  title: string;
  startedAt: string | null;
};

export type SpeakerRequest = {
  identity: string;
  name: string;
  requestedAt: string;
};

export function liveRedis() {
  return Redis.fromEnv();
}

export function liveRoomService() {
  const url = process.env.LIVEKIT_URL;
  const key = process.env.LIVEKIT_API_KEY;
  const secret = process.env.LIVEKIT_API_SECRET;

  if (!url || !key || !secret) {
    throw new Error("LiveKit is not configured.");
  }

  const host = url.replace(/^wss:/, "https:").replace(/^ws:/, "http:");
  return new RoomServiceClient(host, key, secret);
}

export async function getLiveState(): Promise<LiveRoomState> {
  const state = await liveRedis().get<LiveRoomState>(LIVE_STATE_KEY);

  return state ?? {
    active: false,
    roomName: "amebo-live-room",
    title: "Amebo 'n Tech Live",
    startedAt: null
  };
}

export async function saveLiveState(state: LiveRoomState) {
  await liveRedis().set(LIVE_STATE_KEY, state);
}

export async function getSpeakerRequests(): Promise<SpeakerRequest[]> {
  const requests = await liveRedis().hgetall<Record<string, SpeakerRequest>>(
    LIVE_REQUESTS_KEY
  );

  if (!requests) return [];

  return Object.values(requests).filter(
    (request): request is SpeakerRequest =>
      Boolean(request) &&
      typeof request.identity === "string" &&
      typeof request.name === "string"
  );
}

export async function clearLiveRoomLists() {
  const redis = liveRedis();
  await redis.del(LIVE_REQUESTS_KEY, LIVE_APPROVED_KEY);
}
