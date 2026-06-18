import { NextResponse } from 'next/server'
import { getServerEnv } from '@/lib/env'
import { verifyWebhookSignature } from '@/lib/webhooks/signature'
import { addWebhookRecord, type SignatureStatus } from '@/lib/webhooks/store'

export const dynamic = 'force-dynamic'

/**
 * Generic webhook receiver. The platform delivers to `/api/webhooks/<product>`;
 * we verify the HMAC signature, store the event, and acknowledge quickly.
 *
 * Best practice mirrored here:
 *   - Verify `X-Webhook-Signature` against the RAW body bytes.
 *   - Acknowledge with 2xx fast; do heavier processing out of band.
 *   - Use `X-Event-Id` for idempotency (surfaced to the UI).
 */
export async function POST(request: Request, ctx: { params: Promise<{ product: string }> }) {
  const { product } = await ctx.params
  const env = getServerEnv()

  // Read the raw body FIRST — signature verification must use the exact bytes.
  const rawBody = await request.text()

  const signatureHeader = request.headers.get('x-webhook-signature')
  let signature: SignatureStatus
  if (!env.webhookSecret) {
    signature = 'no-secret'
  } else if (!signatureHeader) {
    signature = 'unsigned'
  } else {
    signature = verifyWebhookSignature(rawBody, signatureHeader, env.webhookSecret) ? 'verified' : 'invalid'
  }

  let body: unknown
  try {
    body = rawBody ? JSON.parse(rawBody) : null
  } catch {
    body = rawBody
  }

  addWebhookRecord({
    product,
    receivedAt: new Date().toISOString(),
    signature,
    headers: {
      eventType: request.headers.get('x-event-type'),
      eventId: request.headers.get('x-event-id'),
      searchType: request.headers.get('x-search-type'),
      externalSearchId: request.headers.get('x-external-search-id'),
      endpointSource: request.headers.get('x-endpoint-source'),
    },
    body,
  })

  // Reject tampered payloads, but only when a secret is actually configured.
  if (signature === 'invalid') {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  return NextResponse.json({ received: true })
}
