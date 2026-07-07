import { NextResponse } from 'next/server'
import { getServerEnv } from '@/lib/env'
import { createVerificationOrder } from '@/lib/products/verification/client'
import { buildOrderRequest } from '@/lib/products/verification/sample'
import type { VerificationFormInput, WebhookConfig } from '@/lib/products/verification/types'
import { resolvePublicBaseUrl, webhookUrlFor } from '@/lib/tunnel'

export const dynamic = 'force-dynamic'

/**
 * Create a verification order.
 *
 * The browser posts the form fields here; the server attaches the webhook
 * config (secret + auto-detected tunnel URL) and forwards the request to the
 * platform with the Bearer token. This keeps every secret on the server.
 */
export async function POST(request: Request) {
  const env = getServerEnv()
  const form = (await request.json()) as VerificationFormInput

  const tunnel = await resolvePublicBaseUrl(request)

  let webhookConfig: WebhookConfig | undefined
  let webhookNote: string | null = null
  if (tunnel.url) {
    webhookConfig = {
      enabled: true,
      retryAttempts: 3,
      // Subscribe to every event type. Without an explicit `events` list the
      // platform delivers only `verification.completed` to this endpoint, so
      // progress/notification and action-required events would be dropped.
      fallbackEndpoint: {
        url: webhookUrlFor(tunnel.url, 'verification'),
        events: ['verification.completed', 'verification.action_required', 'verification.notification'],
      },
      ...(env.webhookSecret ? { secret: env.webhookSecret } : {}),
    }
    if (!env.webhookSecret) {
      webhookNote = 'No WEBHOOK_SECRET set — webhooks will arrive unsigned and cannot be verified.'
    }
  } else {
    webhookNote =
      'No public URL detected (start `npm run tunnel` or set PUBLIC_BASE_URL). The order will be created, but webhooks have nowhere to go.'
  }

  const body = buildOrderRequest(form, webhookConfig)
  const result = await createVerificationOrder(body)

  return NextResponse.json(
    {
      ...result,
      webhook: {
        configured: Boolean(webhookConfig),
        url:
          typeof webhookConfig?.fallbackEndpoint === 'string'
            ? webhookConfig.fallbackEndpoint
            : webhookConfig?.fallbackEndpoint?.url ?? null,
        signed: Boolean(webhookConfig?.secret),
        note: webhookNote,
      },
    },
    { status: result.ok ? 200 : result.status || 502 },
  )
}
