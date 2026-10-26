import Link from "next/link";
import { format } from "date-fns";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { isAdminRequest } from "@/lib/auth";
import LogoutButton from "@/components/LogoutButton";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  if (!(await isAdminRequest())) redirect("/admin/login");

  const posts = await db.post.findMany({ orderBy: { updatedAt: "desc" } });
  const publishedCount = posts.filter((post) => post.published).length;
  const draftCount = posts.length - publishedCount;

  return (
    <main className="site-container py-10 sm:py-14">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">EDITORIAL WORKSPACE</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight">Your stories.</h1>
          <p className="mt-2 text-stone-500">Create, edit, and publish the next story.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <LogoutButton />
          <Link href="/admin/new" className="button-primary">＋ New article</Link>
        </div>
      </div>

      <div className="mt-9 grid gap-4 sm:grid-cols-3">
        <div className="stat-card"><span>Total articles</span><strong>{posts.length}</strong></div>
        <div className="stat-card"><span>Published</span><strong>{publishedCount}</strong></div>
        <div className="stat-card"><span>Drafts</span><strong>{draftCount}</strong></div>
      </div>

      <section className="panel mt-8 overflow-hidden">
        <div className="flex items-center justify-between border-b border-stone-200 px-5 py-4 sm:px-6">
          <h2 className="font-semibold">All articles</h2>
          <span className="text-sm text-stone-500">{posts.length} total</span>
        </div>
        {posts.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <h3 className="text-lg font-semibold">A blank page is a beginning.</h3>
            <p className="mt-2 text-sm text-stone-500">Your first article can start here.</p>
            <Link className="button-primary mt-5 inline-flex" href="/admin/new">Write an article</Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px] text-left text-sm">
              <thead className="bg-stone-50 text-xs uppercase tracking-wider text-stone-500">
                <tr><th className="px-6 py-3 font-medium">Article</th><th className="px-6 py-3 font-medium">Status</th><th className="px-6 py-3 font-medium">Last updated</th><th className="px-6 py-3 text-right font-medium">Action</th></tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {posts.map((post) => (
                  <tr key={post.id} className="hover:bg-stone-50/70">
                    <td className="px-6 py-4"><div className="font-medium text-ink">{post.title}</div><div className="mt-1 max-w-sm truncate text-xs text-stone-500">{post.slug}</div></td>
                    <td className="px-6 py-4"><span className={post.published ? "badge-live" : "badge-draft"}>{post.published ? "Published" : "Draft"}</span></td>
                    <td className="px-6 py-4 text-stone-500">{format(post.updatedAt, "dd MMM yyyy")}</td>
                    <td className="px-6 py-4 text-right"><Link className="font-medium text-moss hover:underline" href={`/admin/${post.id}/edit`}>Edit →</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
