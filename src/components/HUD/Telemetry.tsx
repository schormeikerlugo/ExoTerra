import type { CSSProperties } from 'react'

interface TelemetryRowProps {
  label: string
  value: string | number
  unit?: string
  status?: 'ok' | 'warn' | 'crit' | 'muted'
  align?: 'left' | 'right'
}

const STATUS_COLORS: Record<NonNullable<TelemetryRowProps['status']>, string> = {
  ok: 'var(--text-primary)',
  warn: 'var(--hud-amber)',
  crit: 'var(--hud-red)',
  muted: 'var(--text-muted)',
}

export function TelemetryRow({ label, value, unit, status = 'ok', align = 'left' }: TelemetryRowProps) {
  const valueColor = STATUS_COLORS[status]
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        alignItems: align === 'right' ? 'flex-end' : 'flex-start',
        textAlign: align,
      }}
    >
      <span className="hud-label">{label}</span>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 500, color: valueColor, letterSpacing: '0.5px' }}>
        {value}
        {unit && <span style={{ marginLeft: 4, fontSize: 10, color: 'var(--text-dim)' }}>{unit}</span>}
      </span>
    </div>
  )
}

interface TelemetryLineProps {
  items: { label: string; value: string }[]
  separator?: string
  style?: CSSProperties
}

export function TelemetryLine({ items, separator = '  //  ', style }: TelemetryLineProps) {
  return (
    <div
      style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 10,
        letterSpacing: '1.5px',
        textTransform: 'uppercase',
        color: 'var(--hud-line-dim)',
        display: 'flex',
        gap: 6,
        flexWrap: 'wrap',
        ...style,
      }}
    >
      {items.map((item, i) => (
        <span key={item.label}>
          <span style={{ color: 'var(--text-dim)' }}>{item.label} · </span>
          <span style={{ color: 'var(--text-primary)' }}>{item.value}</span>
          {i < items.length - 1 && <span style={{ color: 'var(--border-hud)', marginLeft: 6 }}>{separator}</span>}
        </span>
      ))}
    </div>
  )
}
