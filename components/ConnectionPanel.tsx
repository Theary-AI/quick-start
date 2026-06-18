'use client'

import { useCallback, useEffect, useState } from 'react'
import { Icon } from './Icon'

interface ConfigResponse {
  config: {
    apiBaseUrl: string
    authMethod: 'env-token' | 'client-credentials' | null
    hasCredentials: boolean
    hasWebhookSecret: boolean
    publicBaseUrl: string
    tokenTenant: string | null
    tokenWarning: string | null
  }
  tunnel: { publicBaseUrl: string | null; source: 'env' | 'ngrok' | null; webhookUrl: string | null }
  health: { ok: boolean; status: number; body?: unknown; error?: string }
}

const AUTH_METHOD_LABEL: Record<'env-token' | 'client-credentials', string> = {
  'env-token': 'AUTH_TOKEN',
  'client-credentials': 'client credentials',
}

function StatusDot({ ok }: { ok: boolean }) {
  return <span className={`h-2 w-2 shrink-0 rounded-full ${ok ? 'bg-emerald-400' : 'bg-amber-400'}`} />
}

function Row({ ok, label, children }: { ok: boolean; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <div className="flex items-center gap-2.5">
        <StatusDot ok={ok} />
        <span className="text-sm text-zinc-300">{label}</span>
      </div>
      <div className="text-right text-sm text-zinc-400">{children}</div>
    </div>
  )
}

export function ConnectionPanel({ product = 'verification' }: { product?: string }) {
  const [data, setData] = useState<ConfigResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/config?product=${product}`, { cache: 'no-store' })
      setData(await res.json())
    } finally {
      setLoading(false)
    }
  }, [product])

  useEffect(() => {
    refresh()
  }, [refresh])

  const copyWebhook = async () => {
    if (!data?.tunnel.webhookUrl) return
    await navigator.clipboard.writeText(data.tunnel.webhookUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-200">Setup status</h2>
        <button
          onClick={refresh}
          className="rounded-md px-2 py-1 text-xs text-zinc-400 ring-1 ring-[var(--color-border)] transition hover:text-zinc-100"
        >
          {loading ? 'Checking…' : 'Re-check'}
        </button>
      </div>

      <div className="mt-2 divide-y divide-[var(--color-border)]">
        <Row ok={Boolean(data?.health.ok)} label="API reachable">
          <span className="font-mono text-xs">{data?.config.apiBaseUrl}</span>
        </Row>

        <Row ok={Boolean(data?.config.hasCredentials) && Boolean(data?.config.authMethod)} label="Authentication">
          {data?.config.hasCredentials ? (
            data.config.tokenTenant ? (
              <span>
                <span className="text-zinc-500">{data.config.authMethod ? AUTH_METHOD_LABEL[data.config.authMethod] : ''} · </span>
                tenant <span className="font-mono text-xs text-emerald-300">{data.config.tokenTenant}</span>
              </span>
            ) : data.config.authMethod ? (
              <span className="text-amber-300">{AUTH_METHOD_LABEL[data.config.authMethod]} · no tenant claim</span>
            ) : (
              <span className="text-amber-300">credentials set, token not obtained</span>
            )
          ) : (
            <span className="text-amber-300">missing — set AUTH_CLIENT_ID + AUTH_CLIENT_SECRET</span>
          )}
        </Row>

        <Row ok={Boolean(data?.config.hasWebhookSecret)} label="Webhook secret">
          {data?.config.hasWebhookSecret ? 'configured (HMAC verify on)' : 'not set — webhooks unsigned'}
        </Row>

        <Row ok={Boolean(data?.tunnel.publicBaseUrl)} label="Public webhook URL">
          {data?.tunnel.webhookUrl ? (
            <button
              onClick={copyWebhook}
              title="Copy webhook URL"
              className="inline-flex max-w-[22rem] items-center gap-1.5 truncate rounded-md bg-[var(--color-surface-2)] px-2 py-1 font-mono text-xs text-zinc-300 ring-1 ring-[var(--color-border)] transition hover:text-zinc-100"
            >
              <Icon name={copied ? 'check' : 'copy'} className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{data.tunnel.webhookUrl}</span>
            </button>
          ) : (
            <span className="text-amber-300">start ngrok or set PUBLIC_BASE_URL</span>
          )}
        </Row>
      </div>

      {data?.config.tokenWarning ? (
        <p className="mt-3 rounded-md bg-amber-500/10 px-3 py-2 text-xs text-amber-300 ring-1 ring-amber-500/25">
          {data.config.tokenWarning}
        </p>
      ) : null}
      {data && !data.tunnel.publicBaseUrl ? (
        <p className="mt-3 rounded-md bg-zinc-700/20 px-3 py-2 text-xs text-zinc-400 ring-1 ring-[var(--color-border)]">
          Run <code className="text-zinc-200">npm run tunnel</code> in a second terminal to expose this app, then re-check.
          The detected URL is attached automatically when you submit an order.
        </p>
      ) : null}
    </section>
  )
}
