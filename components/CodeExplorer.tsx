'use client'

import Editor, { type Monaco } from '@monaco-editor/react'
import { useCallback, useMemo, useState } from 'react'
import { Icon } from './Icon'
import { SNIPPET_GROUPS, SNIPPETS, type CodeSnippet } from '@/lib/products/verification/snippets'

/** Dark theme tuned to match the app's JSON slab (--color-slab: #0f1729). */
const THEME_NAME = 'snh-slab'

function defineTheme(monaco: Monaco) {
  monaco.editor.defineTheme(THEME_NAME, {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '7c8aa5', fontStyle: 'italic' },
      { token: 'string', foreground: 'a5f3d0' },
      { token: 'number', foreground: 'fca5a5' },
      { token: 'keyword', foreground: 'c4b5fd' },
      { token: 'type', foreground: '93c5fd' },
      { token: 'key', foreground: '93c5fd' },
      { token: 'delimiter', foreground: '94a3b8' },
      { token: 'identifier', foreground: 'e2e8f0' },
    ],
    colors: {
      'editor.background': '#0f1729',
      'editor.foreground': '#e2e8f0',
      'editorLineNumber.foreground': '#3b4a68',
      'editorLineNumber.activeForeground': '#94a3b8',
      'editor.selectionBackground': '#312e81',
      'editor.lineHighlightBackground': '#16203a',
      'editorCursor.foreground': '#c4b5fd',
      'editorIndentGuide.background1': '#1e293b',
      'editorGutter.background': '#0f1729',
      'scrollbarSlider.background': '#33415580',
      'scrollbarSlider.hoverBackground': '#475569aa',
    },
  })
}

const LANG_LABEL: Record<CodeSnippet['language'], string> = {
  typescript: 'TypeScript',
  json: 'JSON',
  bash: 'Shell',
}

/** Groups that form a linear "do this in order" journey (numbered). */
const SEQUENTIAL_GROUPS = new Set<string>(['Call the API', 'Receive webhooks'])

/** Global step number per snippet in the sequential groups (1, 2, 3 …). */
const STEP_BY_ID: Record<string, number> = (() => {
  const map: Record<string, number> = {}
  let step = 0
  for (const group of SNIPPET_GROUPS) {
    if (!SEQUENTIAL_GROUPS.has(group)) continue
    for (const s of SNIPPETS.filter((s) => s.group === group)) map[s.id] = ++step
  }
  return map
})()

/** Colour that ties each webhook-form snippet to its badge in the live feed. */
function eventDotClass(id: string): string {
  if (id.includes('completed')) return 'bg-emerald-500'
  if (id.includes('notification')) return 'bg-sky-500'
  if (id.includes('action-required')) return 'bg-amber-500'
  return 'bg-[var(--color-subtle)]'
}

/** Filename shown in the editor tab, with sensible fallbacks per language. */
function tabLabel(s: CodeSnippet): string {
  if (s.filename) return s.filename
  if (s.language === 'bash') return 'terminal'
  if (s.language === 'json') return 'payload.json'
  return 'snippet.ts'
}

function ChevronIcon({ dir, className = 'h-4 w-4' }: { dir: 'left' | 'right'; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={dir === 'left' ? 'm15 18-6-6 6-6' : 'm9 18 6-6-6-6'} />
    </svg>
  )
}

function FileIcon({ className = 'h-3.5 w-3.5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 3v4a1 1 0 0 0 1 1h4" />
      <path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z" />
    </svg>
  )
}

