"use client";

import { FormEvent, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Login failed.");
      const next = searchParams.get("next");
      router.replace(next?.startsWith("/admin") && next !== "/admin/login" ? next : "/admin");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-[75vh] max-w-md items-center px-5 py-16">
      <form onSubmit={submit} className="panel w-full p-8 sm:p-10">
        <p className="eyebrow">PRIVATE WORKSPACE</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">Welcome back.</h1>
        <p className="mt-3 text-sm leading-6 text-stone-500">Sign in to manage Amebo &apos;n Tech stories.</p>
        <label className="field-label mt-8" htmlFor="password">Admin password</label>
        <input
          className="field mt-2"
          id="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
        {error && <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}
        <button className="button-primary mt-6 w-full" disabled={busy}>
          {busy ? "Signing in…" : "Sign in"}
        </button>
        <Link href="/" className="mt-5 block text-center text-sm text-stone-500 hover:text-ink">← Back to the publication</Link>
      </form>
    </main>
  );
}

export default function AdminLoginPage() {
  return <Suspense fallback={<main className="min-h-[70vh]" />}><LoginForm /></Suspense>;
}
