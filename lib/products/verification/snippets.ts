/**
 * Copy-pasteable integration snippets for the Verification API.
 *
 * These strings power the in-app Monaco code explorer (see
 * `components/CodeExplorer.tsx`). They intentionally mirror the real code in
 * this quickstart so what you read in the browser matches what runs on the
 * server — from getting a token, to creating an order, to verifying and
 * handling every webhook event form.
 *
 * Webhook event forms covered:
 *   - verification.completed        (terminal — the verification result)
 *   - verification.notification     (progress — contact plans, outreach, inbound)
 *   - verification.action_required  (terminal — human/third-party action needed)
 */

export type SnippetLanguage = 'typescript' | 'json' | 'bash'

export interface CodeSnippet {
  id: string
  group: string
  title: string
  /** One-line summary shown above the editor. */
  summary: string
  language: SnippetLanguage
  /** Suggested filename / path, shown as a chip. */
  filename?: string
  code: string
}

export const SNIPPET_GROUPS = ['Call the API', 'Receive webhooks', 'Webhook event forms'] as const

/* -------------------------------------------------------------------------- */
/* 1. Call the API                                                            */
/* -------------------------------------------------------------------------- */

const GET_TOKEN: CodeSnippet = {
  id: 'get-token',
  group: 'Call the API',
  title: 'Get an access token',
  summary: 'Exchange your client credentials for a short-lived Bearer token (Auth0 client-credentials flow).',
  language: 'typescript',
  filename: 'lib/auth.ts',
  code: `// The platform authenticates every protected call with a Bearer JWT that
// carries your \`tenant\` claim. Mint one with the client-credentials grant.
// Keep the client secret on the SERVER — never ship it to the browser.

interface OAuthTokenResponse {
  access_token?: string
  expires_in?: number
  error?: string
  error_description?: string
}

export async function getAccessToken(): Promise<string> {
  // Sandbox defaults; use https://auth.theary.ai + https://verification-auth.theary.ai in prod.
  const AUTH_DOMAIN = process.env.AUTH_DOMAIN ?? 'https://auth-dev.theary.ai'
  const AUTH_AUDIENCE = process.env.AUTH_AUDIENCE ?? 'https://empv-auth-dev.theary.ai'

  const res = await fetch(\`\${AUTH_DOMAIN}/oauth/token\`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.AUTH_CLIENT_ID,
      client_secret: process.env.AUTH_CLIENT_SECRET,
      audience: AUTH_AUDIENCE,
      grant_type: 'client_credentials',
    }),
    cache: 'no-store',
  })

  const data = (await res.json()) as OAuthTokenResponse
  if (!res.ok || !data.access_token) {
    throw new Error(data.error_description ?? data.error ?? \`token endpoint returned \${res.status}\`)
  }

  // Cache this token in memory until ~1 min before \`expires_in\` to avoid
  // re-fetching on every request.
  return data.access_token
}`,
}

