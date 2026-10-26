import { NextRequest } from "next/server";

export function isSameOriginRequest(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");

  let source: URL;

  try {
    if (origin) {
      if (origin === "null") return false;
      source = new URL(origin);
    } else if (referer) {
      source = new URL(referer);
    } else {
      return false;
    }
  } catch {
    return false;
  }

  return source.origin === request.nextUrl.origin;
}
