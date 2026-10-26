"use client";

import { FormEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type InitialPost = {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  coverImage: string;
  published: boolean;
};

export default function PostEditor({ mode, post }: { mode: "create" | "edit"; post?: InitialPost }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState(post?.title ?? "");
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? "");
  const [content, setContent] = useState(post?.content ?? "");
  const [coverImage, setCoverImage] = useState(post?.coverImage ?? "");
  const [published, setPublished] = useState(post?.published ?? false);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function uploadImage(file?: File) {
    if (!file) return;
    setError("");
    setNotice("");
    setUploading(true);
    try {
      const formData = new FormData();
      formData.set("file", file);
      const response = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Upload failed.");
      setCoverImage(data.secureUrl);
      setNotice("Cover image uploaded.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const endpoint = mode === "create" ? "/api/posts" : `/api/posts/${post!.id}`;
      const response = await fetch(endpoint, {
        method: mode === "create" ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, excerpt, content, coverImage, published })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not save the article.");
      router.push("/admin");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the article.");
    } finally {
      setBusy(false);
    }
  }

  async function removePost() {
    if (!post || !window.confirm("Delete this article permanently?")) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/posts/${post.id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not delete the article.");
      router.push("/admin");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete the article.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="panel mt-8 space-y-7 p-5 sm:p-8">
      <div>
        <label className="field-label" htmlFor="title">Headline</label>
        <input id="title" className="field mt-2" maxLength={180} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Give the story a clear, memorable title" required />
      </div>
      <div>
        <label className="field-label" htmlFor="excerpt">Short description</label>
        <textarea id="excerpt" className="field mt-2 min-h-24 resize-y" maxLength={500} value={excerpt} onChange={(e) => setExcerpt(e.target.value)} placeholder="A short summary for the homepage and search results" required />
        <p className="mt-1 text-right text-xs text-stone-400">{excerpt.length}/500</p>
      </div>
      <div>
        <label className="field-label" htmlFor="content">Article content · Markdown</label>
        <p className="mb-2 mt-1 text-xs text-stone-500">Use # for headings, **bold**, - for lists, and [text](https://example.com) for links.</p>
        <textarea id="content" className="field min-h-[360px] resize-y font-mono text-sm leading-6" value={content} onChange={(e) => setContent(e.target.value)} placeholder={"# Start your story\n\nWrite the first paragraph here..."} required />
      </div>
      <div>
        <label className="field-label">Cover image</label>
        <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-center">
          {coverImage ? (
            // Preview is remote; Cloudinary supplies the URL.
            <img src={coverImage} alt="Selected cover" className="h-28 w-44 rounded-xl border border-stone-200 object-cover" />
          ) : (
            <div className="flex h-28 w-44 items-center justify-center rounded-xl border border-dashed border-stone-300 bg-stone-50 text-xs text-stone-400">No cover selected</div>
          )}
          <div>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="sr-only" onChange={(e) => uploadImage(e.target.files?.[0])} />
            <button type="button" className="button-secondary" onClick={() => fileRef.current?.click()} disabled={uploading}>{uploading ? "Uploading…" : "Choose and upload image"}</button>
            <p className="mt-2 text-xs text-stone-500">JPG, PNG, WebP or AVIF · up to 5 MB</p>
            {coverImage && <button type="button" className="mt-2 text-xs text-red-600 hover:underline" onClick={() => setCoverImage("")}>Remove cover</button>}
          </div>
        </div>
      </div>
      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-stone-200 p-4">
        <input type="checkbox" className="mt-1 h-4 w-4 accent-moss" checked={published} onChange={(e) => setPublished(e.target.checked)} />
        <span><span className="block text-sm font-semibold">Publish this article</span><span className="mt-1 block text-xs leading-5 text-stone-500">Turn this off to save the article as a private draft.</span></span>
      </label>
      {(error || notice) && <p role={error ? "alert" : "status"} className={`text-sm ${error ? "text-red-600" : "text-moss"}`}>{error || notice}</p>}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-stone-200 pt-5">
        {mode === "edit" ? <button type="button" className="button-danger" onClick={removePost} disabled={busy}>Delete article</button> : <span className="text-xs text-stone-400">Changes are not public until published.</span>}
        <div className="ml-auto flex gap-3">
          <button type="button" className="button-secondary" onClick={() => router.push("/admin")}>Cancel</button>
          <button className="button-primary" disabled={busy || uploading}>{busy ? "Saving…" : mode === "create" ? "Save article" : "Update article"}</button>
        </div>
      </div>
    </form>
  );
}
