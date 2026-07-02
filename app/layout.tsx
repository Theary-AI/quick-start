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
      <body className="min-h-screen antialiased">
        <header className="sticky top-0 z-20 border-b border-[var(--color-border)] bg-[var(--color-canvas)]/80 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
            <Link href="/" className="flex items-center gap-2.5">
              <Image src="/snh-logo.png" alt="SNH AI" width={28} height={28} className="h-7 w-7" priority />
              <span className="text-sm font-semibold tracking-tight text-[var(--color-ink)]">SNH AI</span>
              <span className="text-sm text-[var(--color-muted)]">Integration Quickstart</span>
            </Link>
            <a
              href="https://api.theary.ai/docs"
              target="_blank"
              rel="noreferrer"
              className="text-sm text-[var(--color-muted)] transition hover:text-[var(--color-ink)]"
            >
              API Docs ↗
            </a>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
        <footer className="mx-auto max-w-6xl px-6 py-10 text-xs text-[var(--color-subtle)]">
          This is a demo integration. Keep your JWT and webhook secret in{' '}
          <code className="font-mono text-[var(--color-muted)]">.env.local</code> — they never leave the server.
        </footer>
      </body>
    </html>
  )
}
