import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { createSession, SESSION_COOKIE } from "@/lib/auth";
import { limitAdminLogin } from "@/lib/rate-limit";

export const runtime = "nodejs";

function safeCompare(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

function clientIdentifier(request: NextRequest) {
  // Prefer the platform-provided client IP header; don't trust arbitrary forwarded chains.
  const ip = request.headers.get("x-real-ip")?.trim();
  return ip && ip.length < 100 ? ip : "unknown-client";
}

export async function POST(request: NextRequest) {
  const configuredPassword = process.env.ADMIN_PASSWORD;
  if (!configuredPassword) {
    return NextResponse.json({ error: "Admin login is not configured." }, { status: 503 });
  }

  let body: { password?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (typeof body.password !== "string" || body.password.length > 1024) {
    return NextResponse.json({ error: "Invalid password." }, { status: 400 });
  }

  let limit;
  try {
    limit = await limitAdminLogin(clientIdentifier(request));
  } catch (error) {
    console.error("Admin login rate limiter unavailable:", error);
    return NextResponse.json({ error: "Login is temporarily unavailable." }, { status: 503 });
  }

  if (!limit.success) {
    const retryAfter = Math.max(1, Math.ceil((limit.reset - Date.now()) / 1000));
    return NextResponse.json(
      { error: "Too many login attempts. Try again later." },
      { status: 429, headers: { "Retry-After": String(retryAfter) } }
    );
  }

  if (!safeCompare(body.password, configuredPassword)) {
    return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
  }

  try {
    const token = await createSession();
    const response = NextResponse.json({ success: true });
    response.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 8
    });
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error) {
    console.error("Could not create admin session:", error);
    return NextResponse.json({ error: "Server authentication is not configured." }, { status: 500 });
  }
}