const CREATE_ORDER: CodeSnippet = {
  id: 'create-order',
  group: 'Call the API',
  title: 'Create a verification order',
  summary: 'POST /background-check/v1/orders with the applicant + a webhookConfig so events route back to you.',
  language: 'typescript',
  filename: 'lib/products/verification/client.ts',
  code: `import { getAccessToken } from '@/lib/auth'

const API_BASE_URL = process.env.API_BASE_URL! // e.g. https://api.theary.ai
const ORDERS_PATH = '/background-check/v1/orders'

export async function createVerificationOrder(publicBaseUrl: string) {
  const token = await getAccessToken()

  // A webhook target with NO \`events\` list receives verification.completed ONLY.
  // List every event explicitly to also get notification + action_required.
  const webhookConfig = {
    enabled: true,
    retryAttempts: 3,
    secret: process.env.WEBHOOK_SECRET, // used to HMAC-sign each delivery
    fallbackEndpoint: {
      url: \`\${publicBaseUrl}/api/webhooks/verification\`,
      events: ['verification.completed', 'verification.action_required', 'verification.notification'],
    },
  }

  const body = {
    // The top-level webhookConfig governs verification.completed. Mirror it into
    // each search's notifications.webhookOverride so progress + action_required
    // events for that search reach the same endpoint.
    searchTypes: [
      {
        searchType: 'EMPLOYMENT', // or 'EDUCATION'
        externalSearchId: 'quickstart-emp-001', // your own tracking id (echoed back)
        searchConfig: { notifications: { webhookOverride: webhookConfig } },
      },
    ],
    applicant: {
      firstName: 'John',
      lastName: 'Smith',
      ssn: '123-45-6789',
      email: 'john.smith@example.com',
      phone: '+1-555-123-4567',
      birthday: '1990-05-15',
    },
    businessContext: {
      entityName: 'Apple',
      appliedJobTitle: 'Senior Software Engineer',
      worksiteCity: 'San Francisco',
      worksiteState: 'CA',
      proposedSalary: 100000,
    },
    history: {
      employment: [
        {
          employerName: 'Tech Corp',
          position: 'Software Engineer',
          employerLocation: 'San Francisco, CA',
          employerEmail: 'hr@techcorp.com',
          employerPhone: '+1-555-123-4567',
          startDate: '2020-01-15',
          endDate: '2023-06-30',
        },
      ],
    },
    webhookConfig,
  }

  const res = await fetch(\`\${API_BASE_URL}\${ORDERS_PATH}\`, {
    method: 'POST',
    headers: {
      Authorization: \`Bearer \${token}\`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    cache: 'no-store',
  })

  if (!res.ok) throw new Error(\`Create order failed (HTTP \${res.status}): \${await res.text()}\`)

  // => { verificationOrderId: string, searchIds: string[] }
  return (await res.json()) as { verificationOrderId: string; searchIds: string[] }
}`,
}

const CREATE_ORDER_CURL: CodeSnippet = {
  id: 'create-order-curl',
  group: 'Call the API',
  title: 'Create an order (curl)',
  summary: 'The same request as a one-liner — handy for a quick smoke test from your terminal.',
  language: 'bash',
  code: `# 1) Get a token
TOKEN=$(curl -s https://auth-dev.theary.ai/oauth/token \\
  -H 'Content-Type: application/json' \\
  -d '{
    "client_id": "'"$AUTH_CLIENT_ID"'",
    "client_secret": "'"$AUTH_CLIENT_SECRET"'",
    "audience": "https://empv-auth-dev.theary.ai",
    "grant_type": "client_credentials"
  }' | jq -r .access_token)

# 2) Create the order (webhooks route to your public tunnel URL)
curl -s "$API_BASE_URL/background-check/v1/orders" \\
  -H "Authorization: Bearer $TOKEN" \\
  -H 'Content-Type: application/json' \\
  -d '{
    "searchTypes": [{ "searchType": "EMPLOYMENT", "externalSearchId": "quickstart-emp-001" }],
    "applicant": { "firstName": "John", "lastName": "Smith", "ssn": "123-45-6789" },
    "businessContext": {
      "entityName": "Apple", "appliedJobTitle": "Senior Software Engineer",
      "worksiteCity": "San Francisco", "worksiteState": "CA", "proposedSalary": 100000
    },
    "history": { "employment": [{ "employerName": "Tech Corp", "position": "Software Engineer" }] },
    "webhookConfig": {
      "enabled": true,
      "secret": "'"$WEBHOOK_SECRET"'",
      "fallbackEndpoint": {
        "url": "'"$PUBLIC_BASE_URL"'/api/webhooks/verification",
        "events": ["verification.completed", "verification.action_required", "verification.notification"]
      }
    }
  }'`,
}

/* -------------------------------------------------------------------------- */
/* 2. Receive webhooks                                                        */
/* -------------------------------------------------------------------------- */

