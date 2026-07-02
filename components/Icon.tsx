interface IconProps {
  name: string
  className?: string
}

const PATHS: Record<string, React.ReactNode> = {
  'shield-check': (
    <>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  'folder-search': (
    <>
      <path d="M4 4h5l2 2h7a2 2 0 0 1 2 2v3" />
      <path d="M4 4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h7" />
      <circle cx="17.5" cy="16.5" r="3.5" />
      <path d="m21 20-1.8-1.8" />
    </>
  ),
  check: <path d="M20 6 9 17l-5-5" />,
  copy: (
    <>
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </>
  ),
  bolt: <path d="M13 2 3 14h7l-1 8 10-12h-7l1-8z" />,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
}

export function Icon({ name, className = 'h-4 w-4' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {PATHS[name] ?? PATHS.bolt}
    </svg>
  )
}
