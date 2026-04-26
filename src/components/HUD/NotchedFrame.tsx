import { useEffect, useRef, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'

type Variant = 'corner-clipped' | 'hex-edge' | 'bracket-notched' | 'split-rail'

interface Props {
  variant?: Variant
  /** Notch size in px. Auto-clamped so it never exceeds 1/4 of the smaller side. */
  notchSize?: number
  stroke?: string
  strokeWidth?: number
  fill?: string
  /** Optional inner padding so children don't touch the notched edges. */
  padding?: number | string
  children?: ReactNode
  className?: string
  style?: CSSProperties
}

function computePath(variant: Variant, w: number, h: number, nRaw: number): string {
  if (w <= 0 || h <= 0) return ''
  const n = Math.min(nRaw, Math.min(w, h) / 4)
  switch (variant) {
    case 'corner-clipped':
      // Octagon: rectangle with all 4 corners chamfered.
      return `M ${n} 0 L ${w - n} 0 L ${w} ${n} L ${w} ${h - n} L ${w - n} ${h} L ${n} ${h} L 0 ${h - n} L 0 ${n} Z`
    case 'hex-edge':
      // Only top/bottom corners chamfered — sides remain straight.
      return `M 0 ${n} L ${n} 0 L ${w - n} 0 L ${w} ${n} L ${w} ${h - n} L ${w - n} ${h} L ${n} ${h} L 0 ${h - n} Z`
    case 'bracket-notched': {
      // Tiny inner steps at each corner — looks like printed instrument plates.
      const t = Math.min(n, Math.min(w, h) * 0.18)
      return `M 0 ${t} L ${t} ${t} L ${t} 0 L ${w - t} 0 L ${w - t} ${t} L ${w} ${t} L ${w} ${h - t} L ${w - t} ${h - t} L ${w - t} ${h} L ${t} ${h} L ${t} ${h - t} L 0 ${h - t} Z`
    }
    case 'split-rail': {
      // Standard rectangle but with a tiny notch cut from the top-right corner
      // and a matching tab on the bottom-left — Aurora-style asymmetric.
      const t = Math.min(n, Math.min(w, h) * 0.16)
      return `M 0 0 L ${w - t * 2} 0 L ${w - t * 2} ${t} L ${w} ${t} L ${w} ${h} L ${t * 2} ${h} L ${t * 2} ${h - t} L 0 ${h - t} Z`
    }
  }
}

/**
 * Decorative frame whose outline is non-rectangular. Renders an absolute SVG
 * overlay (pointer-events: none) so children can be any normal markup.
 *
 * Uses ResizeObserver to keep the path crisp as the container resizes.
 *
 *   <NotchedFrame variant="corner-clipped" padding={16}>
 *     <h3>SCAN COMPLETE</h3>
 *   </NotchedFrame>
 */
export function NotchedFrame({
  variant = 'corner-clipped',
  notchSize = 10,
  stroke = 'var(--hud-line)',
  strokeWidth = 1,
  fill = 'transparent',
  padding,
  children,
  className,
  style,
}: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ w: 0, h: 0 })

  useEffect(() => {
    if (!ref.current) return
    const el = ref.current
    const update = () => {
      const r = el.getBoundingClientRect()
      setSize({ w: r.width, h: r.height })
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const d = computePath(variant, size.w, size.h, notchSize)

  return (
    <div
      ref={ref}
      className={className}
      style={{
        position: 'relative',
        padding,
        ...style,
      }}
    >
      {size.w > 0 && (
        <svg
          aria-hidden
          width={size.w}
          height={size.h}
          viewBox={`0 0 ${size.w} ${size.h}`}
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            overflow: 'visible',
          }}
        >
          <path
            d={d}
            stroke={stroke}
            strokeWidth={strokeWidth}
            fill={fill}
            vectorEffect="non-scaling-stroke"
            strokeLinejoin="miter"
          />
        </svg>
      )}
      {children}
    </div>
  )
}
