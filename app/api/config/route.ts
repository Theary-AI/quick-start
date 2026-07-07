import { NextResponse } from 'next/server'
import { getPublicConfigStatus } from '@/lib/auth'
import { checkApiHealth } from '@/lib/products/verification/client'
import { resolvePublicBaseUrl, webhookUrlFor } from '@/lib/tunnel'

export const dynamic = 'force-dynamic'

/**
 * Returns the (redacted) setup status the UI needs to render the connection
 * panel: API config, tunnel/webhook URL, and a live health probe. No secrets.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const product = searchParams.get('product') ?? 'verification'

  const config = await getPublicConfigStatus()
  const tunnel = await resolvePublicBaseUrl(request)
  const health = await checkApiHealth()

  return NextResponse.json({
    config,
    tunnel: {
      publicBaseUrl: tunnel.url,
      source: tunnel.source,
      webhookUrl: tunnel.url ? webhookUrlFor(tunnel.url, product) : null,
    },
    health,
  })
}
