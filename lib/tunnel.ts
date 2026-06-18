import 'server-only'
import { getServerEnv } from './env'

/**
 * Resolve the public base URL that the platform should use to reach this app's
 * webhook endpoint.
 *
 * Order of precedence:
 *   1. PUBLIC_BASE_URL env var (set it if you expose the app yourself).
 *   2. A running ngrok tunnel, auto-detected via ngrok's local API.
 *
 * Returns null when neither is available.
 */
export async function resolvePublicBaseUrl(): Promise<{ url: string | null; source: 'env' | 'ngrok' | null }> {
  const env = getServerEnv()
  if (env.publicBaseUrl) {
    return { url: env.publicBaseUrl, source: 'env' }
  }

  const ngrokUrl = await detectNgrokTunnel()
  if (ngrokUrl) {
    return { url: ngrokUrl, source: 'ngrok' }
  }

  return { url: null, source: null }
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
