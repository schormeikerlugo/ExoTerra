import type { CSSProperties } from 'react'

interface Props {
  /** Stripe angle in degrees (default 45 = forward slash). */
  angle?: number
  /** Total cycle width in px (stripe + gap). Default 7. */
  spacing?: number
  /** Stripe thickness in px. Default 1. */
  thickness?: number
  /** Stripe color. Defaults to a soft white token. */
  color?: string
  /** Layer opacity. Default 0.55 — restrained. */
  opacity?: number
  /** When true the fill is `position: absolute; inset: 0` for layering. */
  absolute?: boolean
  className?: string
  style?: CSSProperties
}

/**
 * Diagonal hatch stripe area — pure CSS `repeating-linear-gradient`.
 * Use as a decorative tile/badge fill, never under long body text.
 *
 *   <HatchFill /> // basic 45° forward slashes
 *   <HatchFill angle={-45} spacing={5} />  // backward
 *   <HatchFill absolute style={{ width: 80, height: 28 }} />
 */
export function HatchFill({
  angle = 45,
  spacing = 7,
  thickness = 1,
  color = 'var(--hud-line-soft)',
  opacity = 0.55,
  absolute = false,
  className,
  style,
}: Props) {
  return (
    <div
      aria-hidden
      className={className}
      style={{
        position: absolute ? 'absolute' : 'relative',
        inset: absolute ? 0 : undefined,
        opacity,
        backgroundImage: `repeating-linear-gradient(${angle}deg, ${color} 0 ${thickness}px, transparent ${thickness}px ${spacing}px)`,
        pointerEvents: 'none',
        ...style,
      }}
    />
  )
}
