import { ProductHeader } from '@/components/ProductHeader'
import { getProduct } from '@/lib/products/registry'
import { EvaluateConsole } from './EvaluateConsole'

export default function PublicRecordsPage() {
  const product = getProduct('public-records')!

  return (
    <div className="space-y-8">
      <ProductHeader product={product} />
      <EvaluateConsole />
    </div>
  )
}
