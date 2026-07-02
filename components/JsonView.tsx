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
    <div className="overflow-hidden rounded-xl bg-[var(--color-slab)] shadow-elevate-md ring-1 ring-black/10">
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
        </div>
        <button
          onClick={copy}
          title="Copy JSON"
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-slate-400 transition hover:bg-white/10 hover:text-slate-100"
        >
          <Icon name={copied ? 'check' : 'copy'} className="h-3 w-3" />
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre
        className="scroll-thin overflow-auto px-4 py-3.5 font-mono text-xs leading-relaxed text-[var(--color-slab-ink)]"
        style={{ maxHeight }}
      >
        {text}
      </pre>
    </div>
  )
}