const VERIFY_SIGNATURE: CodeSnippet = {
  id: 'verify-signature',
  group: 'Receive webhooks',
  title: 'Verify the HMAC signature',
  summary: 'Every signed delivery carries X-Webhook-Signature: sha256=<hex> over the RAW body bytes.',
  language: 'typescript',
  filename: 'lib/webhooks/signature.ts',
  code: `import crypto from 'node:crypto'

/**
 * Verify an HMAC-SHA256 webhook signature.
 *
 * The platform signs the RAW request body with your webhook secret and sends
 * the result in \`X-Webhook-Signature\` as \`sha256=<hex>\`. Always verify against
 * the raw bytes you received — never against re-serialized JSON, since key
 * ordering/whitespace would change the hash.
 */
export function verifyWebhookSignature(rawBody: string, signatureHeader: string | null, secret: string): boolean {
  if (!secret || !signatureHeader) return false

  const provided = signatureHeader.replace(/^sha256=/, '')
  const expected = crypto.createHmac('sha256', secret).update(rawBody, 'utf8').digest('hex')

  const providedBuf = Buffer.from(provided, 'hex')
  const expectedBuf = Buffer.from(expected, 'hex')
  if (providedBuf.length !== expectedBuf.length) return false

  // Constant-time compare to avoid leaking timing information.
  return crypto.timingSafeEqual(providedBuf, expectedBuf)
}`,
}

const WEBHOOK_ROUTE: CodeSnippet = {
  id: 'webhook-route',
  group: 'Receive webhooks',
  title: 'Receive & route webhooks',
  summary: 'Read the raw body, verify the signature, ACK fast (2xx), then dispatch by event type.',
  language: 'typescript',
  filename: 'app/api/webhooks/[product]/route.ts',
  code: `import { NextResponse } from 'next/server'
import { verifyWebhookSignature } from '@/lib/webhooks/signature'
import {
  handleCompleted,
  handleNotification,
  handleActionRequired,
  type WebhookPayload,
} from '@/lib/webhooks/handlers'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  // 1) Read the RAW body FIRST — signature verification needs the exact bytes.
  const rawBody = await request.text()

  // 2) Verify the signature (skip only if you haven't set a secret yet).
  const secret = process.env.WEBHOOK_SECRET
  const signature = request.headers.get('x-webhook-signature')
  if (secret && !verifyWebhookSignature(rawBody, signature, secret)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const payload = JSON.parse(rawBody) as WebhookPayload

  // 3) Idempotency: X-Event-Id is unique per delivery. Dedupe on it so retries
  //    (the platform retries 5xx with backoff) don't double-process an event.
  const eventId = request.headers.get('x-event-id')
  // if (await alreadyProcessed(eventId)) return NextResponse.json({ received: true })

  // 4) ACK quickly with 2xx, then do heavy work out of band. Here we switch on
  //    the three event forms the Verification API emits.
  switch (payload.event) {
    case 'verification.completed':
      await handleCompleted(payload)
      break
    case 'verification.notification':
      await handleNotification(payload)
      break
    case 'verification.action_required':
      await handleActionRequired(payload)
      break
    default:
      console.warn('Unhandled webhook event', payload.event)
  }

  return NextResponse.json({ received: true, eventId })
}`,
}

/* -------------------------------------------------------------------------- */
/* 3. Webhook event forms — shared envelope + per-event handler & sample      */
/* -------------------------------------------------------------------------- */

