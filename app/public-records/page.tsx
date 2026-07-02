import { CodeExplorer } from '@/components/CodeExplorer'
import { ProductHeader } from '@/components/ProductHeader'
import { getProduct } from '@/lib/products/registry'
import { SNIPPETS, SNIPPET_GROUPS } from '@/lib/products/public-records/snippets'
import { EvaluateConsole } from './EvaluateConsole'

export default function PublicRecordsPage() {
  const product = getProduct('public-records')!

  return (
    <div className="space-y-8">
      <ProductHeader product={product} />
      <EvaluateConsole />

      <section className="space-y-5 border-t border-[var(--color-border)] pt-8">
        <div className="flex items-baseline justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[var(--color-ink)]">Integration code</h2>
            <p className="mt-1 max-w-2xl text-sm font-light leading-relaxed text-[var(--color-muted)]">
              Copy-paste examples for the synchronous evaluate flow — exchange your API key for a token, POST a record to{' '}
              <code className="font-mono text-[var(--color-body)]">/evaluate</code>, and route on the decision it returns.
            </p>
          </div>
        </div>
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-elevate-sm sm:p-6">
          <CodeExplorer
            snippets={SNIPPETS}
            groups={SNIPPET_GROUPS}
            sequentialGroups={['Call the API', 'Read the decision']}
            accent="emerald"
          />
        </div>
      </section>
    </div>
  )
}
