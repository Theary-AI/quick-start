import Link from 'next/link'
import type { ProductMeta } from '@/lib/products/registry'
import { Icon } from './Icon'

/** Static accent classes (Tailwind needs literal class names, not interpolated). */
const ACCENTS: Record<string, { ring: string; text: string; bg: string; dot: string }> = {
  indigo: { ring: 'ring-indigo-500/30', text: 'text-indigo-300', bg: 'bg-indigo-500/10', dot: 'bg-indigo-400' },
  emerald: { ring: 'ring-emerald-500/30', text: 'text-emerald-300', bg: 'bg-emerald-500/10', dot: 'bg-emerald-400' },
  amber: { ring: 'ring-amber-500/30', text: 'text-amber-300', bg: 'bg-amber-500/10', dot: 'bg-amber-400' },
}

export function ProductCard({ product }: { product: ProductMeta }) {
  const accent = ACCENTS[product.accent] ?? ACCENTS.indigo
  const isLive = product.status === 'live'

  const inner = (
    <div
      className={`group relative flex h-full flex-col rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 transition ${
        isLive ? 'hover:border-zinc-600 hover:bg-[var(--color-surface-2)]' : 'opacity-70'
      }`}
    >
      <div className="flex items-start justify-between">
        <span className={`flex h-10 w-10 items-center justify-center rounded-lg ${accent.bg} ${accent.text} ring-1 ${accent.ring}`}>
          <Icon name={product.icon} className="h-5 w-5" />
        </span>
        {isLive ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-300 ring-1 ring-emerald-500/30">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Live
          </span>
        ) : (
          <span className="rounded-full bg-zinc-700/40 px-2.5 py-1 text-xs font-medium text-zinc-400 ring-1 ring-zinc-600/40">
            Coming soon
          </span>
        )}
      </div>

      <h3 className="mt-4 text-base font-semibold text-zinc-100">{product.name}</h3>
      <p className={`mt-0.5 text-sm ${accent.text}`}>{product.tagline}</p>
      <p className="mt-3 text-sm leading-relaxed text-zinc-400">{product.description}</p>

      <ul className="mt-4 flex flex-wrap gap-1.5">
        {product.capabilities.map((c) => (
          <li key={c} className="rounded-md bg-[var(--color-surface-2)] px-2 py-1 text-xs text-zinc-400 ring-1 ring-[var(--color-border)]">
            {c}
          </li>
        ))}
      </ul>

      <div className="mt-5 flex items-center justify-between pt-1">
        {isLive ? (
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-100">
            Open quickstart <Icon name="arrow" className="h-4 w-4 transition group-hover:translate-x-0.5" />
          </span>
        ) : (
          <span className="text-sm text-zinc-500">Same order + webhook pattern</span>
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
