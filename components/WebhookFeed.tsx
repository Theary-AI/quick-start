'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { JsonView } from './JsonView'

interface WebhookRecord {
  id: string
  product: string
  receivedAt: string
  signature: 'verified' | 'invalid' | 'unsigned' | 'no-secret'
  headers: {
    eventType: string | null
    eventId: string | null
    searchType: string | null
    externalSearchId: string | null
    endpointSource: string | null
  }
  body: unknown
}

const EVENT_STYLES: Record<string, string> = {
  'verification.completed': 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  'verification.action_required': 'bg-amber-50 text-amber-700 ring-amber-200',
  'verification.notification': 'bg-sky-50 text-sky-700 ring-sky-200',
}

const SIG_STYLES: Record<WebhookRecord['signature'], { label: string; cls: string }> = {
  verified: { label: 'signature verified', cls: 'text-emerald-600' },
  invalid: { label: 'signature INVALID', cls: 'text-red-600' },
  unsigned: { label: 'unsigned', cls: 'text-amber-600' },
  'no-secret': { label: 'no secret set', cls: 'text-[var(--color-subtle)]' },
}

function EventCard({ rec, isNew }: { rec: WebhookRecord; isNew: boolean }) {
  const [open, setOpen] = useState(false)
  const eventType = rec.headers.eventType ?? (typeof rec.body === 'object' && rec.body && 'event' in rec.body ? String((rec.body as { event: unknown }).event) : 'webhook')
  const badge = EVENT_STYLES[eventType] ?? 'bg-[var(--color-surface-2)] text-[var(--color-body)] ring-[var(--color-border)]'
  const sig = SIG_STYLES[rec.signature]
  const time = new Date(rec.receivedAt).toLocaleTimeString()

  return (
    <div className={`overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-elevate-sm transition hover:border-[var(--color-accent)]/30 ${isNew ? 'animate-flash' : ''}`}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-start justify-between gap-3 p-3 text-left"
      >
        <div className="min-w-0 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-md px-2 py-0.5 font-mono text-xs ring-1 ${badge}`}>{eventType}</span>
            {rec.headers.searchType ? (
              <span className="rounded-md bg-[var(--color-surface-2)] px-2 py-0.5 text-xs text-[var(--color-muted)] ring-1 ring-[var(--color-border)]">
                {rec.headers.searchType}
              </span>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-[var(--color-subtle)]">
            <span>{time}</span>
            <span className={sig.cls}>{sig.label}</span>
            {rec.headers.externalSearchId ? <span className="font-mono">ext: {rec.headers.externalSearchId}</span> : null}
          </div>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-[var(--color-surface-2)] px-2 py-0.5 text-xs text-[var(--color-muted)] ring-1 ring-[var(--color-border)]">
          {open ? 'Hide' : 'View'}
          <svg
            className={`h-3 w-3 transition-transform ${open ? 'rotate-180' : ''}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </span>
      </button>
      {open ? (
        <div className="border-t border-[var(--color-border)] p-3">
          <JsonView value={rec.body} maxHeight="24rem" />
        </div>
      ) : null}
    </div>
  )
}

export function WebhookFeed({ product = 'verification' }: { product?: string }) {
  const [events, setEvents] = useState<WebhookRecord[]>([])
  const [live, setLive] = useState(true)
  const seenRef = useRef<Set<string>>(new Set())
  const [newIds, setNewIds] = useState<Set<string>>(new Set())

  const poll = useCallback(async () => {
    try {
      const res = await fetch(`/api/events?product=${product}`, { cache: 'no-store' })
      const data = (await res.json()) as { events: WebhookRecord[] }
      const fresh = data.events.filter((e) => !seenRef.current.has(e.id)).map((e) => e.id)
      if (fresh.length) {
        setNewIds(new Set(fresh))
        fresh.forEach((id) => seenRef.current.add(id))
        setTimeout(() => setNewIds(new Set()), 1300)
      }
      setEvents(data.events)
    } catch {
      /* ignore transient errors while polling */
    }
  }, [product])

  useEffect(() => {
    poll()
    if (!live) return
    const t = setInterval(poll, 2000)
    return () => clearInterval(t)
  }, [poll, live])

  const clear = async () => {
    await fetch(`/api/events?product=${product}`, { method: 'DELETE' })
    seenRef.current = new Set()
    setEvents([])
  }

  return (
    <div className="flex h-full flex-col rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)]/50 p-4 shadow-elevate-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            {live ? <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" /> : null}
            <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${live ? 'bg-emerald-500' : 'bg-[var(--color-subtle)]'}`} />
          </span>
          <h2 className="text-sm font-semibold text-[var(--color-ink)]">Live webhooks</h2>
          <span className="rounded-full bg-[var(--color-surface)] px-2 py-0.5 text-xs font-medium text-[var(--color-muted)] ring-1 ring-[var(--color-border)]">
            {events.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setLive((l) => !l)}
            className="rounded-md bg-[var(--color-surface)] px-2 py-1 text-xs text-[var(--color-muted)] ring-1 ring-[var(--color-border)] transition hover:text-[var(--color-ink)]"
          >
            {live ? 'Pause' : 'Resume'}
          </button>
          <button
            onClick={clear}
            className="rounded-md bg-[var(--color-surface)] px-2 py-1 text-xs text-[var(--color-muted)] ring-1 ring-[var(--color-border)] transition hover:text-[var(--color-ink)]"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="scroll-thin mt-3 flex-1 space-y-2 overflow-auto pr-0.5" style={{ maxHeight: '40rem' }}>
        {events.length === 0 ? (
          <div className="flex h-40 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-[var(--color-border)] text-center">
            <p className="text-sm text-[var(--color-muted)]">Waiting for webhooks…</p>
            <p className="max-w-xs text-xs text-[var(--color-subtle)]">
              Submit an order with a tunnel running. Completed, action-required, and progress events will appear here.
            </p>
          </div>
        ) : (
          events.map((e) => <EventCard key={e.id} rec={e} isNew={newIds.has(e.id)} />)
        )}
      </div>
    </div>
  )
}
