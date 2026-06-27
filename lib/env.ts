/**
 * Server-only environment access.
 *
 * Everything here is read from `process.env` and must only be imported from
 * server code (route handlers / server components). None of these values are
 * ever sent to the browser.
 */

import 'server-only'

export interface ServerEnv {
  apiBaseUrl: string
  /** Auth0 (or compatible) client credentials. Normally the only auth values you set. */
  authClientId: string
  authClientSecret: string
  /** OAuth token endpoint host + API audience. Defaulted from apiBaseUrl; override only if needed. */
  authDomain: string
  authAudience: string
  /** Optional pre-issued JWT. When set it overrides the client-credentials flow. */
  authToken: string
  webhookSecret: string
  publicBaseUrl: string
  /**
   * Public Records (CRA evaluation framework) config. This is a SEPARATE API
   * with its own auth: CRA validates HS256 tokens minted by its own
   * `/auth/token` endpoint, so the verification (Auth0 RS256) token cannot be
   * reused. Exchange an X-API-Key for a short-lived JWT, or supply a pre-issued
   * CRA bearer token directly.
   */
  publicRecordsApiBaseUrl: string
  publicRecordsApiKey: string
  publicRecordsToken: string
}

/**
 * Pick sensible Auth0 defaults for the environment implied by the API base URL,
 * so integrators only have to supply a client id + secret. Production hosts use
 * production auth; everything else (sandbox/local) uses the sandbox auth domain.
 */
function defaultAuthForApi(apiBaseUrl: string): { domain: string; audience: string } {
  if (/api\.theary\.ai/i.test(apiBaseUrl)) {
    return { domain: 'https://auth.theary.ai', audience: 'https://verification-auth.theary.ai' }
  }
  return { domain: 'https://auth-dev.theary.ai', audience: 'https://empv-auth-dev.theary.ai' }
}

export function getServerEnv(): ServerEnv {
  if(!process.env.API_BASE_URL){
    throw new Error('API_BASE_URL is not set')
  }
  const apiBaseUrl = (process.env.API_BASE_URL).replace(/\/+$/, '')
  const authDefaults = defaultAuthForApi(apiBaseUrl)
  return {
    apiBaseUrl,
    authClientId: process.env.AUTH_CLIENT_ID ?? '',
    authClientSecret: process.env.AUTH_CLIENT_SECRET ?? '',
    authDomain: (process.env.AUTH_DOMAIN ?? authDefaults.domain).replace(/\/+$/, ''),
    authAudience: process.env.AUTH_AUDIENCE ?? authDefaults.audience,
    authToken: process.env.AUTH_TOKEN ?? '',
    webhookSecret: process.env.WEBHOOK_SECRET ?? '',
    publicBaseUrl: (process.env.PUBLIC_BASE_URL ?? '').replace(/\/+$/, ''),
    publicRecordsApiBaseUrl: (process.env.PUBLIC_RECORDS_API_BASE_URL ?? 'https://cra.pr.stg.snh-ai.com').replace(/\/+$/, ''),
    publicRecordsApiKey: process.env.PUBLIC_RECORDS_API_KEY ?? '',
    publicRecordsToken: process.env.PUBLIC_RECORDS_TOKEN ?? '',
  }
}

/**
 * Decode a JWT payload WITHOUT verifying the signature. Used purely to surface
 * the `tenant` claim in the setup UI so integrators can confirm their token is
 * scoped correctly. Never rely on this for security decisions.
 */
export function decodeJwtTenant(jwt: string): { tenant: string | null; warning: string | null } {
  if (!jwt) return { tenant: null, warning: null }
  try {
    const part = jwt.split('.')[1]
    if (!part) return { tenant: null, warning: 'Token does not look like a JWT.' }
    const normalized = part.replace(/-/g, '+').replace(/_/g, '/')
    const json = Buffer.from(normalized, 'base64').toString('utf8')
    const payload = JSON.parse(json) as { tenant?: string }
    if (!payload.tenant) {
      return {
        tenant: null,
        warning:
          'Token is missing the `tenant` claim. Protected endpoints will reject it. Ask SNH AI to add a `tenant` claim to your client (via an Auth0 Action) or issue a token that includes it.',
      }
    }
    return { tenant: payload.tenant, warning: null }
  } catch {
    return { tenant: null, warning: 'Could not decode the token as a JWT.' }
  }
}

/**
 * Decode a JWT payload WITHOUT verifying the signature, returning the raw claims.
 * Used to surface CRA token info (e.g. `sub`, `tier`, `exp`) in the setup UI.
 * Never rely on this for security decisions.
 */
export function decodeJwtClaims(jwt: string): Record<string, unknown> | null {
  if (!jwt) return null
  try {
    const part = jwt.split('.')[1]
    if (!part) return null
    const normalized = part.replace(/-/g, '+').replace(/_/g, '/')
    const json = Buffer.from(normalized, 'base64').toString('utf8')
    return JSON.parse(json) as Record<string, unknown>
  } catch {
    return null
  }
}

/**
 * Decode a JWT header WITHOUT verifying the signature, returning the `alg`.
 * Used to detect when a token was issued for a different API (e.g. an Auth0
 * RS256 token presented to an HS256-only endpoint). Never use for security.
 */
export function decodeJwtAlg(jwt: string): string | null {
  if (!jwt) return null
  try {
    const part = jwt.split('.')[0]
    if (!part) return null
    const normalized = part.replace(/-/g, '+').replace(/_/g, '/')
    const json = Buffer.from(normalized, 'base64').toString('utf8')
    const header = JSON.parse(json) as { alg?: string }
    return typeof header.alg === 'string' ? header.alg : null
  } catch {
    return null
  }
}