export function CodeExplorer() {
  const [activeId, setActiveId] = useState<string>(SNIPPETS[0].id)
  const [copied, setCopied] = useState(false)

  const index = useMemo(() => Math.max(0, SNIPPETS.findIndex((s) => s.id === activeId)), [activeId])
  const active = SNIPPETS[index]
  const prev = index > 0 ? SNIPPETS[index - 1] : null
  const next = index < SNIPPETS.length - 1 ? SNIPPETS[index + 1] : null
  const lineCount = useMemo(() => active.code.split('\n').length, [active])

  // Auto-size the editor to the snippet (with a sensible cap) so there's no
  // inner scroll for short examples but long ones stay bounded.
  const height = useMemo(() => Math.min(Math.max(lineCount * 20 + 24, 260), 560), [lineCount])

  const copy = useCallback(async () => {
    await navigator.clipboard.writeText(active.code)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }, [active])

  return (
    <div className="grid gap-5 lg:grid-cols-[17rem_1fr]">
      {/* Compact grouped picker on small screens */}
      <div className="lg:hidden">
        <label className="mb-1.5 block text-xs font-medium text-[var(--color-muted)]">Jump to snippet</label>
        <select
          value={activeId}
          onChange={(e) => setActiveId(e.target.value)}
          className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-ink)] outline-none transition focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/20"
        >
          {SNIPPET_GROUPS.map((group) => (
            <optgroup key={group} label={group}>
              {SNIPPETS.filter((s) => s.group === group).map((s) => (
                <option key={s.id} value={s.id}>
                  {STEP_BY_ID[s.id] ? `${STEP_BY_ID[s.id]}. ` : ''}
                  {s.title}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      {/* Sticky grouped navigation on large screens */}
      <nav className="hidden self-start lg:sticky lg:top-24 lg:block">
        <div className="space-y-4">
          {SNIPPET_GROUPS.map((group) => {
            const numbered = SEQUENTIAL_GROUPS.has(group)
            return (
              <div key={group}>
                <p className="px-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-subtle)]">{group}</p>
                <ul className="mt-1.5 space-y-0.5">
                  {SNIPPETS.filter((s) => s.group === group).map((s) => {
                    const isActive = s.id === active.id
                    return (
                      <li key={s.id}>
                        <button
                          onClick={() => setActiveId(s.id)}
                          aria-current={isActive ? 'true' : undefined}
                          className={`group/item flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition ${
                            isActive
                              ? 'bg-[var(--color-accent-soft)] font-medium text-[var(--color-accent-strong)] ring-1 ring-[var(--color-accent)]/25'
                              : 'text-[var(--color-body)] hover:bg-[var(--color-surface-2)]'
                          }`}
                        >
                          {numbered ? (
                            <span
                              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold transition ${
                                isActive
                                  ? 'bg-[image:var(--gradient-brand)] text-white'
                                  : 'bg-[var(--color-surface-2)] text-[var(--color-muted)] ring-1 ring-[var(--color-border)] group-hover/item:ring-[var(--color-accent)]/30'
                              }`}
                            >
                              {STEP_BY_ID[s.id]}
                            </span>
                          ) : (
                            <span className={`h-2 w-2 shrink-0 rounded-full ${eventDotClass(s.id)}`} />
                          )}
                          <span className="truncate">{s.title}</span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )
          })}
        </div>
      </nav>

      {/* Editor panel */}
      <div className="min-w-0 space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-subtle)]">{active.group}</span>
              <span className="text-[var(--color-border)]">·</span>
              <span className="text-xs text-[var(--color-subtle)]">
                {index + 1} / {SNIPPETS.length}
              </span>
            </div>
            <h3 className="mt-1 text-base font-semibold text-[var(--color-ink)]">{active.title}</h3>
            <p className="mt-1 max-w-2xl text-xs leading-relaxed text-[var(--color-muted)]">{active.summary}</p>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl bg-[var(--color-slab)] shadow-elevate-md ring-1 ring-black/10">
          {/* Editor-style tab bar */}
          <div className="flex items-center justify-between gap-3 border-b border-white/10 bg-black/20 pl-3 pr-2">
            <div className="flex min-w-0 items-center gap-3">
              <div className="hidden items-center gap-1.5 sm:flex">
                <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
              </div>
              <span className="flex min-w-0 items-center gap-1.5 border-b-2 border-[var(--color-accent)] py-2.5 font-mono text-xs text-slate-200">
                <FileIcon className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                <span className="truncate">{tabLabel(active)}</span>
              </span>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className="hidden font-mono text-[11px] text-slate-500 sm:inline">
                {LANG_LABEL[active.language]} · {lineCount} lines
              </span>
              <button
                onClick={copy}
                title="Copy code"
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-slate-400 transition hover:bg-white/10 hover:text-slate-100"
              >
                <Icon name={copied ? 'check' : 'copy'} className="h-3 w-3" />
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>
          <Editor
            key={active.id}
            height={height}
            language={active.language}
            value={active.code}
            theme={THEME_NAME}
            beforeMount={defineTheme}
            loading={<div className="p-4 font-mono text-xs text-slate-400">Loading editor…</div>}
            options={{
              readOnly: true,
              domReadOnly: true,
              minimap: { enabled: false },
              fontSize: 13,
              lineHeight: 20,
              fontFamily: 'var(--font-ibm-plex-mono), ui-monospace, SFMono-Regular, Menlo, monospace',
              fontLigatures: true,
              scrollBeyondLastLine: false,
              padding: { top: 12, bottom: 12 },
              renderLineHighlight: 'none',
              scrollbar: { alwaysConsumeMouseWheel: false, verticalScrollbarSize: 8, horizontalScrollbarSize: 8 },
              wordWrap: 'off',
              tabSize: 2,
              guides: { indentation: false },
              overviewRulerLanes: 0,
              contextmenu: false,
            }}
          />
        </div>

        {/* Walk the integration end to end */}
        <div className="flex items-stretch justify-between gap-3">
          <StepButton dir="left" snippet={prev} onSelect={setActiveId} />
          <StepButton dir="right" snippet={next} onSelect={setActiveId} />
        </div>
      </div>
    </div>
  )
}

function StepButton({
  dir,
  snippet,
  onSelect,
}: {
  dir: 'left' | 'right'
  snippet: CodeSnippet | null
  onSelect: (id: string) => void
}) {
  if (!snippet) return <span className="flex-1" />
  const alignRight = dir === 'right'
  return (
    <button
      onClick={() => onSelect(snippet.id)}
      className={`group flex flex-1 items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-sm shadow-elevate-sm transition hover:border-[var(--color-accent)]/40 hover:text-[var(--color-ink)] ${
        alignRight ? 'flex-row-reverse text-right' : 'text-left'
      }`}
    >
      <ChevronIcon
        dir={dir}
        className={`h-4 w-4 shrink-0 text-[var(--color-subtle)] transition group-hover:text-[var(--color-accent)] ${
          alignRight ? 'group-hover:translate-x-0.5' : 'group-hover:-translate-x-0.5'
        }`}
      />
      <span className="min-w-0">
        <span className="block text-[11px] uppercase tracking-wide text-[var(--color-subtle)]">{alignRight ? 'Next' : 'Previous'}</span>
        <span className="block truncate font-medium text-[var(--color-body)]">{snippet.title}</span>
      </span>
    </button>
  )
}
