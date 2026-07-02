import Link from 'next/link'
import { getProduct } from '@/lib/products/registry'
import { EvaluateConsole } from './EvaluateConsole'

export default function PublicRecordsPage() {
  const product = getProduct('public-records')!

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <Link href="/" className="text-sm text-[var(--color-muted)] transition hover:text-[var(--color-ink)]">
          ← All products
        </Link>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-ink)]">{product.name}</h1>
          <p className="mt-1 max-w-2xl text-sm font-light leading-relaxed text-[var(--color-muted)]">{product.description}</p>
        </div>
      </div>

      <EvaluateConsole />
    </div>
  )
}
