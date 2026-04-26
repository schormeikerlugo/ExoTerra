import type { CSSProperties } from 'react'

type Density = 'sparse' | 'medium' | 'dense'
type MarkType =
  | 'bracket-tl' | 'bracket-tr' | 'bracket-bl' | 'bracket-br'
  | 'plus' | 'dot' | 'tick-h' | 'tick-v' | 'chevron-r' | 'square'

const COUNT_BY_DENSITY: Record<Density, number> = {
  sparse: 6,
  medium: 10,
  dense: 16,
}

/** SVG path strokes for each mark inside a 10×10 viewBox.
 *  Drawn with stroke (not fill) so they look thin & precise like printer marks. */
const MARK_PATHS: Record<Exclude<MarkType, 'dot' | 'square'>, string> = {
  'bracket-tl': 'M 0 4 L 0 0 L 4 0',
  'bracket-tr': 'M 6 0 L 10 0 L 10 4',
  'bracket-bl': 'M 0 6 L 0 10 L 4 10',
  'bracket-br': 'M 6 10 L 10 10 L 10 6',
  'plus':       'M 5 0 L 5 10 M 0 5 L 10 5',
  'tick-h':     'M 0 5 L 10 5',
  'tick-v':     'M 5 0 L 5 10',
  'chevron-r':  'M 2 2 L 7 5 L 2 8',
}

const ALL_TYPES: MarkType[] = [
  'bracket-tl', 'bracket-tr', 'bracket-bl', 'bracket-br',
  'plus', 'plus',         // bias toward plus & brackets
  'dot', 'dot',
  'tick-h', 'tick-v',
  'chevron-r',
  'square',
]

function hash(str: string): number {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

interface Props {
  /** Seed makes the layout deterministic per-mount; supply a unique value per usage. */
  seed?: string
  density?: Density
  /** "white" alpha for marks. Default 0.22 — readable but unobtrusive. */
  opacity?: number
  /** Hide on mobile (≤768px) when the layer would feel cluttered. */
  hideMobile?: boolean
  /** Extra inset padding so marks don't touch the very edges. */
  inset?: number
  className?: string
  style?: CSSProperties
}

/**
 * Ambient layer of small alignment / registration marks scattered across the
 * container. Decorative only (pointer-events: none). Deterministic per seed.
 */
export function RegistrationField({
  seed = 'default',
  density = 'medium',
  opacity = 0.22,
  hideMobile = false,
  inset = 32,
  className,
  style,
}: Props) {
  const count = COUNT_BY_DENSITY[density]
  let s = hash(seed) || 1
  const rng = () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 0xffffffff
  }

  const marks = Array.from({ length: count }, () => {
    const type = ALL_TYPES[Math.floor(rng() * ALL_TYPES.length)]
    return {
      type,
      x: rng() * 100, // %
      y: rng() * 100, // %
      size: rng() < 0.25 ? 22 : rng() < 0.6 ? 16 : 11, // mix of medium-large and medium
    }
  })

  return (
    <div
      aria-hidden
      className={`hud-registration-field ${hideMobile ? 'hud-registration-field--hide-mobile' : ''} ${className ?? ''}`.trim()}
      style={{
        position: 'absolute',
        inset,
        pointerEvents: 'none',
        opacity,
        color: 'var(--hud-line)',
        ...style,
      }}
    >
      {marks.map((m, i) => (
        <span
          key={i}
          style={{
            position: 'absolute',
            left: `${m.x}%`,
            top: `${m.y}%`,
            transform: 'translate(-50%, -50%)',
            width: m.size,
            height: m.size,
            display: 'inline-block',
            lineHeight: 0,
          }}
        >
          {m.type === 'dot' && (
            <svg viewBox="0 0 10 10" width={m.size} height={m.size} aria-hidden>
              <circle cx="5" cy="5" r="2" fill="currentColor" />
            </svg>
          )}
          {m.type === 'square' && (
            <svg viewBox="0 0 10 10" width={m.size} height={m.size} aria-hidden>
              <rect x="2" y="2" width="6" height="6" fill="none" stroke="currentColor" strokeWidth="1.4" vectorEffect="non-scaling-stroke" />
            </svg>
          )}
          {m.type !== 'dot' && m.type !== 'square' && (
            <svg viewBox="0 0 10 10" width={m.size} height={m.size} aria-hidden>
              <path
                d={MARK_PATHS[m.type]}
                fill="none"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="square"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
          )}
        </span>
      ))}

      <style>{`
        @media (max-width: 768px) {
          .hud-registration-field--hide-mobile { display: none; }
        }
      `}</style>
    </div>
  )
}
