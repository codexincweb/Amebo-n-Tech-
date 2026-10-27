import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "amebo_admin_session";
const SESSION_TTL_SECONDS = 60 * 60 * 8;

function secretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET must be set to at least 32 characters.");
  }
  return new TextEncoder().encode(secret);
}

export async function createSession() {
  return new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject("admin")
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(secretKey());
}

export async function verifySession(token: string) {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    return payload.sub === "admin" && payload.role === "admin";
  } catch {
    return false;
  }
}

export async function isAdminRequest() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  return token ? verifySession(token) : false;
}

export async function createListenerTicket(identity: string, name: string) {
  return new SignJWT({ role: "listener", name })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(identity)
    .setIssuedAt()
    .setExpirationTime("2h")
    .sign(secretKey());
}

export async function verifyListenerTicket(ticket: string) {
  try {
    const { payload } = await jwtVerify(ticket, secretKey());

    if (
      payload.role !== "listener" ||
      typeof payload.sub !== "string" ||
      !payload.sub.startsWith("listener-") ||
      typeof payload.name !== "string"
    ) {
      return null;
    }

    return {
      identity: payload.sub,
      name: payload.name
    };
  } catch {
    return null;
  }
}