const ENVELOPE_TYPES: CodeSnippet = {
  id: 'envelope-types',
  group: 'Webhook event forms',
  title: 'Shared payload envelope (types)',
  summary: 'All three events share one envelope: { event, occurredAt, data }. Discriminate on `event`.',
  language: 'typescript',
  filename: 'lib/webhooks/handlers.ts',
  code: `export type WebhookEventType =
  | 'verification.completed'
  | 'verification.notification'
  | 'verification.action_required'

export type VerificationChannel = 'EMAIL' | 'VOICE' | 'FAX' | 'JSON'
export type SearchType = 'EMPLOYMENT' | 'EDUCATION'

/** Every delivery is this envelope. \`data\` shape depends on \`event\`. */
export interface WebhookPayload<TData = unknown> {
  event: WebhookEventType
  occurredAt: string // ISO-8601
  data: TData
}

// --- verification.completed -------------------------------------------------
export interface CompletedData {
  searchId: string
  verificationId?: string
  externalSearchId?: string
  searchType?: SearchType
  channel?: VerificationChannel
  status?: string
  verificationResult: {
    id?: string
    outcome?: 'VERIFIED' | 'UNVERIFIED' | 'UNABLE_TO_VERIFY' | string
    discrepancy?: boolean
    // Present for EMPLOYMENT searches (provided* vs verified* fields):
    employmentVerification?: Record<string, unknown>
    // Present for EDUCATION searches:
    educationVerification?: Record<string, unknown>
    comments?: string | null
  }
  accreditation?: unknown // EDUCATION only, when available
}

// --- verification.notification ----------------------------------------------
export type VerificationNotificationType =
  | 'CONTACT_PLAN'
  | 'OUTBOUND_ATTEMPT'
  | 'INBOUND_MESSAGE'
  | 'INBOUND_RECEIVED_DETAIL'
  | 'THIRD_PARTY_RECORD'
  | 'ADDITIONAL_RESEARCH_NOTE'
  | 'AGENT_INTERVENTION'

export interface NotificationData {
  searchId: string
  externalSearchId?: string
  verificationId?: string
  searchType?: SearchType
  notificationType?: VerificationNotificationType
  // Populated depending on notificationType:
  contactPlan?: Array<{ name?: string; title?: string; entityName?: string; method?: string; confidence?: number | null }>
  outboundAttempt?: { channel: VerificationChannel; attemptNumber: number; contactName?: string; destination?: string }
  inboundMetadata?: { summary?: string; title?: string; source?: string }
  classification?: { type?: string; confidence?: number }
}

// --- verification.action_required -------------------------------------------
export type ActionRequiredReasonCode =
  | 'THIRD_PARTY_RECORD'
  | 'UPSTREAM_ISSUE'
  | 'SYSTEM_FAILURE'
  | 'SLA_REACHED'
  | 'HUMAN_ESCALATION'
  | 'PRIMARY_EDUCATION'
  | 'INTERNATIONAL_EDUCATION'
  | 'OTHER'

export interface ActionRequiredData {
  searchId: string
  verificationId?: string
  searchType?: SearchType
  reasonCode: ActionRequiredReasonCode
  status?: string
  channel?: VerificationChannel
  contact?: { type: SearchType | 'LICENSE' | 'REFERENCE'; data: Record<string, unknown> }
  metadata?: Record<string, unknown>
}`,
}

const COMPLETED_HANDLER: CodeSnippet = {
  id: 'completed-handler',
  group: 'Webhook event forms',
  title: 'Handle verification.completed',
  summary: 'Terminal event: the verification result is ready. Persist it and close the search on your side.',
  language: 'typescript',
  filename: 'lib/webhooks/handlers.ts',
  code: `import type { WebhookPayload, CompletedData } from './handlers'

/**
 * verification.completed — TERMINAL.
 * Fired once per search when a result is reached. The payload carries a
 * normalized \`verificationResult\` with an \`outcome\` plus a \`discrepancy\` flag,
 * and a type-specific block (employmentVerification | educationVerification)
 * comparing provided* vs verified* fields.
 */
export async function handleCompleted(payload: WebhookPayload<CompletedData>) {
  const { searchId, externalSearchId, searchType, verificationResult } = payload.data
  const { outcome, discrepancy } = verificationResult

  const details =
    searchType === 'EDUCATION'
      ? verificationResult.educationVerification
      : verificationResult.employmentVerification

  console.log('✅ completed', { searchId, externalSearchId, outcome, discrepancy })

  // Map your external id back to your own record and store the result.
  // await db.searches.update({ where: { externalSearchId }, data: {
  //   status: 'COMPLETED', outcome, discrepancy, details,
  // } })

  if (discrepancy) {
    // The applicant's provided values didn't match what we verified — you may
    // want to flag this for adjudication before making a decision.
  }
}`,
}

