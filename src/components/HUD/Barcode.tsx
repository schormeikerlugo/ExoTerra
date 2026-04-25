import type { CSSProperties } from 'react'

interface Props {
  seed?: string
  bars?: number
  height?: number
  color?: string
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

/**
 * Deterministic decorative barcode. Generates a fixed bar sequence from a seed
 * so it stays stable across renders but reads as "unique" per location.
 */
export function Barcode({
  seed = 'exoterra',
  bars = 38,
  height = 28,
  color = 'var(--hud-line-soft)',
  style,
}: Props) {
  let state = hash(seed) || 1
  const rng = () => {
    state = (state * 1664525 + 1013904223) >>> 0
    return state / 0xffffffff
  }

  const items: { w: number; opacity: number }[] = []
  for (let i = 0; i < bars; i++) {
    const r = rng()
    const w = r < 0.15 ? 3 : r < 0.5 ? 2 : 1
    const opacity = rng() < 0.2 ? 0.35 : rng() < 0.5 ? 0.7 : 1
    items.push({ w, opacity })
  }

  return (
    <div
      aria-hidden
      style={{
        display: 'inline-flex',
        alignItems: 'stretch',
        gap: 1,
        height,
        ...style,
      }}
    >
      {items.map((b, i) => (
        <span
          key={i}
          style={{
            width: b.w,
            background: color,
            opacity: b.opacity,
          }}
        />
      ))}
    </div>
  )
}
