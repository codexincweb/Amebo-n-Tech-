import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import PostEditor from "@/components/PostEditor";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function EditPostPage({ params }: Props) {
  const { id } = await params;
  const post = await db.post.findUnique({ where: { id } });
  if (!post) notFound();

  return (
    <main className="site-container max-w-4xl py-10 sm:py-14">
      <p className="eyebrow">EDITORIAL WORKSPACE / EDIT STORY</p>
      <h1 className="mt-2 text-4xl font-semibold tracking-tight">Refine the story.</h1>
      <p className="mt-3 text-stone-500">Changes are saved to the publication when you update the article.</p>
      <PostEditor mode="edit" post={{
        id: post.id, title: post.title, excerpt: post.excerpt, content: post.content,
        coverImage: post.coverImage ?? "", published: post.published
      }} />
    </main>
  );
}
