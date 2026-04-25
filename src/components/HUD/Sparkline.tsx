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

  const W = 100
  const H = 40
  const padY = 4
  const stepX = W / (points - 1)

  // Generate a smoothed random walk for a believable data curve
  let y = 0.5
  const ys: number[] = []
  for (let i = 0; i < points; i++) {
    y += (rng() - 0.5) * 0.35
    y = Math.max(0.05, Math.min(0.95, y))
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
      <path className="sparkline-path" d={lineD} fill="none" stroke={color} strokeWidth={0.6} vectorEffect="non-scaling-stroke" />
    </svg>
  )
}