const COMPLETED_SAMPLE: CodeSnippet = {
  id: 'completed-sample',
  group: 'Webhook event forms',
  title: 'verification.completed — sample payload',
  summary: 'Example EMPLOYMENT completion body (delivered with X-Event-Type: verification.completed).',
  language: 'json',
  code: `{
  "event": "verification.completed",
  "occurredAt": "2026-07-02T14:05:33.120Z",
  "data": {
    "searchType": "EMPLOYMENT",
    "searchId": "e2b1c9a4-7d6f-4a1e-9b0c-2f3a4b5c6d7e",
    "externalSearchId": "quickstart-emp-001",
    "verificationId": "1f0a8b2c-3d4e-5f60-7181-92a3b4c5d6e7",
    "channel": "VOICE",
    "verificationResult": {
      "id": "1f0a8b2c-3d4e-5f60-7181-92a3b4c5d6e7",
      "outcome": "VERIFIED",
      "discrepancy": true,
      "employmentVerification": {
        "providedCompanyName": "Tech Corp",
        "providedPosition": "Software Engineer",
        "providedStartDate": "2020-01-15",
        "providedEndDate": "2023-06-30",
        "verifiedCompanyName": "Tech Corp",
        "verifiedPosition": "Senior Software Engineer",
        "verifiedStartDate": "2020-02-01",
        "verifiedEndDate": "2023-06-30",
        "verifiedRehire": true,
        "verifierFirstName": "Dana",
        "verifierLastName": "Lopez",
        "verifierPosition": "HR Manager"
      },
      "comments": "Verified by phone with HR."
    }
  }
}`,
}

const NOTIFICATION_HANDLER: CodeSnippet = {
  id: 'notification-handler',
  group: 'Webhook event forms',
  title: 'Handle verification.notification',
  summary: 'Progress events (non-terminal): contact plans, outbound attempts, inbound messages, research notes.',
  language: 'typescript',
  filename: 'lib/webhooks/handlers.ts',
  code: `import type { WebhookPayload, NotificationData } from './handlers'

/**
 * verification.notification — PROGRESS (non-terminal, may arrive many times).
 * Use \`notificationType\` to decide what changed. These are great for a live
 * activity timeline; none of them mean the search is finished.
 */
export async function handleNotification(payload: WebhookPayload<NotificationData>) {
  const d = payload.data

  switch (d.notificationType) {
    case 'CONTACT_PLAN':
      // Our agents assembled who/how they'll reach out to.
      console.log('📋 contact plan', d.contactPlan?.length, 'contacts')
      break
    case 'OUTBOUND_ATTEMPT':
      // We reached out on a channel (EMAIL / VOICE / FAX).
      console.log('📤 outbound', d.outboundAttempt?.channel, '#', d.outboundAttempt?.attemptNumber)
      break
    case 'INBOUND_MESSAGE':
    case 'INBOUND_RECEIVED_DETAIL':
      // A verifier replied; classification hints at what it contained.
      console.log('📥 inbound', d.classification?.type, d.inboundMetadata?.summary)
      break
    case 'THIRD_PARTY_RECORD':
    case 'ADDITIONAL_RESEARCH_NOTE':
    case 'AGENT_INTERVENTION':
      // Driver's-seat activity from a human operator.
      console.log('🛠️ agent activity', d.notificationType)
      break
    default:
      console.log('ℹ️ notification', d.notificationType)
  }

  // Append to your per-search activity feed keyed by d.searchId / d.externalSearchId.
}`,
}

const NOTIFICATION_SAMPLE: CodeSnippet = {
  id: 'notification-sample',
  group: 'Webhook event forms',
  title: 'verification.notification — sample payload',
  summary: 'Example OUTBOUND_ATTEMPT progress event (delivered with X-Event-Type: verification.notification).',
  language: 'json',
  code: `{
  "event": "verification.notification",
  "occurredAt": "2026-07-02T14:01:12.004Z",
  "data": {
    "searchType": "EMPLOYMENT",
    "searchId": "e2b1c9a4-7d6f-4a1e-9b0c-2f3a4b5c6d7e",
    "externalSearchId": "quickstart-emp-001",
    "notificationType": "OUTBOUND_ATTEMPT",
    "outboundAttempt": {
      "channel": "EMAIL",
      "attemptNumber": 1,
      "contactName": "HR Department",
      "contactEntity": "Tech Corp",
      "destination": "hr@techcorp.com"
    }
  }
}

/* Another common form — the initial CONTACT_PLAN:

{
  "event": "verification.notification",
  "occurredAt": "2026-07-02T14:00:05.882Z",
  "data": {
    "searchId": "e2b1c9a4-7d6f-4a1e-9b0c-2f3a4b5c6d7e",
    "externalSearchId": "quickstart-emp-001",
    "notificationType": "CONTACT_PLAN",
    "contactPlan": [
      { "name": "HR Department", "entityName": "Tech Corp", "method": "EMAIL",
        "destination": "hr@techcorp.com", "confidence": 0.86 },
      { "name": "Main Line", "entityName": "Tech Corp", "method": "VOICE",
        "destination": "+1-555-123-4567", "confidence": 0.72 }
    ]
  }
}
*/`,
}

