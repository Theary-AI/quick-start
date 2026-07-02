'use client'

import { useState } from 'react'
import { Icon } from './Icon'

export function JsonView({ value, maxHeight = '20rem' }: { value: unknown; maxHeight?: string }) {
  const [copied, setCopied] = useState(false)
  const text = typeof value === 'string' ? value : JSON.stringify(value, null, 2)

  const copy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="relative">
      <button
        onClick={copy}
        title="Copy JSON"
        className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-md bg-[var(--color-surface)] px-2 py-1 text-xs text-[var(--color-muted)] ring-1 ring-[var(--color-border)] transition hover:text-[var(--color-ink)]"
      >
        <Icon name={copied ? 'check' : 'copy'} className="h-3 w-3" />
        {copied ? 'Copied' : 'Copy'}
      </button>
      <pre
        className="scroll-thin overflow-auto rounded-lg bg-[var(--color-code)] p-4 font-mono text-xs leading-relaxed text-[var(--color-ink)] ring-1 ring-[var(--color-border)]"
        style={{ maxHeight }}
      >
        {text}
      </pre>
    </div>
  )
}
