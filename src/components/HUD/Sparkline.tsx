import type { CSSProperties } from 'react'

interface Props {
  seed?: string
  points?: number
  width?: number | string
  height?: number
  color?: string
  fillOpacity?: number
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
 * Deterministic decorative sparkline. Stays stable across renders per seed.
 */
export function Sparkline({
  seed = 'spark',
  points = 32,
  width = '100%',
  height = 28,
  color = 'var(--hud-line-soft)',
  fillOpacity = 0.06,
  style,
}: Props) {
  let state = hash(seed) || 1
  const rng = () => {
    state = (state * 1664525 + 1013904223) >>> 0
    return state / 0xffffffff
  }

  // Use a wider/flatter viewBox aspect ratio so when stretched into a
  // narrow horizontal strip via preserveAspectRatio="none" the curve
  // doesn't visually flatten into an almost-horizontal line.
  const W = 200
  const H = 30
  const padY = 3
  const stepX = W / (points - 1)

  // Random walk with stronger per-step amplitude so the curve is visibly
  // dynamic at small heights. We bias each step slightly toward the
  // centre line to keep it from clipping at the edges.
  let y = 0.5
  const ys: number[] = []
  for (let i = 0; i < points; i++) {
    const drift = (0.5 - y) * 0.12 // pull toward middle
    y += (rng() - 0.5) * 0.55 + drift
    y = Math.max(0.08, Math.min(0.92, y))
    ys.push(y)
  }

  const pts = ys.map((yv, i) => {
    const x = i * stepX
    const yPx = padY + yv * (H - padY * 2)
    return `${x.toFixed(2)},${yPx.toFixed(2)}`
  })

  const lineD = `M${pts.join(' L')}`
  const fillD = `${lineD} L${W},${H} L0,${H} Z`

  return (
    <svg
      aria-hidden
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      style={{ width, height, display: 'block', ...style }}
    >
      <path className="sparkline-fill" d={fillD} fill={color} style={{ ['--fill-opacity' as string]: fillOpacity }} />
      <path
        className="sparkline-path"
        d={lineD}
        fill="none"
        stroke={color}
        strokeWidth={1.1}
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}
