import 'server-only'
import { getAccessToken } from '@/lib/auth'
import { getServerEnv } from '@/lib/env'
import type { VerificationOrderRequest, VerificationOrderResponse } from './types'

export interface ApiResult<T> {
  ok: boolean
  status: number
  data?: T
  error?: string
  /** The exact request body sent, echoed back for the UI's "what we sent" view. */
  sentBody?: unknown
}

const ORDERS_PATH = '/background-check/v1/orders'

/**
 * Server-side proxy that creates a verification order. Keeps the JWT on the
 * server — the browser never sees AUTH_TOKEN.
 */
export async function createVerificationOrder(body: VerificationOrderRequest): Promise<ApiResult<VerificationOrderResponse>> {
  const env = getServerEnv()

  const auth = await getAccessToken()
  if (!auth.token) {
    return { ok: false, status: 0, error: auth.error ?? 'No access token available.', sentBody: body }
  }

  let res: Response
  try {
    res = await fetch(`${env.apiBaseUrl}${ORDERS_PATH}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${auth.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    })
  } catch (err) {
    return {
      ok: false,
      status: 0,
      error: `Could not reach ${env.apiBaseUrl}. ${(err as Error).message}`,
      sentBody: body,
    }
  }

  const text = await res.text()
  let parsed: unknown
  try {
    parsed = text ? JSON.parse(text) : undefined
  } catch {
    parsed = text
  }

  if (!res.ok) {
    const message =
      (parsed && typeof parsed === 'object' && 'message' in parsed
        ? JSON.stringify((parsed as { message: unknown }).message)
        : text) || `Request failed with status ${res.status}`
    return { ok: false, status: res.status, error: message, sentBody: body }
  }

  return { ok: true, status: res.status, data: parsed as VerificationOrderResponse, sentBody: body }
}

/** Health check against the configured API base URL (no auth required). */
export async function checkApiHealth(): Promise<{ ok: boolean; status: number; body?: unknown; error?: string }> {
  const env = getServerEnv()
  try {
    const res = await fetch(`${env.apiBaseUrl}/health`, { cache: 'no-store' })
    const body = await res.json().catch(() => undefined)
    return { ok: res.ok, status: res.status, body }
  } catch (err) {
    return { ok: false, status: 0, error: (err as Error).message }
  }
}
