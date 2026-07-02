import Link from 'next/link'
import type { ProductMeta } from '@/lib/products/registry'
import { Icon } from './Icon'

/** Static accent classes (Tailwind needs literal class names, not interpolated). */
const ACCENTS: Record<string, { text: string; grad: string; glow: string; hoverBorder: string }> = {
  violet: {
    text: 'text-violet-700',
    grad: 'bg-[linear-gradient(135deg,#8b5cf6,#6366f1)]',
    glow: 'group-hover:shadow-[0_18px_40px_-12px_rgba(139,92,246,0.45)]',
    hoverBorder: 'hover:border-violet-300',
  },
  emerald: {
    text: 'text-emerald-700',
    grad: 'bg-[linear-gradient(135deg,#10b981,#14b8a6)]',
    glow: 'group-hover:shadow-[0_18px_40px_-12px_rgba(16,185,129,0.45)]',
    hoverBorder: 'hover:border-emerald-300',
  },
  amber: {
    text: 'text-amber-700',
    grad: 'bg-[linear-gradient(135deg,#f59e0b,#f97316)]',
    glow: 'group-hover:shadow-[0_18px_40px_-12px_rgba(245,158,11,0.45)]',
    hoverBorder: 'hover:border-amber-300',
  },
}

export function ProductCard({ product }: { product: ProductMeta }) {
  const accent = ACCENTS[product.accent] ?? ACCENTS.violet
  const isLive = product.status === 'live'

  const inner = (
    <div
      className={`group relative flex h-full flex-col rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-elevate-sm ${
        isLive ? `card-lift ${accent.glow} ${accent.hoverBorder}` : 'opacity-70'
      }`}
    >
      <div className="flex items-start justify-between">
        <span className={`flex h-11 w-11 items-center justify-center rounded-xl text-white shadow-elevate-sm ${accent.grad}`}>
          <Icon name={product.icon} className="h-5 w-5" />
        </span>
        {isLive ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
            </span>
            Live
          </span>
        ) : (
          <span className="rounded-full bg-[var(--color-surface-2)] px-2.5 py-1 text-xs font-medium text-[var(--color-muted)] ring-1 ring-[var(--color-border)]">
            Coming soon
          </span>
        )}
      </div>

      <h3 className="mt-4 text-base font-semibold text-[var(--color-ink)]">{product.name}</h3>
      <p className={`mt-0.5 text-sm font-medium ${accent.text}`}>{product.tagline}</p>
      <p className="mt-3 text-sm font-light leading-relaxed text-[var(--color-muted)]">{product.description}</p>

      <ul className="mt-4 flex flex-wrap gap-1.5">
        {product.capabilities.map((c) => (
          <li key={c} className="rounded-md bg-[var(--color-surface-2)] px-2 py-1 text-xs text-[var(--color-muted)] ring-1 ring-[var(--color-border)]">
            {c}
          </li>
        ))}
      </ul>

      <div className="mt-auto flex items-center justify-between pt-5">
        {isLive ? (
          <span className={`inline-flex items-center gap-1.5 text-sm font-semibold ${accent.text}`}>
            Open quickstart <Icon name="arrow" className="h-4 w-4 transition group-hover:translate-x-1" />
          </span>
        ) : (
          <span className="text-sm text-[var(--color-subtle)]">Same order + webhook pattern</span>
        )}
      </div>
    </div>
  )

  if (!isLive) return inner
  return (
    <Link href={`/${product.slug}`} className="block h-full">
      {inner}
    </Link>
  )
}
