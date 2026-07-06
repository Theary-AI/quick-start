import { ConnectionPanel } from '@/components/ConnectionPanel'
import { ProductCard } from '@/components/ProductCard'
import { PRODUCTS } from '@/lib/products/registry'

const STEPS = [
  { n: 1, title: 'Add your credentials', body: 'Copy .env.example to .env.local and paste the JWT you received from SNH AI.' },
  { n: 2, title: 'Start a tunnel', body: 'Run npm run tunnel (ngrok) so the platform can reach your local webhook endpoint.' },
  { n: 3, title: 'Submit an order', body: 'Open a product, tweak the sample applicant, and send a verification order.' },
  { n: 4, title: 'Watch webhooks', body: 'Live events stream in as the verification progresses — each one signature-checked.' },
]

const HIGHLIGHTS = ['Next.js 15 + TypeScript', 'HMAC-signed webhooks', 'Local ngrok tunnel', 'No infra required']

export default function HomePage() {
  return (
    <div className="space-y-16">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-16 shadow-elevate-md sm:px-12 sm:py-20">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-grid" />
          <div className="aurora animate-aurora -left-24 -top-24 h-72 w-72 bg-[radial-gradient(circle,#a78bfa,transparent_70%)]" />
          <div
            className="aurora animate-aurora right-0 -top-16 h-80 w-80 bg-[radial-gradient(circle,#818cf8,transparent_70%)]"
            style={{ animationDelay: '3s' }}
          />
          <div
            className="aurora animate-aurora -bottom-32 left-1/3 h-72 w-72 bg-[radial-gradient(circle,#c4b5fd,transparent_70%)]"
            style={{ animationDelay: '6s' }}
          />
        </div>

        <div className="relative max-w-2xl">
          <span className="animate-rise inline-flex items-center gap-2 rounded-full border border-[var(--color-accent)]/25 bg-[var(--color-accent-soft)] px-3 py-1 text-xs font-medium text-[var(--color-accent-strong)]">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--color-accent)] opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]" />
            </span>
            Sandbox-ready
          </span>

          <h1 className="animate-rise mt-5 text-4xl font-semibold leading-[1.08] tracking-tight text-[var(--color-ink)] sm:text-5xl" style={{ animationDelay: '60ms' }}>
            Explore CRA digital employees by <span className="text-gradient">SNH AI</span>
          </h1>

          <p className="animate-rise mt-5 max-w-xl text-base font-light leading-relaxed text-[var(--color-muted)] sm:text-lg" style={{ animationDelay: '120ms' }}>
            A minimal, production-shaped Next.js + TypeScript integration. Submit real orders against the sandbox API and
            receive webhook callbacks on your machine through an ngrok tunnel.
          </p>

          <div className="animate-rise mt-8 flex flex-wrap items-center gap-3" style={{ animationDelay: '180ms' }}>
            <a
              href="#products"
              className="btn-shine inline-flex items-center gap-2 rounded-lg bg-[var(--color-accent)] px-5 py-2.5 text-sm font-semibold text-white shadow-[var(--elevate-accent)] transition hover:bg-[var(--color-accent-strong)]"
            >
              Explore products
            </a>
            <a
              href="https://api.theary.ai/docs"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-2.5 text-sm font-medium text-[var(--color-body)] transition hover:border-[var(--color-accent)]/40 hover:text-[var(--color-ink)]"
            >
              Read the docs <span aria-hidden className="text-[var(--color-subtle)]">↗</span>
            </a>
          </div>

          <ul className="animate-rise mt-8 flex flex-wrap gap-x-5 gap-y-2" style={{ animationDelay: '240ms' }}>
            {HIGHLIGHTS.map((h) => (
              <li key={h} className="flex items-center gap-1.5 text-xs text-[var(--color-muted)]">
                <svg className="h-3.5 w-3.5 text-[var(--color-accent)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                {h}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Getting started */}
      <section className="space-y-5">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-semibold text-[var(--color-ink)]">Getting started</h2>
          <span className="text-sm text-[var(--color-subtle)]">Four steps to your first webhook</span>
        </div>
        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <div className="grid gap-4 sm:grid-cols-2">
            {STEPS.map((s) => (
              <div
                key={s.n}
                className="card-lift group relative overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-elevate-sm"
              >
                <span className="absolute inset-x-0 top-0 h-0.5 origin-left scale-x-0 bg-[image:var(--gradient-brand)] transition-transform duration-300 group-hover:scale-x-100" />
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[image:var(--gradient-brand)] text-sm font-semibold text-white shadow-elevate-sm">
                  {s.n}
                </div>
                <h3 className="mt-3.5 text-sm font-semibold text-[var(--color-ink)]">{s.title}</h3>
                <p className="mt-1 text-sm font-light leading-relaxed text-[var(--color-muted)]">{s.body}</p>
              </div>
            ))}
          </div>
          <ConnectionPanel />
        </div>
      </section>

      {/* Products */}
      <section id="products" className="scroll-mt-24 space-y-5">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-semibold text-[var(--color-ink)]">Products</h2>
          <span className="text-sm text-[var(--color-subtle)]">{PRODUCTS.length} available · more on the way</span>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {PRODUCTS.map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </div>
      </section>
    </div>
  )
}
