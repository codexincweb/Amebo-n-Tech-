import PostEditor from "@/components/PostEditor";

export default function NewPostPage() {
  return (
    <main className="site-container max-w-4xl py-10 sm:py-14">
      <p className="eyebrow">EDITORIAL WORKSPACE / NEW STORY</p>
      <h1 className="mt-2 text-4xl font-semibold tracking-tight">Write something worth reading.</h1>
      <p className="mt-3 text-stone-500">A good headline gets attention. A good story earns it.</p>
      <PostEditor mode="create" />
    </main>
  );
}
