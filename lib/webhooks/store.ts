/**
 * In-memory webhook event store.
 *
 * This is intentionally simple — a ring buffer kept in the Node process — so
 * the quickstart has zero infrastructure dependencies. In a real integration
 * you would persist events to a database and process them asynchronously.
 *
 * We stash it on `globalThis` so the buffer survives Next.js hot-reloads in dev.
 */

export type SignatureStatus = 'verified' | 'invalid' | 'unsigned' | 'no-secret'

export interface WebhookRecord {
  /** Local id for this received delivery. */
  id: string
  /** Which product the webhook belongs to (e.g. "verification"). */
  product: string
  /** When this app received the delivery. */
  receivedAt: string
  /** Result of HMAC signature verification. */
  signature: SignatureStatus
  /** Selected platform headers, useful for debugging/idempotency. */
  headers: {
    eventType: string | null
    eventId: string | null
    searchType: string | null
    externalSearchId: string | null
    endpointSource: string | null
  }
  /** Parsed JSON body (or the raw string if it was not JSON). */
  body: unknown
}

interface Store {
  records: WebhookRecord[]
  seq: number
}

const MAX_RECORDS = 200

const globalRef = globalThis as unknown as { __qs_webhookStore?: Store }

function store(): Store {
  if (!globalRef.__qs_webhookStore) {
    globalRef.__qs_webhookStore = { records: [], seq: 0 }
  }
  return globalRef.__qs_webhookStore
}

export function addWebhookRecord(record: Omit<WebhookRecord, 'id'>): WebhookRecord {
  const s = store()
  s.seq += 1
  const full: WebhookRecord = { id: `evt_${s.seq}`, ...record }
  s.records.unshift(full)
  if (s.records.length > MAX_RECORDS) s.records.length = MAX_RECORDS
  return full
}

export function listWebhookRecords(product?: string): WebhookRecord[] {
  const s = store()
  return product ? s.records.filter((r) => r.product === product) : s.records
}

export function clearWebhookRecords(product?: string): void {
  const s = store()
  if (!product) {
    s.records = []
    return
  }
  s.records = s.records.filter((r) => r.product !== product)
}
