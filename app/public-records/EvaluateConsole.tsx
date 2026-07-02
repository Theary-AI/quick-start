'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Icon } from '@/components/Icon'
import { JsonView } from '@/components/JsonView'
import { buildEvaluateRequest, parseOffenseIds, SAMPLE_FORM } from '@/lib/products/public-records/sample'
import type { EvaluateResponse, OffenseDecision, PublicRecordsFormInput } from '@/lib/products/public-records/types'

type FieldPath = 'searchId' | 'searchDate' | 'applicantState' | 'offenseIds' | `candidate.${keyof PublicRecordsFormInput['candidate']}`

interface EvaluateResult {
  ok: boolean
  status: number
  data?: EvaluateResponse
  error?: string
  sentBody?: unknown
}

interface ConfigResponse {
  config: {
    apiBaseUrl: string
    authMethod: 'env-token' | 'api-key' | null
    hasCredentials: boolean
    tokenSubject: string | null
    tokenTier: string | null
    tokenAlg: string | null
    tokenWarning: string | null
  }
  health: { ok: boolean; status: number; body?: unknown; error?: string }
}

const AUTH_METHOD_LABEL: Record<'env-token' | 'api-key', string> = {
  'env-token': 'PUBLIC_RECORDS_TOKEN',
  'api-key': 'API key exchange',
}

const US_STATES = new Set([
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA',
  'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK',
  'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'DC', 'PR', 'GU', 'VI',
  'AS', 'MP',
])

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

interface XmlInfo {
  ok: boolean
  caseCount: number
  error?: string
}

/** Inspect the screening XML for well-formedness and count <case> elements. */
function inspectXml(xml: string): XmlInfo {
  if (!xml.trim()) return { ok: false, caseCount: 0, error: 'Required' }
  if (typeof window === 'undefined' || typeof window.DOMParser === 'undefined') {
    return { ok: true, caseCount: 0 }
  }
  try {
    const doc = new DOMParser().parseFromString(xml, 'application/xml')
    if (doc.getElementsByTagName('parsererror').length > 0) {
      return { ok: false, caseCount: 0, error: 'XML is not well-formed' }
    }
    if (doc.getElementsByTagName('ScreeningResults').length === 0) {
      return { ok: false, caseCount: 0, error: 'Missing a <ScreeningResults> root element' }
    }
    return { ok: true, caseCount: doc.getElementsByTagName('case').length }
  } catch {
    return { ok: false, caseCount: 0, error: 'Could not parse XML' }
  }
}

type FieldErrors = Partial<Record<FieldPath | 'xml', string>>

function validate(form: PublicRecordsFormInput, xmlInfo: XmlInfo): FieldErrors {
  const e: FieldErrors = {}

  if (!form.searchId.trim()) e.searchId = 'Required'
  if (!form.searchDate) e.searchDate = 'Required'

  const state = form.applicantState.trim().toUpperCase()
  if (!state) e.applicantState = 'Required'
  else if (!US_STATES.has(state)) e.applicantState = 'Use a 2-letter state code'

  if (parseOffenseIds(form.offenseIds).length === 0) e.offenseIds = 'Add at least one offense ID'

  if (!form.candidate.first_name.trim()) e['candidate.first_name'] = 'Required'
  if (!form.candidate.last_name.trim()) e['candidate.last_name'] = 'Required'

  if (!form.candidate.date_of_birth) {
    e['candidate.date_of_birth'] = 'Required'
  } else {
    const dob = new Date(form.candidate.date_of_birth)
    if (Number.isNaN(dob.getTime())) e['candidate.date_of_birth'] = 'Invalid date'
    else if (dob > new Date()) e['candidate.date_of_birth'] = 'Must be in the past'
  }

  const ssnDigits = form.candidate.ssn.replace(/\D/g, '')
  if (!form.candidate.ssn.trim()) e['candidate.ssn'] = 'Required'
  else if (ssnDigits.length !== 9) e['candidate.ssn'] = 'Must be 9 digits'

  if (!xmlInfo.ok) e.xml = xmlInfo.error ?? 'Invalid XML'

  return e
}

