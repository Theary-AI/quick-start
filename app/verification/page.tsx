import Link from 'next/link'
import { ConnectionPanel } from '@/components/ConnectionPanel'
import { getProduct } from '@/lib/products/registry'
import { OrderConsole } from './OrderConsole'

export default function VerificationPage() {
  const product = getProduct('verification')!

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

      <ConnectionPanel product="verification" />
      <OrderConsole />
    </div>
  )
}
