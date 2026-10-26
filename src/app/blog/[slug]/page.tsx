import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { db } from "@/lib/db";
import CommentSection from "@/components/CommentSection";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await db.post.findFirst({ where: { slug, published: true } });
  if (!post) return { title: "Story not found | Amebo 'n Tech" };
  return {
    title: `${post.title} | Amebo 'n Tech`,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      publishedTime: post.createdAt.toISOString(),
      images: post.coverImage ? [post.coverImage] : []
    }
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await db.post.findFirst({ where: { slug, published: true } });
  if (!post) notFound();

  return (
    <main className="site-container max-w-4xl py-8 sm:py-14">
      <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-stone-500 hover:text-moss">← All stories</Link>
      <article className="mt-8">
        <header className="mx-auto max-w-3xl">
          <p className="eyebrow">AMEBO &apos;N TECH · {format(post.createdAt, "dd MMMM yyyy").toUpperCase()}</p>
          <h1 className="mt-5 text-4xl font-semibold leading-[1.1] tracking-[-0.04em] sm:text-6xl">{post.title}</h1>
          <p className="mt-6 text-lg leading-8 text-stone-500 sm:text-xl">{post.excerpt}</p>
        </header>
        {post.coverImage && <div className="mt-9 overflow-hidden rounded-3xl bg-stone-100 sm:mt-12"><img src={post.coverImage} alt="" className="max-h-[560px] w-full object-cover" /></div>}
        <div className="prose-article mx-auto mt-10 max-w-3xl sm:mt-14">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content}</ReactMarkdown>
        </div>
      </article>
      <CommentSection slug={post.slug} />
      <div className="mx-auto mt-14 max-w-3xl border-t border-stone-200 pt-7">
        <p className="text-sm text-stone-500">You&apos;ve reached the end of this story.</p>
        <Link href="/" className="mt-3 inline-flex font-semibold text-moss hover:underline">Discover more stories ↗</Link>
      </div>
    </main>
  );
}
