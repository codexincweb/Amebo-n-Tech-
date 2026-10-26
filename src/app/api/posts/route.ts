import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminRequest } from "@/lib/auth";
import { cleanText, makeSlug } from "@/lib/posts";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const admin = await isAdminRequest();
  const includeDrafts = request.nextUrl.searchParams.get("includeDrafts") === "1";
  const posts = await db.post.findMany({
    where: admin && includeDrafts ? {} : { published: true },
    orderBy: { createdAt: "desc" },
    select: {
      id: true, title: true, slug: true, excerpt: true, coverImage: true,
      published: true, createdAt: true, updatedAt: true
    }
  });
  return NextResponse.json({ posts });
}

export async function POST(request: NextRequest) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const title = cleanText(body.title, 180);
  const excerpt = cleanText(body.excerpt, 500);
  const content = cleanText(body.content, 100000);
  const coverImage = cleanText(body.coverImage, 2000) || null;
  const published = body.published === true;

  if (!title || !excerpt || !content) {
    return NextResponse.json({ error: "Title, excerpt, and content are required." }, { status: 400 });
  }

  const baseSlug = makeSlug(title);
  let slug = baseSlug;
  let suffix = 2;
  while (await db.post.findUnique({ where: { slug }, select: { id: true } })) {
    slug = `${baseSlug}-${suffix++}`;
  }

  const post = await db.post.create({
    data: { title, slug, excerpt, content, coverImage, published }
  });
  return NextResponse.json({ post }, { status: 201 });
}
