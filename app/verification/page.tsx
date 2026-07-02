import { CodeExplorer } from '@/components/CodeExplorer'
import { ConnectionPanel } from '@/components/ConnectionPanel'
import { ProductHeader } from '@/components/ProductHeader'
import { getProduct } from '@/lib/products/registry'
import { OrderConsole } from './OrderConsole'

export default function VerificationPage() {
  const product = getProduct('verification')!

  return (
    <div className="space-y-8">
      <ProductHeader product={product} />
      <ConnectionPanel product="verification" />
      <OrderConsole />

      <section className="space-y-5 border-t border-[var(--color-border)] pt-8">
        <div className="flex items-baseline justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[var(--color-ink)]">Integration code</h2>
            <p className="mt-1 max-w-2xl text-sm font-light leading-relaxed text-[var(--color-muted)]">
              Copy-paste examples for calling the API and handling every webhook form —{' '}
              <code className="font-mono text-[var(--color-body)]">verification.completed</code>,{' '}
              <code className="font-mono text-[var(--color-body)]">verification.notification</code>, and{' '}
              <code className="font-mono text-[var(--color-body)]">verification.action_required</code>.
            </p>
          </div>
        </div>
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-elevate-sm sm:p-6">
          <CodeExplorer />
        </div>
      </section>
    </div>
  )
}
