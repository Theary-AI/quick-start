import { NextRequest, NextResponse } from 'next/server'

/**
 * Optional HTTP Basic Auth gate for hosted demos.
 *
 * When BOTH `BASIC_AUTH_USER` and `BASIC_AUTH_PASSWORD` are set, every request
 * must present matching Basic Auth credentials — the browser shows a native
 * username/password prompt. When either is unset (e.g. local development) the
 * gate is disabled and requests pass through untouched.
 *
 * The inbound webhook endpoint (`/api/webhooks/*`) is ALWAYS exempt: the
 * platform delivers webhooks as unauthenticated POSTs, and they are already
 * verified via the HMAC `WEBHOOK_SECRET`. Gating them would break delivery.
 */

const REALM = 'SNH AI Quickstart'

export function middleware(request: NextRequest) {
  const user = process.env.BASIC_AUTH_USER
  const password = process.env.BASIC_AUTH_PASSWORD

  // Gate is opt-in: only enforced when both credentials are configured.
  if (!user || !password) {
    return NextResponse.next()
  }

  // Never gate inbound webhooks — they authenticate via HMAC signature.
  if (request.nextUrl.pathname.startsWith('/api/webhooks')) {
    return NextResponse.next()
  }

  const header = request.headers.get('authorization') ?? ''
  if (isAuthorized(header, user, password)) {
    return NextResponse.next()
  }

  return new NextResponse('Authentication required.', {
    status: 401,
    headers: {
      'WWW-Authenticate': `Basic realm="${REALM}", charset="UTF-8"`,
    },
  })
}

function isAuthorized(authHeader: string, user: string, password: string): boolean {
  const [scheme, encoded] = authHeader.split(' ')
  if (scheme !== 'Basic' || !encoded) return false

  let decoded: string
  try {
    decoded = atob(encoded)
  } catch {
    return false
  }

  // Only split on the first ":" — passwords may legitimately contain colons.
  const sep = decoded.indexOf(':')
  if (sep === -1) return false
  const providedUser = decoded.slice(0, sep)
  const providedPassword = decoded.slice(sep + 1)

  return safeEqual(providedUser, user) && safeEqual(providedPassword, password)
}

/** Length-aware constant-time string comparison to avoid trivial timing leaks. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let mismatch = 0
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return mismatch === 0
}

export const config = {
  // Run on everything except Next.js internals and static asset requests, so the
  // login prompt covers the app without needlessly gating framework assets.
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
