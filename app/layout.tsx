import type { Metadata } from 'next'
import Link from 'next/link'
import './globals.css'

export const metadata: Metadata = {
  title: 'SNH AI — Integration Quickstart',
  description: 'Kick the tires on the SNH AI API platform: submit verification orders and receive webhooks locally via ngrok.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <header className="sticky top-0 z-20 border-b border-[var(--color-border)] bg-[var(--color-canvas)]/80 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
            <Link href="/" className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-indigo-500/15 text-indigo-300 ring-1 ring-indigo-500/30">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </span>
              <span className="text-sm font-semibold tracking-tight">SNH AI</span>
              <span className="text-sm text-zinc-500">Integration Quickstart</span>
            </Link>
            <a
              href="https://api.theary.ai/docs"
              target="_blank"
              rel="noreferrer"
              className="text-sm text-zinc-400 transition hover:text-zinc-100"
            >
              API Docs ↗
            </a>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
        <footer className="mx-auto max-w-6xl px-6 py-10 text-xs text-zinc-600">
          This is a demo integration. Keep your JWT and webhook secret in <code className="text-zinc-500">.env.local</code> —
          they never leave the server.
        </footer>
      </body>
    </html>
  )
}
