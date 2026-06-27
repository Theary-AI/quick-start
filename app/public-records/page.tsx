import Link from 'next/link'
import { getProduct } from '@/lib/products/registry'
import { EvaluateConsole } from './EvaluateConsole'

export default function PublicRecordsPage() {
  const product = getProduct('public-records')!

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <Link href="/" className="text-sm text-zinc-500 transition hover:text-zinc-300">
          ← All products
        </Link>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">{product.name}</h1>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-zinc-400">{product.description}</p>
        </div>
      </div>

      <EvaluateConsole />
    </div>
  )
}
