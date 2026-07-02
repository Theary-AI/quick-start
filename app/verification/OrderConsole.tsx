'use client'

import { useMemo, useState } from 'react'
import { Icon } from '@/components/Icon'
import { JsonView } from '@/components/JsonView'
import { WebhookFeed } from '@/components/WebhookFeed'
import { buildOrderRequest, SAMPLE_FORM } from '@/lib/products/verification/sample'
import type { VerificationFormInput } from '@/lib/products/verification/types'

type FieldPath =
  | 'externalSearchId'
  | `applicant.${keyof VerificationFormInput['applicant']}`
  | `businessContext.${keyof VerificationFormInput['businessContext']}`
  | `employment.${keyof VerificationFormInput['employment']}`

interface OrderResult {
  ok: boolean
  status: number
  data?: { verificationOrderId: string; searchIds: string[] }
  error?: string
  sentBody?: unknown
  webhook?: { configured: boolean; url: string | null; signed: boolean; note: string | null }
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  required,
}: {
  label: string
  value: string | number
  onChange: (v: string) => void
  type?: string
  placeholder?: string
  required?: boolean
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-[var(--color-muted)]">
        {label}
        {required ? <span className="text-[var(--color-accent)]"> *</span> : null}
      </span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm font-normal text-[var(--color-ink)] outline-none transition placeholder:text-[var(--color-subtle)] focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/20"
      />
    </label>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-3">
      <legend className="text-xs font-semibold uppercase tracking-wide text-[var(--color-subtle)]">{title}</legend>
      {children}
    </fieldset>
  )
}

