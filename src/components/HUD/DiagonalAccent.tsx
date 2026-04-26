import type { CSSProperties } from 'react'

interface Props {
  /** Rotation angle in degrees. Default 22 (subtle). */
  angle?: number
  /** Vertical offset of the line center, as a percentage of container. Default 50. */
  topPercent?: number
  /** Number of parallel lines (creates a small "comet" stack). Default 1. */
  lines?: 1 | 2 | 3
  /** Stroke color. */
  color?: string
  /** Layer opacity. Default 0.5. */
  opacity?: number
  className?: string
  style?: CSSProperties
}

/**
 * A single (or stacked few) diagonal line crossing the parent section.
 * Pure decoration. The line uses a 1px gradient that fades at both ends so it
 * never reads as a hard divider — just a subtle motion vector.
 *
 *   <DiagonalAccent angle={18} topPercent={40} lines={2} />
 *
 * The parent must be `position: relative` for this overlay to anchor inside.
 */
export function DiagonalAccent({
  angle = 22,
  topPercent = 50,
  lines = 1,
  color = 'var(--hud-line)',
  opacity = 0.5,
  className,
  style,
}: Props) {
  // Stack lines slightly offset vertically so they read as a "trail"
  const offsets = lines === 1
    ? [0]
    : lines === 2
      ? [-6, 6]
      : [-10, 0, 10]

  return (
    <div
      aria-hidden
      className={className}
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        opacity,
        ...style,
      }}
    >
      {offsets.map((offset, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            top: `calc(${topPercent}% + ${offset}px)`,
            left: '-15%',
            width: '130%',
            height: 1,
            background: `linear-gradient(to right, transparent 0%, ${color} 22%, ${color} 78%, transparent 100%)`,
            transform: `rotate(${angle}deg)`,
            transformOrigin: 'center',
            // Stagger the inner lines a touch in opacity so the bundle reads naturally
            opacity: 1 - Math.abs(offset) * 0.025,
          }}
        />
      ))}
    </div>
  )
}
