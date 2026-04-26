import type { CSSProperties } from 'react'

type Align = 'left' | 'center' | 'right'

interface Props {
  label: string
  align?: Align
  /** Optional code on the opposite side of the label, mono-dim. */
  code?: string
  /** Color of the connector lines. */
  lineColor?: string
  /** Color of the label text. */
  labelColor?: string
  className?: string
  style?: CSSProperties
}

/**
 * Thin horizontal section divider with an inline label.
 *
 *   align="left"   → ── LABEL ────────────────
 *   align="center" → ────── LABEL ──────────
 *   align="right"  → ──────────────── LABEL ──
 *
 * Pairs with a `code` to render `── COLUMN 01 ──── 0xA8F2 ─` style printer
 * dividers (Manifold/Antechamber reference).
 */
export function MicroSection({
  label,
  align = 'left',
  code,
  lineColor = 'var(--border-hud)',
  labelColor = 'var(--text-muted)',
  className,
  style,
}: Props) {
  const Line = (
    <span
      aria-hidden
      style={{
        flex: 1,
        height: 1,
        background: lineColor,
      }}
    />
  )

  const Label = (
    <span
      style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 10,
        color: labelColor,
        letterSpacing: 2,
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  )

  const Code = code ? (
    <span
      style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 9,
        color: 'var(--text-dim)',
        letterSpacing: 1.5,
        whiteSpace: 'nowrap',
      }}
    >
      {code}
    </span>
  ) : null

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        ...style,
      }}
    >
      {align !== 'left' && Line}
      {Label}
      {Line}
      {Code && <>{Code}{align === 'right' ? null : Line}</>}
      {!Code && align === 'right' && null}
    </div>
  )
}