const ACTION_REQUIRED_HANDLER: CodeSnippet = {
  id: 'action-required-handler',
  group: 'Webhook event forms',
  title: 'Handle verification.action_required',
  summary: 'Terminal event: automated verification stopped and needs you (reasonCode explains why).',
  language: 'typescript',
  filename: 'lib/webhooks/handlers.ts',
  code: `import type { WebhookPayload, ActionRequiredData } from './handlers'

/**
 * verification.action_required — TERMINAL for the automated flow.
 * We couldn't finish autonomously and need action on your side. Branch on
 * \`reasonCode\`; \`contact\` may carry a structured payload to hand to an operator
 * or a third-party service.
 */
export async function handleActionRequired(payload: WebhookPayload<ActionRequiredData>) {
  const { searchId, externalSearchId, reasonCode, contact, metadata, status } = payload.data

  console.warn('⚠️ action required', { searchId, externalSearchId, reasonCode, status })

  switch (reasonCode) {
    case 'THIRD_PARTY_RECORD':
      // Verification must go through a paid third-party (e.g. The Work Number).
      // \`contact\` holds the structured record to submit.
      break
    case 'PRIMARY_EDUCATION':
    case 'INTERNATIONAL_EDUCATION':
      // Manual outreach to the institution is required.
      break
    case 'SLA_REACHED':
    case 'HUMAN_ESCALATION':
    case 'UPSTREAM_ISSUE':
    case 'SYSTEM_FAILURE':
      // Route to your ops queue for manual handling / retry.
      break
    default:
      // 'OTHER' — inspect metadata for specifics.
      break
  }

  // Open a task for your team and stop waiting for a completed event on this search.
}`,
}

const ACTION_REQUIRED_SAMPLE: CodeSnippet = {
  id: 'action-required-sample',
  group: 'Webhook event forms',
  title: 'verification.action_required — sample payload',
  summary: 'Example THIRD_PARTY_RECORD action event (delivered with X-Event-Type: verification.action_required).',
  language: 'json',
  code: `{
  "event": "verification.action_required",
  "occurredAt": "2026-07-02T14:03:47.551Z",
  "data": {
    "searchType": "EMPLOYMENT",
    "searchId": "e2b1c9a4-7d6f-4a1e-9b0c-2f3a4b5c6d7e",
    "externalSearchId": "quickstart-emp-001",
    "verificationId": "1f0a8b2c-3d4e-5f60-7181-92a3b4c5d6e7",
    "reasonCode": "THIRD_PARTY_RECORD",
    "status": "Action Required",
    "channel": "JSON",
    "contact": {
      "type": "EMPLOYMENT",
      "data": {
        "providedCompanyName": "Tech Corp",
        "providedContactName": "HR Department",
        "providedContactEmail": "hr@techcorp.com",
        "providedStartDate": "2020-01-15",
        "providedEndDate": "2023-06-30",
        "providedPosition": "Software Engineer"
      }
    },
    "metadata": {
      "vendor": "The Work Number",
      "note": "Employer only verifies through a paid third-party provider."
    }
  }
}`,
}

/* -------------------------------------------------------------------------- */

export const SNIPPETS: CodeSnippet[] = [
  GET_TOKEN,
  CREATE_ORDER,
  CREATE_ORDER_CURL,
  VERIFY_SIGNATURE,
  WEBHOOK_ROUTE,
  ENVELOPE_TYPES,
  COMPLETED_HANDLER,
  COMPLETED_SAMPLE,
  NOTIFICATION_HANDLER,
  NOTIFICATION_SAMPLE,
  ACTION_REQUIRED_HANDLER,
  ACTION_REQUIRED_SAMPLE,
]
