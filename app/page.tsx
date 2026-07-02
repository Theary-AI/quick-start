import { ConnectionPanel } from '@/components/ConnectionPanel'
import { ProductCard } from '@/components/ProductCard'
import { PRODUCTS } from '@/lib/products/registry'

const STEPS = [
  { n: 1, title: 'Add your credentials', body: 'Copy .env.example to .env.local and paste the JWT you received from SNH AI.' },
  { n: 2, title: 'Start a tunnel', body: 'Run npm run tunnel (ngrok) so the platform can reach your local webhook endpoint.' },
  { n: 3, title: 'Submit an order', body: 'Open a product, tweak the sample applicant, and send a verification order.' },
  { n: 4, title: 'Watch webhooks', body: 'Live events stream in as the verification progresses — each one signature-checked.' },
]

export default function HomePage() {
  return (
    <div className="space-y-12">
      <section className="space-y-4">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-accent-soft)] px-3 py-1 text-xs font-medium text-[var(--color-accent-strong)] ring-1 ring-[var(--color-accent)]/25">
          Sandbox-ready
        </span>
        <h1 className="max-w-2xl text-3xl font-semibold tracking-tight text-[var(--color-ink)] sm:text-4xl">
          Kick the tires on the SNH AI platform
        </h1>
        <p className="max-w-2xl text-base font-light leading-relaxed text-[var(--color-muted)]">
          A minimal, production-shaped Next.js + TypeScript integration. Submit real orders against the sandbox API and
          receive webhook callbacks on your machine through an ngrok tunnel — no infrastructure required.
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="grid gap-4 sm:grid-cols-2">
          {STEPS.map((s) => (
            <div key={s.n} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--color-accent-soft)] text-sm font-semibold text-[var(--color-accent-strong)] ring-1 ring-[var(--color-accent)]/25">
                {s.n}
              </div>
              <h3 className="mt-3 text-sm font-semibold text-[var(--color-ink)]">{s.title}</h3>
              <p className="mt-1 text-sm font-light leading-relaxed text-[var(--color-muted)]">{s.body}</p>
            </div>
          ))}
        </div>
        <ConnectionPanel />
      </section>

      <section className="space-y-4">
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
