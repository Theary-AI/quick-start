/**
 * Product registry.
 *
 * This is the single place that lists every product a client can explore in the
 * quickstart. It is browser-safe metadata only (no secrets, no server imports).
 *
 * To add a new product (e.g. Public Records):
 *   1. Add an entry here with `status: 'live'`.
 *   2. Create `lib/products/<slug>/` with its types, sample payload, and a
 *      server-side `createOrder`/client module.
 *   3. Add a route under `app/api/products/<slug>/...` that proxies the call.
 *   4. Add a page under `app/<slug>/page.tsx` (copy the verification page).
 *
 * Webhooks are already generic: the platform can deliver to
 * `/api/webhooks/<slug>` and the receiver verifies + stores them per product.
 */

export type ProductStatus = 'live' | 'coming-soon'

export interface ProductMeta {
  slug: string
  name: string
  tagline: string
  description: string
  status: ProductStatus
  accent: string
  icon: string
  capabilities: string[]
  docsUrl?: string
}

export const PRODUCTS: ProductMeta[] = [
  {
    slug: 'verification',
    name: 'Background Check & Verification',
    tagline: 'Employment & education verification',
    description:
      'Submit a verification order and receive real-time webhook events as our agents research contacts, reach out across email, voice, and fax, and close out the verification.',
    status: 'live',
    accent: 'indigo',
    icon: 'shield-check',
    capabilities: ['Employment verification', 'Education verification', 'Real-time webhooks', 'Accreditation data'],
    docsUrl: 'https://api.theary.ai/docs',
  },
  {
    slug: 'public-records',
    name: 'Public Records',
    tagline: 'Criminal & court record evaluation',
    description:
      'Submit a criminal/court screening record and synchronously receive a compliance routing decision — search queue, per-offense reportability, and identity scoring — from the evaluation framework.',
    status: 'live',
    accent: 'emerald',
    icon: 'folder-search',
    capabilities: ['Record evaluation', 'Compliance routing', 'Identity scoring', 'Synchronous decision'],
    docsUrl: 'https://cra.pr.stg.snh-ai.com/docs',
  },
  {
    slug: 'automotive',
    name: 'Automotive',
    tagline: 'Dealership & credit workflows',
    description:
      'Conversational automotive workflows and credit integrations. Designed to slot into this same quickstart shell when you are ready to evaluate it.',
    status: 'coming-soon',
    accent: 'amber',
    icon: 'car',
    capabilities: ['Conversational agent', 'Credit integration', 'Real-time streaming'],
  },
]

export function getProduct(slug: string): ProductMeta | undefined {
  return PRODUCTS.find((p) => p.slug === slug)
}

export function liveProducts(): ProductMeta[] {
  return PRODUCTS.filter((p) => p.status === 'live')
}
