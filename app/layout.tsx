import type { Metadata } from 'next'
import { Inter, IBM_Plex_Mono } from 'next/font/google'
import Image from 'next/image'
import Link from 'next/link'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
})

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-ibm-plex-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'SNH AI — Integration Quickstart',
  description: 'Kick the tires on the SNH AI API platform: submit verification orders and receive webhooks locally via ngrok.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${ibmPlexMono.variable}`}>
      <body className="flex min-h-screen flex-col antialiased">
        <header className="sticky top-0 z-30 border-b border-[var(--color-border)]/80 bg-[var(--color-canvas)]/70 backdrop-blur-xl">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
            <Link href="/" className="group flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-ink)] shadow-elevate-sm ring-1 ring-black/5 transition group-hover:scale-105">
                <Image src="/snh-logo-white.png" alt="SNH AI" width={18} height={18} className="h-[18px] w-[18px]" priority />
              </span>
              <span className="text-sm font-semibold tracking-tight text-[var(--color-ink)]">SNH AI</span>
              <span className="hidden h-4 w-px bg-[var(--color-border)] sm:block" />
              <span className="hidden text-sm font-light text-[var(--color-muted)] sm:block">Integration Quickstart</span>
            </Link>
            <a
              href="https://documentation.theary.ai"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-sm font-medium text-[var(--color-body)] shadow-elevate-sm transition hover:border-[var(--color-accent)]/40 hover:text-[var(--color-ink)]"
            >
              API Docs
              <span aria-hidden className="text-[var(--color-subtle)]">↗</span>
            </a>
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-12">{children}</main>
        <footer className="border-t border-[var(--color-border)] bg-[var(--color-surface)]/60">
          <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-8 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2.5">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[var(--color-ink)]">
                <Image src="/snh-logo-white.png" alt="" width={13} height={13} className="h-[13px] w-[13px]" />
              </span>
              <span className="text-xs text-[var(--color-muted)]">SNH AI — Integration Quickstart</span>
            </div>
            <p className="text-xs text-[var(--color-subtle)]">
              Demo integration. Keep your JWT &amp; webhook secret in{' '}
              <code className="font-mono text-[var(--color-muted)]">.env.local</code> — they never leave the server.
            </p>
          </div>
        </footer>
      </body>
    </html>
  )
}
