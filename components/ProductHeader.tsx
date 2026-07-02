import Link from 'next/link'
import type { ProductMeta } from '@/lib/products/registry'
import { Icon } from './Icon'

const ACCENT_GRADIENT: Record<string, string> = {
  violet: 'bg-[linear-gradient(135deg,#8b5cf6,#6366f1)]',
  emerald: 'bg-[linear-gradient(135deg,#10b981,#14b8a6)]',
  amber: 'bg-[linear-gradient(135deg,#f59e0b,#f97316)]',
}

const ACCENT_TEXT: Record<string, string> = {
  violet: 'text-violet-700',
  emerald: 'text-emerald-700',
  amber: 'text-amber-700',
}

export function ProductHeader({ product }: { product: ProductMeta }) {
  const grad = ACCENT_GRADIENT[product.accent] ?? ACCENT_GRADIENT.violet
  const text = ACCENT_TEXT[product.accent] ?? ACCENT_TEXT.violet

  return (
    <div className="space-y-5">
      <Link
        href="/"
        className="group inline-flex items-center gap-1.5 text-sm text-[var(--color-muted)] transition hover:text-[var(--color-ink)]"
      >
        <span aria-hidden className="transition-transform group-hover:-translate-x-0.5">←</span> All products
      </Link>
      <div className="flex items-start gap-4">
        <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white shadow-elevate-sm ${grad}`}>
          <Icon name={product.icon} className="h-6 w-6" />
        </span>
        <div>
          <p className={`text-xs font-semibold uppercase tracking-wide ${text}`}>{product.tagline}</p>
          <h1 className="mt-0.5 text-2xl font-semibold tracking-tight text-[var(--color-ink)] sm:text-3xl">{product.name}</h1>
          <p className="mt-2 max-w-2xl text-sm font-light leading-relaxed text-[var(--color-muted)]">{product.description}</p>
        </div>
      </div>
    </div>
  )
}
