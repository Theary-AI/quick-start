/**
 * Server-only authentication.
 *
 * Resolves a Bearer token for the SNH AI API. Two ways, in precedence order:
 *   1. AUTH_TOKEN env var (a pre-issued JWT) — used as-is. Handy when you have a
 *      token that already contains the required `tenant` claim.
 *   2. Client-credentials flow: exchange AUTH_CLIENT_ID + AUTH_CLIENT_SECRET for
 *      an access token at the OAuth token endpoint (Auth0 or compatible).
 *
 * Tokens from the client-credentials flow are cached in-memory until shortly
 * before they expire to avoid re-fetching on every request.
 */

import 'server-only'
import { decodeJwtTenant, getServerEnv } from './env'

export type AuthSource = 'env-token' | 'client-credentials' | null

export interface AccessTokenResult {
  token: string | null
  source: AuthSource
  error?: string
}

interface TokenCacheEntry {
  token: string
  expiresAt: number
}

// Keyed by `${domain}|${audience}|${clientId}` so changing any of them re-fetches.
const tokenCache = new Map<string, TokenCacheEntry>()

// Refresh a little before actual expiry to avoid using a token mid-flight.
const EXPIRY_BUFFER_MS = 60 * 1000

interface OAuthTokenResponse {
  access_token?: string
  expires_in?: number
  token_type?: string
  error?: string
  error_description?: string
}

export async function getAccessToken(): Promise<AccessTokenResult> {
  const env = getServerEnv()

  // 1. Explicit pre-issued token wins.
  if (env.authToken) {
    return { token: env.authToken, source: 'env-token' }
  }

  // 2. Client-credentials exchange.
  if (!env.authClientId || !env.authClientSecret) {
    return {
      token: null,
      source: null,
      error: 'No credentials set. Add AUTH_CLIENT_ID and AUTH_CLIENT_SECRET (or AUTH_TOKEN) to .env.local.',
    }
  }

  const cacheKey = `${env.authDomain}|${env.authAudience}|${env.authClientId}`
  const cached = tokenCache.get(cacheKey)
  if (cached && cached.expiresAt > Date.now()) {
    return { token: cached.token, source: 'client-credentials' }
  }

  try {
    const res = await fetch(`${env.authDomain}/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: env.authClientId,
        client_secret: env.authClientSecret,
        audience: env.authAudience,
        grant_type: 'client_credentials',
      }),
      cache: 'no-store',
    })

    const data = (await res.json().catch(() => ({}))) as OAuthTokenResponse

    if (!res.ok || !data.access_token) {
      const detail = data.error_description || data.error || `token endpoint returned ${res.status}`
      return { token: null, source: null, error: `Could not obtain access token: ${detail}` }
    }

    const expiresInMs = (data.expires_in ?? 3600) * 1000
    tokenCache.set(cacheKey, {
      token: data.access_token,
      expiresAt: Date.now() + Math.max(expiresInMs - EXPIRY_BUFFER_MS, 0),
    })

    return { token: data.access_token, source: 'client-credentials' }
  } catch (err) {
    return {
      token: null,
      source: null,
      error: `Could not reach ${env.authDomain}. ${(err as Error).message}`,
    }
  }
}

/**
 * A redacted, browser-safe view of auth + config status. Booleans only for
 * secrets so the UI can show setup status without leaking anything sensitive.
 */
export interface PublicConfigStatus {
  apiBaseUrl: string
  authMethod: AuthSource
  hasCredentials: boolean
  hasWebhookSecret: boolean
  publicBaseUrl: string
  tokenTenant: string | null
  tokenWarning: string | null
}

export async function getPublicConfigStatus(): Promise<PublicConfigStatus> {
  const env = getServerEnv()
  const auth = await getAccessToken()
  const { tenant, warning } = auth.token ? decodeJwtTenant(auth.token) : { tenant: null, warning: null }
  const hasCredentials = Boolean(env.authToken) || Boolean(env.authClientId && env.authClientSecret)

  return {
    apiBaseUrl: env.apiBaseUrl,
    authMethod: auth.source,
    hasCredentials,
    hasWebhookSecret: env.webhookSecret.length > 0,
    publicBaseUrl: env.publicBaseUrl,
    tokenTenant: tenant,
    tokenWarning: auth.error ?? (auth.token ? warning : null),
  }
}