// ---------------------------------------------------------------------------
// Presentational helpers
// ---------------------------------------------------------------------------

/** Color treatment for the various queues / decisions in the response. */
function badgeClass(value: string): string {
  const v = value.toLowerCase()
  if (/(^|\b)(automation|not[_ ]reportable|clear|pass)/.test(v)) return 'bg-emerald-50 text-emerald-700 ring-emerald-200'
  if (/(reportable|fail)/.test(v)) return 'bg-red-50 text-red-700 ring-red-200'
  if (/(manual[_ ]review|insufficient|auditor|review|pending)/.test(v)) return 'bg-amber-50 text-amber-700 ring-amber-200'
  return 'bg-[var(--color-surface-2)] text-[var(--color-body)] ring-[var(--color-border)]'
}

function Badge({ value }: { value: string }) {
  return <span className={`rounded-md px-2 py-0.5 font-mono text-xs ring-1 ${badgeClass(value)}`}>{value}</span>
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  required,
  error,
  inputMode,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  placeholder?: string
  required?: boolean
  error?: string
  inputMode?: 'text' | 'numeric'
}) {
  const borderClass = error
    ? 'border-red-400 focus:border-red-400 focus:ring-red-500/20'
    : 'border-[var(--color-border)] focus:border-emerald-500 focus:ring-emerald-500/20'
  return (
    <label className="block">
      <span className="text-xs font-medium text-[var(--color-muted)]">
        {label}
        {required ? <span className="text-emerald-600"> *</span> : null}
      </span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        inputMode={inputMode}
        aria-invalid={error ? true : undefined}
        onChange={(e) => onChange(e.target.value)}
        className={`mt-1 w-full rounded-lg border bg-[var(--color-surface)] px-3 py-2 text-sm font-normal text-[var(--color-ink)] outline-none transition placeholder:text-[var(--color-subtle)] focus:ring-2 ${borderClass}`}
      />
      {error ? <span className="mt-1 block text-xs text-red-600">{error}</span> : null}
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

function SetupStatus({ data, loading, onRefresh }: { data: ConfigResponse | null; loading: boolean; onRefresh: () => void }) {
  const c = data?.config
  return (
    <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-elevate-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">
            <Icon name="bolt" className="h-3.5 w-3.5" />
          </span>
          <h2 className="text-sm font-semibold text-[var(--color-ink)]">Setup status</h2>
        </div>
        <button
          onClick={onRefresh}
          className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs text-[var(--color-muted)] ring-1 ring-[var(--color-border)] transition hover:bg-[var(--color-surface-2)] hover:text-[var(--color-ink)]"
        >
          {loading ? <span className="h-3 w-3 animate-spin rounded-full border-[1.5px] border-[var(--color-subtle)] border-t-transparent" /> : null}
          {loading ? 'Checking…' : 'Re-check'}
        </button>
      </div>

      <div className="mt-2 divide-y divide-[var(--color-border)]">
        <div className="flex items-center justify-between gap-4 py-2.5">
          <div className="flex items-center gap-2.5">
            <span
              className={`h-2 w-2 shrink-0 rounded-full ${
                data?.health.ok ? 'bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.18)]' : 'bg-amber-500 shadow-[0_0_0_3px_rgba(245,158,11,0.18)]'
              }`}
            />
            <span className="text-sm text-[var(--color-body)]">API reachable</span>
          </div>
          <span className="font-mono text-xs text-[var(--color-muted)]">{c?.apiBaseUrl}</span>
        </div>

        <div className="flex items-center justify-between gap-4 py-2.5">
          <div className="flex items-center gap-2.5">
            <span
              className={`h-2 w-2 shrink-0 rounded-full ${
                c?.hasCredentials && c?.authMethod ? 'bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.18)]' : 'bg-amber-500 shadow-[0_0_0_3px_rgba(245,158,11,0.18)]'
              }`}
            />
            <span className="text-sm text-[var(--color-body)]">Authentication</span>
          </div>
          <div className="text-right text-sm text-[var(--color-muted)]">
            {c?.hasCredentials ? (
              c.authMethod ? (
                <span>
                  <span className="text-[var(--color-subtle)]">{AUTH_METHOD_LABEL[c.authMethod]}</span>
                  {c.tokenSubject ? (
                    <>
                      <span className="text-[var(--color-subtle)]"> · </span>
                      <span className="font-mono text-xs text-emerald-600">{c.tokenSubject}</span>
                    </>
                  ) : null}
                  {c.tokenTier ? <span className="text-[var(--color-subtle)]"> · {c.tokenTier}</span> : null}
                </span>
              ) : (
                <span className="text-amber-600">credentials set, token not obtained</span>
              )
            ) : (
              <span className="text-amber-600">missing — set PUBLIC_RECORDS_API_KEY or PUBLIC_RECORDS_TOKEN</span>
            )}
          </div>
        </div>
      </div>

      {c?.tokenWarning ? (
        <p className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-700 ring-1 ring-amber-200">{c.tokenWarning}</p>
      ) : null}
    </section>
  )
}

export function EvaluateConsole() {
  const [form, setForm] = useState<PublicRecordsFormInput>(SAMPLE_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<EvaluateResult | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [attempted, setAttempted] = useState(false)

  const [config, setConfig] = useState<ConfigResponse | null>(null)
  const [configLoading, setConfigLoading] = useState(true)

  const refreshConfig = useCallback(async () => {
    setConfigLoading(true)
    try {
      const res = await fetch('/api/products/public-records/config', { cache: 'no-store' })
      setConfig(await res.json())
    } catch {
      setConfig(null)
    } finally {
      setConfigLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshConfig()
  }, [refreshConfig])

  const set = (path: FieldPath, value: string) => {
    setForm((prev) => {
      const next = structuredClone(prev) as unknown as Record<string, unknown>
      const [group, key] = path.split('.') as [string, string]
      if (key === undefined) {
        next[group] = value
      } else {
        ;(next[group] as Record<string, unknown>)[key] = value
      }
      return next as unknown as PublicRecordsFormInput
    })
  }

  const xmlInfo = useMemo(() => inspectXml(form.xml), [form.xml])
  const errors = useMemo(() => validate(form, xmlInfo), [form, xmlInfo])
  const errorCount = Object.keys(errors).length
  const offenseChips = useMemo(() => parseOffenseIds(form.offenseIds), [form.offenseIds])
  const previewBody = useMemo(() => buildEvaluateRequest(form), [form])

  const hasCredentials = Boolean(config?.config.hasCredentials)
  const err = (path: FieldPath | 'xml') => (attempted ? errors[path] : undefined)

  const submit = useCallback(async () => {
    setAttempted(true)
    if (Object.keys(validate(form, inspectXml(form.xml))).length > 0) return

    setSubmitting(true)
    setResult(null)

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 60_000)
    try {
      const res = await fetch('/api/products/public-records/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
        signal: controller.signal,
      })

      const text = await res.text()
      let parsed: EvaluateResult
      try {
        parsed = text ? (JSON.parse(text) as EvaluateResult) : { ok: res.ok, status: res.status }
      } catch {
        parsed = { ok: false, status: res.status, error: text || `Unexpected non-JSON response (HTTP ${res.status}).` }
      }
      setResult(parsed)
    } catch (e) {
      const aborted = (e as Error).name === 'AbortError'
      setResult({
        ok: false,
        status: 0,
        error: aborted ? 'The evaluation timed out after 60s. Try again.' : (e as Error).message,
      })
    } finally {
      clearTimeout(timeout)
      setSubmitting(false)
    }
  }, [form])

  const reset = () => {
    setForm(SAMPLE_FORM)
    setResult(null)
    setAttempted(false)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && !submitting) {
      e.preventDefault()
      submit()
    }
  }

  return (
    <div className="space-y-6" onKeyDown={onKeyDown}>
      <SetupStatus data={config} loading={configLoading} onRefresh={refreshConfig} />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left: record form */}
        <div className="space-y-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-elevate-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[var(--color-ink)]">Evaluate a public record</h2>
            <button
              onClick={reset}
              className="rounded-md px-2 py-1 text-xs text-[var(--color-muted)] ring-1 ring-[var(--color-border)] transition hover:bg-[var(--color-surface-2)] hover:text-[var(--color-ink)]"
            >
              Reset sample
            </button>
          </div>

          <Section title="Search">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Search ID" required value={form.searchId} onChange={(v) => set('searchId', v)} error={err('searchId')} />
              <Field label="Search date" type="date" required value={form.searchDate} onChange={(v) => set('searchDate', v)} error={err('searchDate')} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field
                label="Applicant state"
                required
                value={form.applicantState}
                onChange={(v) => set('applicantState', v.toUpperCase().slice(0, 2))}
                placeholder="OR"
                error={err('applicantState')}
              />
              <Field label="Offense IDs" required value={form.offenseIds} onChange={(v) => set('offenseIds', v)} placeholder="2050, 2051" error={err('offenseIds')} />
            </div>
            {offenseChips.length > 0 ? (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs text-[var(--color-subtle)]">Parsed {offenseChips.length}:</span>
                {offenseChips.map((id) => (
                  <span key={id} className="rounded-md bg-[var(--color-surface-2)] px-2 py-0.5 font-mono text-xs text-[var(--color-body)] ring-1 ring-[var(--color-border)]">
                    {id}
                  </span>
                ))}
              </div>
            ) : null}
          </Section>

          <Section title="Candidate">
            <div className="grid grid-cols-3 gap-3">
              <Field label="First name" required value={form.candidate.first_name} onChange={(v) => set('candidate.first_name', v)} error={err('candidate.first_name')} />
              <Field label="Middle" value={form.candidate.middle_name ?? ''} onChange={(v) => set('candidate.middle_name', v)} />
              <Field label="Last name" required value={form.candidate.last_name} onChange={(v) => set('candidate.last_name', v)} error={err('candidate.last_name')} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Date of birth" type="date" required value={form.candidate.date_of_birth} onChange={(v) => set('candidate.date_of_birth', v)} error={err('candidate.date_of_birth')} />
              <Field label="SSN" required value={form.candidate.ssn} onChange={(v) => set('candidate.ssn', v)} placeholder="445667890" inputMode="numeric" error={err('candidate.ssn')} />
            </div>
            <Field label="Address" value={form.candidate.address} onChange={(v) => set('candidate.address', v)} />
          </Section>

          <Section title="Screening XML">
            <label className="block">
              <span className="flex items-center justify-between text-xs font-medium text-[var(--color-muted)]">
                <span>
                  Raw record XML<span className="text-emerald-600"> *</span>
                </span>
                {form.xml.trim() ? (
                  xmlInfo.ok ? (
                    <span className="text-emerald-600">well-formed · {xmlInfo.caseCount} case{xmlInfo.caseCount === 1 ? '' : 's'}</span>
                  ) : (
                    <span className="text-red-600">{xmlInfo.error}</span>
                  )
                ) : null}
              </span>
              <textarea
                value={form.xml}
                onChange={(e) => setForm((prev) => ({ ...prev, xml: e.target.value }))}
                rows={6}
                spellCheck={false}
                aria-invalid={err('xml') ? true : undefined}
                className={`scroll-thin mt-1 w-full rounded-lg border bg-[var(--color-code)] px-3 py-2 font-mono text-xs leading-relaxed text-[var(--color-ink)] outline-none transition placeholder:text-[var(--color-subtle)] focus:ring-2 ${
                  err('xml')
                    ? 'border-red-400 focus:border-red-400 focus:ring-red-500/20'
                    : 'border-[var(--color-border)] focus:border-emerald-500 focus:ring-emerald-500/20'
                }`}
              />
            </label>
          </Section>

          <div className="space-y-3 pt-1">
            {attempted && errorCount > 0 ? (
              <p className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700 ring-1 ring-red-200">
                Fix {errorCount} field{errorCount === 1 ? '' : 's'} above before submitting.
              </p>
            ) : null}
            {!configLoading && !hasCredentials ? (
              <p className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-700 ring-1 ring-amber-200">
                No Public Records credentials detected. Set <code className="font-mono">PUBLIC_RECORDS_API_KEY</code> in <code className="font-mono">.env.local</code> and restart.
              </p>
            ) : null}

            <button
              onClick={submit}
              disabled={submitting || !hasCredentials}
              title={!hasCredentials ? 'Configure PUBLIC_RECORDS_API_KEY first' : 'Cmd/Ctrl + Enter'}
              className="btn-shine flex w-full items-center justify-center gap-2 rounded-lg bg-[linear-gradient(135deg,#10b981,#14b8a6)] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_12px_30px_-10px_rgba(16,185,129,0.5)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              ) : (
                <Icon name="bolt" className="h-4 w-4" />
              )}
              {submitting ? 'Evaluating…' : 'Evaluate record'}
            </button>

            <button onClick={() => setShowPreview((s) => !s)} className="text-xs text-[var(--color-muted)] transition hover:text-[var(--color-ink)]">
              {showPreview ? 'Hide' : 'Show'} request body (POST /evaluate)
            </button>
            {showPreview ? <JsonView value={previewBody} maxHeight="18rem" /> : null}
          </div>
        </div>

        {/* Right: decision */}
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)]/50 p-4 shadow-elevate-sm">
          {submitting ? <LoadingState /> : result ? <ResultPanel result={result} /> : <EmptyState />}
        </div>
      </div>
    </div>
  )
}

