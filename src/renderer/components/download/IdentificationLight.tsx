import { cn } from '../../lib/utils'

interface IdentificationLightProps {
  /** undefined = not verified yet, true = identified, false = not identified */
  identified?: boolean
}

const STATES = {
  unknown: {
    dot: 'bg-muted-foreground',
    glow: '',
    text: 'text-muted-foreground',
    label: 'Identification not verified yet — start a download',
  },
  identified: {
    dot: 'bg-emerald-500',
    glow: 'shadow-[0_0_8px_2px] shadow-emerald-500/50',
    text: 'text-emerald-500',
    label: 'Identified — 320 kbps unlocked',
  },
  unidentified: {
    dot: 'bg-amber-500',
    glow: 'shadow-[0_0_8px_2px] shadow-amber-500/50',
    text: 'text-amber-500',
    label: 'Not identified — downloading at lower quality',
  },
} as const

export function IdentificationLight({ identified }: IdentificationLightProps) {
  const state =
    identified === undefined ? STATES.unknown : identified ? STATES.identified : STATES.unidentified

  return (
    <div className="flex w-full items-center gap-2 text-xs">
      <span className={cn('h-2.5 w-2.5 shrink-0 rounded-full', state.dot, state.glow)} />
      <span className={state.text}>{state.label}</span>
    </div>
  )
}
