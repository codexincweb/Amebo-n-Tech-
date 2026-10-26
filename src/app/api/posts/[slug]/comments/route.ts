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

type CommentRow = {
  id: string;
  postId: string;
  parentId: string | null;
  name: string;
  body: string;
  createdAt: Date;
  likeCount: number;
  likedByVisitor: boolean;
};

type RouteContext = { params: Promise<{ slug: string }> };

function visitorCookie(request: NextRequest) {
  const existing = request.cookies.get(COOKIE_NAME)?.value;
  if (existing && /^[a-f0-9-]{36}$/i.test(existing)) {
    return { visitorId: existing, needsCookie: false };
  }

  return { visitorId: randomUUID(), needsCookie: true };
}

function responseWithVisitor(
  request: NextRequest,
  body: unknown,
  status = 200,
  visitor = visitorCookie(request)
) {
  const response = NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" }
  });

  if (visitor.needsCookie) {
    response.cookies.set(COOKIE_NAME, visitor.visitorId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: COOKIE_MAX_AGE
    });
  }

  return response;
}

function clean(value: unknown, max: number) {
  if (typeof value !== "string") return "";
  return value.replace(/\u0000/g, "").trim().slice(0, max);
}

function visitorHash(visitorId: string) {
  return createHash("sha256").update(visitorId).digest("hex");
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { slug } = await context.params;

    const post = await db.post.findFirst({
      where: { slug, published: true },
      select: { id: true }
    });

    if (!post) {
      return NextResponse.json({ error: "Story not found." }, { status: 404 });
    }

    const visitor = visitorCookie(request);

    const comments = await db.$queryRaw<CommentRow[]>(Prisma.sql`
      SELECT
        c."id",
        c."postId",
        c."parentId",
        c."name",
        c."body",
        c."createdAt",
        COUNT(DISTINCT l."id")::int AS "likeCount",
        COALESCE(BOOL_OR(l."visitorId" = ${visitor.visitorId}), false) AS "likedByVisitor"
      FROM "Comment" c
      LEFT JOIN "CommentLike" l ON l."commentId" = c."id"
      WHERE c."postId" = ${post.id}
      GROUP BY c."id"
      ORDER BY c."createdAt" ASC
    `);

    return responseWithVisitor(request, { comments }, 200, visitor);
  } catch (error) {
    console.error("Fetch comments failed:", error);
    return NextResponse.json(
      { error: "Comments are temporarily unavailable." },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json(
      { error: "Cross-origin request rejected." },
      { status: 403, headers: { "Cache-Control": "no-store" } }
    );
  }

  try {
    const { slug } = await context.params;

    const post = await db.post.findFirst({
      where: { slug, published: true },
      select: { id: true }
    });

    if (!post) {
      return NextResponse.json({ error: "Story not found." }, { status: 404 });
    }

    const visitor = visitorCookie(request);
    const identity = getRequestIdentifier(
      visitor.needsCookie
        ? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
        : visitorHash(visitor.visitorId)
    );

    const rate = await limitPublicAction("comment", identity);

    if (!rate.success) {
      return responseWithVisitor(
        request,
        { error: "You've commented too frequently. Please try again later." },
        429
      );
    }

    let input: Record<string, unknown>;

    try {
      const parsed: unknown = await request.json();
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        throw new Error("Invalid body");
      }
      input = parsed as Record<string, unknown>;
    } catch {
      return responseWithVisitor(request, { error: "Invalid request body." }, 400);
    }

    const name = clean(input.name, 60);
    const body = clean(input.body, 1500);
    const parentId = clean(input.parentId, 64) || null;

    if (name.length < 2 || body.length < 2) {
      return responseWithVisitor(
        request,
        { error: "Enter a name and a comment of at least two characters." },
        400
      );
    }

    if (parentId) {
      const parent = await db.$queryRaw<{ id: string }[]>(Prisma.sql`
        SELECT "id"
        FROM "Comment"
        WHERE "id" = ${parentId} AND "postId" = ${post.id}
        LIMIT 1
      `);

      if (!parent.length) {
        return responseWithVisitor(
          request,
          { error: "The comment you're replying to was not found." },
          400
        );
      }
    }

    const id = randomUUID().replace(/-/g, "");

    await db.$executeRaw(Prisma.sql`
      INSERT INTO "Comment" ("id", "postId", "parentId", "name", "body", "createdAt")
      VALUES (${id}, ${post.id}, ${parentId}, ${name}, ${body}, CURRENT_TIMESTAMP)
    `);

    const created = await db.$queryRaw<CommentRow[]>(Prisma.sql`
      SELECT
        c."id",
        c."postId",
        c."parentId",
        c."name",
        c."body",
        c."createdAt",
        0::int AS "likeCount",
        false AS "likedByVisitor"
      FROM "Comment" c
      WHERE c."id" = ${id}
      LIMIT 1
    `);

    return responseWithVisitor(request, { comment: created[0] }, 201);
  } catch (error) {
    console.error("Create comment failed:", error);
    return NextResponse.json(
      { error: "Your comment could not be saved. Please try again." },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }
}
