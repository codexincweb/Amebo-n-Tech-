import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminRequest } from "@/lib/auth";
import { cleanText, makeSlug } from "@/lib/posts";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const admin = await isAdminRequest();
  const post = await db.post.findFirst({
    where: admin ? { id } : { id, published: true }
  });
  if (!post) return NextResponse.json({ error: "Post not found." }, { status: 404 });
  return NextResponse.json({ post });
}

export async function PUT(request: NextRequest, context: RouteContext) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await context.params;
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const existing = await db.post.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Post not found." }, { status: 404 });

  const title = cleanText(body.title, 180);
  const excerpt = cleanText(body.excerpt, 500);
  const content = cleanText(body.content, 100000);
  const coverImage = cleanText(body.coverImage, 2000) || null;
  const published = body.published === true;

  if (!title || !excerpt || !content) {
    return NextResponse.json({ error: "Title, excerpt, and content are required." }, { status: 400 });
  }

  let slug = existing.slug;
  if (title !== existing.title) {
    const baseSlug = makeSlug(title);
    slug = baseSlug;
    let suffix = 2;
    while (true) {
      const match = await db.post.findUnique({ where: { slug }, select: { id: true } });
      if (!match || match.id === id) break;
      slug = `${baseSlug}-${suffix++}`;
    }
  }

  const post = await db.post.update({
    where: { id },
    data: { title, slug, excerpt, content, coverImage, published }
  });
  return NextResponse.json({ post });
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await context.params;
  const existing = await db.post.findUnique({ where: { id }, select: { id: true } });
  if (!existing) return NextResponse.json({ error: "Post not found." }, { status: 404 });
  await db.post.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
