import Link from 'next/link'
import type { ProductMeta } from '@/lib/products/registry'
import { Icon } from './Icon'

/** Static accent classes (Tailwind needs literal class names, not interpolated). */
const ACCENTS: Record<string, { ring: string; text: string; bg: string; dot: string }> = {
  violet: { ring: 'ring-violet-200', text: 'text-violet-700', bg: 'bg-violet-50', dot: 'bg-violet-500' },
  emerald: { ring: 'ring-emerald-200', text: 'text-emerald-700', bg: 'bg-emerald-50', dot: 'bg-emerald-500' },
  amber: { ring: 'ring-amber-200', text: 'text-amber-700', bg: 'bg-amber-50', dot: 'bg-amber-500' },
}

export function ProductCard({ product }: { product: ProductMeta }) {
  const accent = ACCENTS[product.accent] ?? ACCENTS.violet
  const isLive = product.status === 'live'

  const inner = (
    <div
      className={`group relative flex h-full flex-col rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm transition ${
        isLive ? 'hover:border-[var(--color-accent)]/40 hover:shadow-md' : 'opacity-70'
      }`}
    >
      <div className="flex items-start justify-between">
        <span className={`flex h-10 w-10 items-center justify-center rounded-lg ${accent.bg} ${accent.text} ring-1 ${accent.ring}`}>
          <Icon name={product.icon} className="h-5 w-5" />
        </span>
        {isLive ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Live
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

      <div className="mt-5 flex items-center justify-between pt-1">
        {isLive ? (
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-ink)]">
            Open quickstart <Icon name="arrow" className="h-4 w-4 transition group-hover:translate-x-0.5" />
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
