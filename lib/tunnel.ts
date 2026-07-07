import 'server-only'
import { getServerEnv } from './env'

export type PublicUrlSource = 'env' | 'ngrok' | 'request' | null

/**
 * Resolve the public base URL that the platform should use to reach this app's
 * webhook endpoint.
 *
 * Order of precedence:
 *   1. PUBLIC_BASE_URL env var (set it if you expose the app yourself).
 *   2. A running ngrok tunnel, auto-detected via ngrok's local API.
 *   3. The incoming request's forwarded host (e.g. when deployed behind a
 *      reverse proxy / load balancer such as Cloud Run, which terminates TLS
 *      and forwards the public host on `x-forwarded-host` / `host`). This lets a
 *      hosted deployment configure its own webhook URL with zero extra config.
 *
 * Returns null when none are available.
 */
export async function resolvePublicBaseUrl(
  request?: Request,
): Promise<{ url: string | null; source: PublicUrlSource }> {
  const env = getServerEnv()
  if (env.publicBaseUrl) {
    return { url: env.publicBaseUrl, source: 'env' }
  }

  const ngrokUrl = await detectNgrokTunnel()
  if (ngrokUrl) {
    return { url: ngrokUrl, source: 'ngrok' }
  }

  const requestUrl = request ? publicUrlFromRequest(request) : null
  if (requestUrl) {
    return { url: requestUrl, source: 'request' }
  }

  return { url: null, source: null }
}

/**
 * Derive a public https base URL from an incoming request's forwarded headers.
 * Used when the app is deployed behind a TLS-terminating proxy (Cloud Run,
 * Cloud Load Balancing, etc.). Ignores local hosts so it never advertises a URL
 * the platform can't actually reach.
 */
function publicUrlFromRequest(request: Request): string | null {
  const h = request.headers
  const forwardedHost = h.get('x-forwarded-host')?.split(',')[0]?.trim()
  const host = forwardedHost || h.get('host')?.trim()
  if (!host) return null

  const hostname = host.split(':')[0]?.toLowerCase()
  if (!hostname || hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') {
    return null
  }

  const proto = h.get('x-forwarded-proto')?.split(',')[0]?.trim() || 'https'
  return `${proto}://${host}`.replace(/\/+$/, '')
}

interface NgrokTunnel {
  public_url: string
  proto: string
}

interface NgrokApiResponse {
  tunnels?: NgrokTunnel[]
}

/**
 * Query ngrok's local inspection API (default http://127.0.0.1:4040) for an
 * active https tunnel. Returns null if ngrok is not running.
 */
async function detectNgrokTunnel(): Promise<string | null> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 1500)
    const res = await fetch('http://127.0.0.1:4040/api/tunnels', {
      signal: controller.signal,
      cache: 'no-store',
    })
    clearTimeout(timeout)
    if (!res.ok) return null
    const data = (await res.json()) as NgrokApiResponse
    const https = data.tunnels?.find((t) => t.proto === 'https' && t.public_url)
    const any = data.tunnels?.find((t) => t.public_url)
    const url = (https ?? any)?.public_url
    return url ? url.replace(/\/+$/, '') : null
  } catch {
    return null
  }
}

/**
 * Build the full webhook URL for a given product from a public base URL.
 */
export function webhookUrlFor(baseUrl: string, product: string): string {
  return `${baseUrl.replace(/\/+$/, '')}/api/webhooks/${product}`
}
