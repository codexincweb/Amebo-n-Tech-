import Link from "next/link";
import { format } from "date-fns";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const posts = await db.post.findMany({
    where: { published: true },
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true, slug: true, excerpt: true, coverImage: true, createdAt: true },
    take: 24
  });
  const [featured, ...rest] = posts;

  return (
    <main>
      <section className="site-container pt-10 sm:pt-16">
        <div className="hero-panel overflow-hidden rounded-[2rem] px-6 py-10 sm:px-12 sm:py-14 lg:px-16">
          <div className="max-w-3xl">
            <p className="eyebrow text-moss">TECH, CULTURE & THE IDEAS BETWEEN</p>
            <h1 className="mt-5 text-4xl font-semibold leading-[1.08] tracking-[-0.045em] sm:text-6xl lg:text-7xl">The tech world,<br /><span className="text-moss">without the noise.</span></h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-stone-600 sm:text-lg sm:leading-8">Stories, explainers, and fresh perspectives on the technology shaping how we live, work, and build.</p>
            <a href="#latest" className="button-primary mt-8 inline-flex">Explore the stories <span aria-hidden="true">↘</span></a>
          </div>
          <div className="hero-stamp" aria-hidden="true"><span>CURIOUS<br />BY NATURE</span><span className="stamp-mark">A/T</span></div>
        </div>
      </section>

      <section id="latest" className="site-container py-14 sm:py-20">
        <div className="mb-7 flex items-end justify-between gap-4">
          <div><p className="eyebrow">THE READING LIST</p><h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Latest stories</h2></div>
          <span className="hidden text-sm text-stone-500 sm:block">Ideas worth your time.</span>
        </div>

        {posts.length === 0 ? (
          <div className="panel px-6 py-16 text-center sm:py-20">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-lime text-xl font-bold text-ink">A/T</span>
            <h3 className="mt-5 text-xl font-semibold">The next good story starts here.</h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-stone-500">We&apos;re preparing the first articles. Check back soon for technology stories, guides, and perspectives.</p>
          </div>
        ) : (
          <>
            {featured && (
              <Link href={`/blog/${featured.slug}`} className="featured-story group mb-6 grid overflow-hidden rounded-3xl border border-stone-200 bg-white md:grid-cols-2">
                <div className="story-image-wrap min-h-64 bg-stone-100 md:min-h-[360px]">
                  {featured.coverImage ? <img src={featured.coverImage} alt="" className="story-image" /> : <div className="image-placeholder"><span>A/T</span></div>}
                </div>
                <div className="flex flex-col justify-center p-6 sm:p-10 lg:p-12">
                  <span className="eyebrow">FEATURED STORY · {format(featured.createdAt, "dd MMM yyyy").toUpperCase()}</span>
                  <h3 className="mt-4 text-3xl font-semibold leading-tight tracking-tight group-hover:text-moss sm:text-4xl">{featured.title}</h3>
                  <p className="mt-4 leading-7 text-stone-500">{featured.excerpt}</p>
                  <span className="mt-7 font-semibold text-moss">Read the story <span aria-hidden="true">↗</span></span>
                </div>
              </Link>
            )}
            {rest.length > 0 && <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {rest.map((post) => (
                <article key={post.id} className="story-card group">
                  <Link href={`/blog/${post.slug}`} className="block">
                    <div className="story-image-wrap aspect-[1.45] bg-stone-100">
                      {post.coverImage ? <img src={post.coverImage} alt="" className="story-image" /> : <div className="image-placeholder"><span>A/T</span></div>}
                    </div>
                    <div className="p-5">
                      <p className="text-xs font-medium uppercase tracking-[0.13em] text-stone-400">{format(post.createdAt, "dd MMM yyyy")}</p>
                      <h3 className="mt-3 text-xl font-semibold leading-snug tracking-tight group-hover:text-moss">{post.title}</h3>
                      <p className="mt-3 line-clamp-3 text-sm leading-6 text-stone-500">{post.excerpt}</p>
                      <span className="mt-5 inline-block text-sm font-semibold text-moss">Read article ↗</span>
                    </div>
                  </Link>
                </article>
              ))}
            </div>}
          </>
        )}
      </section>
      <section className="site-container pb-16 sm:pb-24">
        <div className="newsletter-panel flex flex-col gap-5 rounded-3xl p-7 sm:flex-row sm:items-center sm:justify-between sm:p-10">
          <div><p className="eyebrow">STAY CURIOUS</p><h2 className="mt-2 text-2xl font-semibold tracking-tight">Good ideas travel.</h2><p className="mt-2 text-sm leading-6 text-stone-500">Follow along for thoughtful takes on the digital world.</p></div>
          <a className="button-secondary self-start sm:self-auto" href="mailto:hello@amebontech.com?subject=Amebo%20%27n%20Tech%20updates">Get in touch ↗</a>
        </div>
      </section>
    </main>
  );
}