function LoadingState() {
  return (
    <div className="flex h-full min-h-[20rem] flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-[var(--color-border)] text-center">
      <span className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-200 border-t-emerald-600" />
      <p className="text-sm text-[var(--color-muted)]">Evaluating record…</p>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex h-full min-h-[20rem] flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-[var(--color-border)] text-center">
      <p className="text-sm text-[var(--color-muted)]">No decision yet</p>
      <p className="max-w-xs text-xs text-[var(--color-subtle)]">
        Evaluate a record to see the compliance routing decision — search queue, per-offense reportability, and identity scoring.
      </p>
    </div>
  )
}

function ValidationIssues({ issues }: { issues: unknown[] }) {
  if (!issues.length) return null
  return (
    <div className="space-y-1.5 rounded-lg border border-amber-200 bg-amber-50 p-3">
      <p className="text-xs font-semibold text-amber-700">Data quality issues</p>
      <ul className="space-y-1 text-xs text-[var(--color-body)]">
        {issues.map((issue, i) => (
          <li key={i} className="flex gap-2">
            <span className="text-amber-500">•</span>
            <span className="break-words">{typeof issue === 'string' ? issue : JSON.stringify(issue)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function OffenseRow({ offense }: { offense: OffenseDecision }) {
  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm text-[var(--color-ink)]">{offense.charge || 'Not Specified'}</span>
        {offense.charge_decision ? <Badge value={offense.charge_decision} /> : null}
      </div>
      <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
        <div className="flex justify-between gap-2">
          <dt className="text-[var(--color-muted)]">offense_id</dt>
          <dd className="font-mono text-[var(--color-body)]">{offense.offense_id}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-[var(--color-muted)]">queue</dt>
          <dd className="text-[var(--color-body)]">{offense.routing?.queue ?? '—'}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-[var(--color-muted)]">reportability</dt>
          <dd className="text-[var(--color-body)]">{offense.routing?.reportability ?? '—'}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-[var(--color-muted)]">automatable</dt>
          <dd className="text-[var(--color-body)]">{offense.routing ? (offense.routing.is_automatable ? 'yes' : 'no') : '—'}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-[var(--color-muted)]">identity</dt>
          <dd className="text-[var(--color-body)]">{offense.routing?.identity_level ?? '—'}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-[var(--color-muted)]">identity_score</dt>
          <dd className="font-mono text-[var(--color-body)]">{offense.routing?.identity_score ?? '—'}</dd>
        </div>
      </dl>
    </div>
  )
}

/** Human-friendly hint for common HTTP failure codes from the evaluation API. */
function errorHint(status: number): string | null {
  switch (status) {
    case 401:
      return 'Unauthorized — the CRA token was rejected. Check PUBLIC_RECORDS_API_KEY / PUBLIC_RECORDS_TOKEN (CRA requires an HS256 token).'
    case 403:
      return 'Forbidden — the token is valid but not allowed to evaluate this record.'
    case 422:
      return 'Validation required — the record needs manual review or is missing required data.'
    case 429:
      return 'Rate limit exceeded — wait a moment and try again.'
    case 500:
      return 'Server error — the evaluation pipeline failed. Retry, and contact support if it persists.'
    default:
      return null
  }
}

function ResultPanel({ result }: { result: EvaluateResult }) {
  const [showRaw, setShowRaw] = useState(false)

  if (!result.ok || !result.data?.success) {
    const hint = errorHint(result.status)
    return (
      <div className="space-y-2 rounded-lg border border-red-200 bg-red-50 p-4">
        <div className="text-sm font-semibold text-red-700">Evaluation failed{result.status ? ` (HTTP ${result.status})` : ''}</div>
        {hint ? <p className="text-xs text-amber-700">{hint}</p> : null}
        <p className="break-words text-xs text-[var(--color-body)]">{result.error ?? 'The evaluation API returned an unsuccessful response.'}</p>
        {result.data ? <JsonView value={result.data} maxHeight="20rem" /> : null}
      </div>
    )
  }

  const data = result.data.data
  const decision = data?.decision
  const issues = (data?.validation?.issues ?? []) as unknown[]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
          <Icon name="check" className="h-4 w-4" /> Evaluation complete
        </div>
        <button onClick={() => setShowRaw((s) => !s)} className="text-xs text-[var(--color-muted)] transition hover:text-[var(--color-ink)]">
          {showRaw ? 'Hide' : 'Show'} raw JSON
        </button>
      </div>

      {decision ? (
        <div className="space-y-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            {decision.search_queue ? (
              <div className="space-y-1">
                <p className="text-xs text-[var(--color-muted)]">Search queue</p>
                <Badge value={decision.search_queue} />
              </div>
            ) : null}
            {decision.record_decision ? (
              <div className="space-y-1">
                <p className="text-xs text-[var(--color-muted)]">Record decision</p>
                <Badge value={decision.record_decision} />
              </div>
            ) : null}
            {data?.status ? (
              <div className="space-y-1">
                <p className="text-xs text-[var(--color-muted)]">Status</p>
                <Badge value={data.status} />
              </div>
            ) : null}
          </div>
        </div>
      ) : (
        <p className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-xs text-[var(--color-muted)]">
          The API returned success but no decision payload. See the raw JSON for details.
        </p>
      )}

      <ValidationIssues issues={issues} />

      {decision?.court_decisions?.map((court, ci) => (
        <div key={court.court_search_id ?? ci} className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs text-[var(--color-muted)]">{court.court_search_id}</span>
            {court.court_queue ? <Badge value={court.court_queue} /> : null}
          </div>
          {court.case_decisions?.map((c, idx) => (
            <div key={c.case_number ?? idx} className="space-y-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs text-[var(--color-body)]">
                  Case <span className="font-mono">{c.case_number}</span>
                </span>
                {c.case_queue ? <Badge value={c.case_queue} /> : null}
              </div>
              <div className="space-y-2">
                {c.offenses?.map((o, oi) => (
                  <OffenseRow key={o.offense_id ?? oi} offense={o} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ))}

      <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
        {data?.search_id ? (
          <div className="flex justify-between gap-2">
            <dt className="text-[var(--color-muted)]">search_id</dt>
            <dd className="font-mono text-[var(--color-body)]">{data.search_id}</dd>
          </div>
        ) : null}
        {data?.correlation_id ? (
          <div className="flex justify-between gap-2">
            <dt className="text-[var(--color-muted)]">correlation_id</dt>
            <dd className="truncate font-mono text-[var(--color-body)]">{data.correlation_id}</dd>
          </div>
        ) : null}
        {data?.timing?.total_ms !== undefined ? (
          <div className="flex justify-between gap-2">
            <dt className="text-[var(--color-muted)]">total_ms</dt>
            <dd className="font-mono text-[var(--color-body)]">{data.timing.total_ms}</dd>
          </div>
        ) : null}
      </dl>

      {showRaw ? <JsonView value={result.data} maxHeight="24rem" /> : null}
    </div>
  )
}