export function OrderConsole() {
  const [form, setForm] = useState<VerificationFormInput>(SAMPLE_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<OrderResult | null>(null)
  const [showPreview, setShowPreview] = useState(false)

  const set = (path: FieldPath, value: string) => {
    setForm((prev) => {
      const next = structuredClone(prev) as unknown as Record<string, unknown>
      const [group, key] = path.split('.') as [string, string]
      if (key === undefined) {
        next[group] = value
      } else {
        ;(next[group] as Record<string, unknown>)[key] = value
      }
      return next as unknown as VerificationFormInput
    })
  }

  const previewBody = useMemo(() => buildOrderRequest(form), [form])

  const submit = async () => {
    setSubmitting(true)
    setResult(null)
    try {
      const res = await fetch('/api/products/verification/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      setResult((await res.json()) as OrderResult)
    } catch (err) {
      setResult({ ok: false, status: 0, error: (err as Error).message })
    } finally {
      setSubmitting(false)
    }
  }

  const reset = () => {
    setForm(SAMPLE_FORM)
    setResult(null)
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Left: order form */}
      <div className="space-y-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-elevate-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[var(--color-ink)]">Create an employment verification order</h2>
          <button
            onClick={reset}
            className="rounded-md px-2 py-1 text-xs text-[var(--color-muted)] ring-1 ring-[var(--color-border)] transition hover:bg-[var(--color-surface-2)] hover:text-[var(--color-ink)]"
          >
            Reset sample
          </button>
        </div>

        <Section title="Applicant">
          <div className="grid grid-cols-2 gap-3">
            <Field label="First name" required value={form.applicant.firstName} onChange={(v) => set('applicant.firstName', v)} />
            <Field label="Last name" required value={form.applicant.lastName} onChange={(v) => set('applicant.lastName', v)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="SSN" required value={form.applicant.ssn} onChange={(v) => set('applicant.ssn', v)} placeholder="123-45-6789" />
            <Field label="Birthday" type="date" value={form.applicant.birthday ?? ''} onChange={(v) => set('applicant.birthday', v)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Email" type="email" value={form.applicant.email ?? ''} onChange={(v) => set('applicant.email', v)} />
            <Field label="Phone" value={form.applicant.phone ?? ''} onChange={(v) => set('applicant.phone', v)} />
          </div>
        </Section>

        <Section title="Position applied for">
          <Field label="Employer (hiring entity)" required value={form.businessContext.entityName} onChange={(v) => set('businessContext.entityName', v)} />
          <Field label="Job title" required value={form.businessContext.appliedJobTitle} onChange={(v) => set('businessContext.appliedJobTitle', v)} />
          <div className="grid grid-cols-3 gap-3">
            <Field label="Worksite city" required value={form.businessContext.worksiteCity} onChange={(v) => set('businessContext.worksiteCity', v)} />
            <Field label="State" required value={form.businessContext.worksiteState} onChange={(v) => set('businessContext.worksiteState', v)} placeholder="CA" />
            <Field label="Salary" type="number" required value={form.businessContext.proposedSalary} onChange={(v) => set('businessContext.proposedSalary', v)} />
          </div>
        </Section>

        <Section title="Employment to verify">
          <Field label="Employer name" required value={form.employment.employerName} onChange={(v) => set('employment.employerName', v)} />
          <Field label="Position held" required value={form.employment.position} onChange={(v) => set('employment.position', v)} />
          <Field label="Employer location" value={form.employment.employerLocation ?? ''} onChange={(v) => set('employment.employerLocation', v)} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Employer email" type="email" value={form.employment.employerEmail ?? ''} onChange={(v) => set('employment.employerEmail', v)} />
            <Field label="Employer phone" value={form.employment.employerPhone ?? ''} onChange={(v) => set('employment.employerPhone', v)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Start date" type="date" value={form.employment.startDate ?? ''} onChange={(v) => set('employment.startDate', v)} />
            <Field label="End date" type="date" value={form.employment.endDate ?? ''} onChange={(v) => set('employment.endDate', v)} />
          </div>
        </Section>

        <Section title="Tracking">
          <Field label="Your external search ID" value={form.externalSearchId} onChange={(v) => set('externalSearchId', v)} placeholder="quickstart-emp-001" />
        </Section>

        <div className="space-y-3 pt-1">
          <button
            onClick={submit}
            disabled={submitting}
            className="btn-shine flex w-full items-center justify-center gap-2 rounded-lg bg-[image:var(--gradient-brand)] px-4 py-2.5 text-sm font-semibold text-white shadow-[var(--elevate-accent)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            ) : (
              <Icon name="bolt" className="h-4 w-4" />
            )}
            {submitting ? 'Submitting…' : 'Submit verification order'}
          </button>

          <button
            onClick={() => setShowPreview((s) => !s)}
            className="text-xs text-[var(--color-muted)] transition hover:text-[var(--color-ink)]"
          >
            {showPreview ? 'Hide' : 'Show'} request body (POST /background-check/v1/orders)
          </button>
          {showPreview ? (
            <div>
              <p className="mb-2 text-xs text-[var(--color-muted)]">
                <code className="font-mono text-[var(--color-body)]">webhookConfig</code> is added by the server with your secret + tunnel URL.
              </p>
              <JsonView value={previewBody} maxHeight="18rem" />
            </div>
          ) : null}

          {result ? <ResultPanel result={result} /> : null}
        </div>
      </div>

      {/* Right: live webhook feed */}
      <WebhookFeed product="verification" />
    </div>
  )
}

function ResultPanel({ result }: { result: OrderResult }) {
  if (result.ok && result.data) {
    return (
      <div className="space-y-2 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
          <Icon name="check" className="h-4 w-4" /> Order created
        </div>
        <dl className="space-y-1 text-xs">
          <div className="flex justify-between gap-3">
            <dt className="text-[var(--color-muted)]">verificationOrderId</dt>
            <dd className="truncate font-mono text-[var(--color-ink)]">{result.data.verificationOrderId}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-[var(--color-muted)]">searchIds</dt>
            <dd className="truncate font-mono text-[var(--color-ink)]">{result.data.searchIds.join(', ')}</dd>
          </div>
        </dl>
        {result.webhook ? (
          <p className="text-xs text-[var(--color-muted)]">
            {result.webhook.configured
              ? `Webhooks → ${result.webhook.url} (${result.webhook.signed ? 'signed' : 'unsigned'})`
              : 'No webhook endpoint configured.'}
            {result.webhook.note ? <span className="mt-1 block text-amber-700">{result.webhook.note}</span> : null}
          </p>
        ) : null}
      </div>
    )
  }

  return (
    <div className="space-y-2 rounded-lg border border-red-200 bg-red-50 p-4">
      <div className="text-sm font-semibold text-red-700">Request failed{result.status ? ` (HTTP ${result.status})` : ''}</div>
      <p className="break-words text-xs text-[var(--color-body)]">{result.error}</p>
      {result.webhook?.note ? <p className="text-xs text-amber-700">{result.webhook.note}</p> : null}
    </div>
  )
}
