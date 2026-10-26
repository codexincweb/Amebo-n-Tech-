import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: {
    default: "Amebo 'n Tech — The tech world, without the noise",
    template: "%s | Amebo 'n Tech"
  },
  description: "Stories, explainers, and fresh perspectives on the technology shaping how we live, work, and build.",
  applicationName: "Amebo 'n Tech",
  openGraph: {
    siteName: "Amebo 'n Tech",
    title: "Amebo 'n Tech",
    description: "The tech world, without the noise.",
    type: "website"
  },
  robots: { index: true, follow: true }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f8f8f5"
};

function BrandMark() {
  return (
    <svg viewBox="0 0 48 48" role="img" aria-label="Amebo 'n Tech logo" className="h-10 w-10 shrink-0">
      <rect x="1" y="1" width="46" height="46" rx="14" fill="#17201d" />
      <path d="M12 33 22.5 11h4L37 33h-7l-2-5H20l-2 5z" fill="#c6f36b" />
      <path d="m22.1 22.7-2 4.4h6.1l-2-4.4-1-2.6z" fill="#17201d" />
      <path d="M31.5 13.5h5v5h-5z" fill="#f8f8f5" />
    </svg>
  );
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <div className="site-container flex h-[76px] items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-3" aria-label="Amebo 'n Tech home">
              <BrandMark />
              <span className="brand-wordmark">Amebo <span className="text-moss">&apos;n</span> Tech<span className="brand-period">.</span></span>
            </Link>
            <nav className="flex items-center gap-5 sm:gap-8" aria-label="Main navigation">
              <Link href="/#latest" className="nav-link">Stories</Link>
              <a href="mailto:hello@amebontech.com" className="nav-link hidden sm:inline">Contact</a>
              <Link href="/admin/login" className="nav-admin">Admin <span aria-hidden="true">↗</span></Link>
            </nav>
          </div>
        </header>
        {children}
        <footer className="site-footer">
          <div className="site-container flex flex-col gap-5 py-8 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3"><BrandMark /><div><p className="font-semibold">Amebo &apos;n Tech</p><p className="mt-1 text-xs text-stone-500">Curiosity for a connected world.</p></div></div>
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-stone-500"><a className="hover:text-ink" href="mailto:hello@amebontech.com">Contact</a><Link className="hover:text-ink" href="/">Home</Link><span>© {new Date().getFullYear()} Amebo &apos;n Tech</span></div>
          </div>
        </footer>
      </body>
    </html>
  );
}
