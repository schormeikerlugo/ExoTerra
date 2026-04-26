import type { CSSProperties } from 'react'

type Variant = 'hex' | 'coords' | 'flight' | 'rec' | 'channel' | 'lot'

interface Props {
  /** Seed makes the generated code deterministic per usage. */
  seed?: string
  variant?: Variant
  /** Optional prefix label rendered before the code in dimmer color. */
  label?: string
  /** Override font size. Default 9px. */
  size?: number
  className?: string
  style?: CSSProperties
}

function hash(str: string): number {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function generate(seed: string, variant: Variant): string {
  const s = hash(seed) || 1
  const a = s & 0xFFFF
  const b = (s >>> 16) & 0xFFFF
  switch (variant) {
    case 'hex':
      return `0x${a.toString(16).toUpperCase().padStart(4, '0')} ${b.toString(16).toUpperCase().padStart(4, '0')}`
    case 'coords': {
      const x = ((a % 9999) / 1000).toFixed(3)
      const y = (b % 99999).toString().padStart(5, '0')
      return `${x} · ${y}`
    }
    case 'flight':
      return `HJ${(a % 9999).toString().padStart(4, '0')}//${(b % 999).toString().padStart(3, '0')}`
    case 'rec': {
      const yy = new Date().getFullYear()
      return `REC_${yy}.${(a % 99999).toString().padStart(5, '0')}`
    }
    case 'channel':
      return `CH-${(a % 99).toString().padStart(2, '0')} / ${(b % 999).toString().padStart(3, '0')}`
    case 'lot':
      return `№${(a % 9999).toString().padStart(4, '0')} L${(b % 999).toString().padStart(3, '0')}`
  }
}

/**
 * Pseudo-serial / tracking code rendered in mono micro type. Decorative —
 * always rendered in dim color so users don't read it as functional data.
 *
 *   <TrackingCode seed="hero" variant="hex" />        → "0xA8F2 1F7D"
 *   <TrackingCode seed={planet.pl_name} variant="coords" />  → "9.283 · 04221"
 *   <TrackingCode seed="sec03" variant="rec" label="REC" />  → "REC  REC_2026.06158"
 */
export function TrackingCode({
  seed = 'tracking',
  variant = 'hex',
  label,
  size = 9,
  className,
  style,
}: Props) {
  const code = generate(seed, variant)
  return (
    <span
      aria-hidden
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        fontFamily: 'var(--font-mono)',
        fontSize: size,
        letterSpacing: 1.5,
        color: 'var(--text-dim)',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      {label && <span style={{ opacity: 0.6 }}>{label}</span>}
      <span style={{ color: 'var(--text-muted)' }}>{code}</span>
    </span>
  )
}
