import 'server-only'
import { decodeJwtAlg, decodeJwtClaims, getServerEnv } from '@/lib/env'
import type { EvaluateRequest, EvaluateResponse } from './types'

export interface ApiResult<T> {
  ok: boolean
  status: number
  data?: T
  error?: string
  /** The exact request body sent, echoed back for the UI's "what we sent" view. */
  sentBody?: unknown
}

const TOKEN_PATH = '/auth/token'
const EVALUATE_PATH = '/evaluate'

/**
 * The CRA evaluation API mints AND validates its tokens with this algorithm.
 * A token issued by another system (e.g. an Auth0 RS256 verification token)
 * will be rejected at the algorithm check with "The specified alg value is not
 * allowed" — which is why the employment/education token cannot be reused here.
 */
export const CRA_TOKEN_ALG = 'HS256'

// Refresh a little before actual expiry to avoid using a token mid-flight.
const EXPIRY_BUFFER_MS = 60 * 1000

interface TokenCacheEntry {
  token: string
  expiresAt: number
}

// Keyed by `${baseUrl}|${apiKey}` so changing either re-fetches.
const tokenCache = new Map<string, TokenCacheEntry>()

export type PublicRecordsAuthSource = 'env-token' | 'api-key' | null

export interface PublicRecordsTokenResult {
  token: string | null
  source: PublicRecordsAuthSource
  error?: string
}

interface AuthTokenResponse {
  access_token?: string
  token_type?: string
  expires_in?: number
  error?: string
  message?: string
}

/**
 * Resolve a Bearer token for the CRA evaluation API.
 *
 * Public Records is a SEPARATE API from verification and does NOT accept the
 * verification (Auth0) token — CRA validates HS256 tokens minted by its own
 * `/auth/token` endpoint. We mirror the verification token *mechanism* (a
 * pre-issued override + a cached credential exchange) but against CRA:
 *   1. PUBLIC_RECORDS_TOKEN — a pre-issued CRA JWT used as-is.
 *   2. Exchange PUBLIC_RECORDS_API_KEY for a short-lived JWT at `/auth/token`
 *      (X-API-Key header), cached in-memory until shortly before it expires.
 */
export async function getPublicRecordsToken(): Promise<PublicRecordsTokenResult> {
  const env = getServerEnv()

  if (env.publicRecordsToken) {
    return { token: env.publicRecordsToken, source: 'env-token' }
  }

  if (!env.publicRecordsApiKey) {
    return {
      token: null,
      source: null,
      error: 'No credentials set. Add PUBLIC_RECORDS_API_KEY (or PUBLIC_RECORDS_TOKEN) to .env.local.',
    }
  }

  const cacheKey = `${env.publicRecordsApiBaseUrl}|${env.publicRecordsApiKey}`
  const cached = tokenCache.get(cacheKey)
  if (cached && cached.expiresAt > Date.now()) {
    return { token: cached.token, source: 'api-key' }
  }

  try {
    const res = await fetch(`${env.publicRecordsApiBaseUrl}${TOKEN_PATH}`, {
      method: 'POST',
      headers: { 'X-API-Key': env.publicRecordsApiKey, accept: 'application/json' },
      cache: 'no-store',
    })

    const data = (await res.json().catch(() => ({}))) as AuthTokenResponse

    if (!res.ok || !data.access_token) {
      const detail = data.message || data.error || `token endpoint returned ${res.status}`
      return { token: null, source: null, error: `Could not obtain access token: ${detail}` }
    }

    const expiresInMs = (data.expires_in ?? 3600) * 1000
    tokenCache.set(cacheKey, {
      token: data.access_token,
      expiresAt: Date.now() + Math.max(expiresInMs - EXPIRY_BUFFER_MS, 0),
    })

    return { token: data.access_token, source: 'api-key' }
  } catch (err) {
    return {
      token: null,
      source: null,
      error: `Could not reach ${env.publicRecordsApiBaseUrl}. ${(err as Error).message}`,
    }
  }
}

/**
 * Server-side proxy that evaluates a single record. Keeps the JWT on the
 * server — the browser never sees the token or API key.
 */
export async function evaluateRecord(body: EvaluateRequest): Promise<ApiResult<EvaluateResponse>> {
  const env = getServerEnv()

  const auth = await getPublicRecordsToken()
  if (!auth.token) {
    return { ok: false, status: 0, error: auth.error ?? 'No access token available.', sentBody: body }
  }

  let res: Response
  try {
    res = await fetch(`${env.publicRecordsApiBaseUrl}${EVALUATE_PATH}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${auth.token}`,
        'Content-Type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    })
  } catch (err) {
    return {
      ok: false,
      status: 0,
      error: `Could not reach ${env.publicRecordsApiBaseUrl}. ${(err as Error).message}`,
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
      (parsed && typeof parsed === 'object' && 'detail' in parsed
        ? JSON.stringify((parsed as { detail: unknown }).detail)
        : text) || `Request failed with status ${res.status}`
    return { ok: false, status: res.status, error: message, sentBody: body }
  }

  return { ok: true, status: res.status, data: parsed as EvaluateResponse, sentBody: body }
}

/**
 * A redacted, browser-safe view of the Public Records setup status, used by the
 * UI to render a connection panel without leaking the token or API key.
 */
export interface PublicRecordsConfigStatus {
  apiBaseUrl: string
  authMethod: PublicRecordsAuthSource
  hasCredentials: boolean
  /** `sub` claim of the resolved token (the CRA client id), if decodable. */
  tokenSubject: string | null
  /** `tier` claim of the resolved token, if present. */
  tokenTier: string | null
  /** Signing algorithm of the resolved token. CRA only accepts HS256. */
  tokenAlg: string | null
  tokenWarning: string | null
}

export async function getPublicRecordsConfigStatus(): Promise<PublicRecordsConfigStatus> {
  const env = getServerEnv()
  const auth = await getPublicRecordsToken()
  const claims = auth.token ? decodeJwtClaims(auth.token) : null
  const tokenAlg = auth.token ? decodeJwtAlg(auth.token) : null
  const hasCredentials = Boolean(env.publicRecordsToken) || Boolean(env.publicRecordsApiKey)

  // Surface an algorithm mismatch early: a token from another API (e.g. the
  // Auth0 RS256 verification token) will 401 at /evaluate with "alg not allowed".
  let tokenWarning = auth.error ?? null
  if (!tokenWarning && tokenAlg && tokenAlg !== CRA_TOKEN_ALG) {
    tokenWarning = `Token is signed with ${tokenAlg}, but the evaluation API only accepts ${CRA_TOKEN_ALG}. This looks like a token issued for another API (e.g. the verification token). Use a CRA-issued token via PUBLIC_RECORDS_API_KEY instead.`
  }

  return {
    apiBaseUrl: env.publicRecordsApiBaseUrl,
    authMethod: auth.source,
    hasCredentials,
    tokenSubject: claims && typeof claims.sub === 'string' ? claims.sub : null,
    tokenTier: claims && typeof claims.tier === 'string' ? claims.tier : null,
    tokenAlg,
    tokenWarning,
  }
}

/** Health check against the CRA API base URL (no auth required). */
export async function checkPublicRecordsHealth(): Promise<{
  ok: boolean
  status: number
  body?: unknown
  error?: string
}> {
  const env = getServerEnv()
  try {
    const res = await fetch(`${env.publicRecordsApiBaseUrl}/health`, { cache: 'no-store' })
    const body = await res.json().catch(() => undefined)
    return { ok: res.ok, status: res.status, body }
  } catch (err) {
    return { ok: false, status: 0, error: (err as Error).message }
  }
}
