import { createHash, randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getRequestIdentifier, limitPublicAction } from "@/lib/public-rate-limit";
import { isSameOriginRequest } from "@/lib/verify-same-origin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COOKIE_NAME = "amebo_visitor";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

type RouteContext = { params: Promise<{ id: string }> };

type LikeState = {
  liked: boolean;
  likeCount: number;
};

function getVisitor(request: NextRequest) {
  const existing = request.cookies.get(COOKIE_NAME)?.value;

  if (existing && /^[a-f0-9-]{36}$/i.test(existing)) {
    return { id: existing, needsCookie: false };
  }

  return { id: randomUUID(), needsCookie: true };
}

function withVisitorCookie(
  request: NextRequest,
  visitor: ReturnType<typeof getVisitor>,
  body: unknown,
  status = 200
) {
  const response = NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" }
  });

  if (visitor.needsCookie) {
    response.cookies.set(COOKIE_NAME, visitor.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: COOKIE_MAX_AGE
    });
  }

  return response;
}

export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json(
      { error: "Cross-origin request rejected." },
      { status: 403, headers: { "Cache-Control": "no-store" } }
    );
  }

  const visitor = getVisitor(request);

  try {
    const { id } = await context.params;

    if (!id || id.length > 64) {
      return withVisitorCookie(request, visitor, {
        error: "Invalid comment."
      }, 400);
    }

    const identity = getRequestIdentifier(
      visitor.needsCookie
        ? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
        : createHash("sha256").update(visitor.id).digest("hex")
    );

    const rate = await limitPublicAction("like", identity);

    if (!rate.success) {
      return withVisitorCookie(request, visitor, {
        error: "Too many like actions. Please try again later."
      }, 429);
    }

    const comment = await db.$queryRaw<{ id: string }[]>(Prisma.sql`
      SELECT c."id"
      FROM "Comment" c
      INNER JOIN "Post" p ON p."id" = c."postId"
      WHERE c."id" = ${id} AND p."published" = true
      LIMIT 1
    `);

    if (!comment.length) {
      return withVisitorCookie(request, visitor, {
        error: "Comment not found."
      }, 404);
    }

    const state = await db.$transaction(async (tx) => {
      // Serialize toggles from this visitor for this comment.
      await tx.$queryRaw(Prisma.sql`
        SELECT pg_advisory_xact_lock(
          hashtextextended(${`${id}:${visitor.id}`}, 0)
        )
      `);

      const removed = await tx.$queryRaw<{ id: string }[]>(Prisma.sql`
        DELETE FROM "CommentLike"
        WHERE "commentId" = ${id} AND "visitorId" = ${visitor.id}
        RETURNING "id"
      `);

      if (removed.length === 0) {
        await tx.$executeRaw(Prisma.sql`
          INSERT INTO "CommentLike" ("id", "commentId", "visitorId", "createdAt")
          VALUES (${randomUUID().replace(/-/g, "")}, ${id}, ${visitor.id}, CURRENT_TIMESTAMP)
          ON CONFLICT ("commentId", "visitorId") DO NOTHING
        `);
      }

      const rows = await tx.$queryRaw<LikeState[]>(Prisma.sql`
        SELECT
          EXISTS (
            SELECT 1 FROM "CommentLike"
            WHERE "commentId" = ${id} AND "visitorId" = ${visitor.id}
          ) AS "liked",
          COUNT(*)::int AS "likeCount"
        FROM "CommentLike"
        WHERE "commentId" = ${id}
      `);

      return rows[0];
    });

    return withVisitorCookie(request, visitor, state);
  } catch (error) {
    console.error("Toggle comment like failed:", error);

    return withVisitorCookie(request, visitor, {
      error: "The like could not be saved. Please try again."
    }, 503);
  }
}
