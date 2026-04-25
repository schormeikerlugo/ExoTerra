import type { CSSProperties, ReactNode } from 'react'
import { CornerBrackets } from './CornerBrackets'

interface Props {
  children: ReactNode
  title?: string
  id?: string
  status?: 'live' | 'idle' | 'warn'
  style?: CSSProperties
  padding?: number | string
  showBrackets?: boolean
  compact?: boolean
}

const STATUS: Record<NonNullable<Props['status']>, { color: string; label: string }> = {
  live: { color: 'var(--hud-green)', label: 'LIVE' },
  idle: { color: 'var(--text-dim)', label: 'IDLE' },
  warn: { color: 'var(--hud-amber)', label: 'WARN' },
}

export function HUDPanel({
  children,
  title,
  id,
  status,
  style,
  padding = 20,
  showBrackets = true,
  compact = false,
}: Props) {
  const statusInfo = status ? STATUS[status] : null
  return (
    <div
      className="hud-glass"
      style={{
        position: 'relative',
        border: '1px solid var(--border-hud)',
        padding,
        ...style,
      }}
    >
      {showBrackets && <CornerBrackets size={10} inset={-1} color="var(--hud-line)" thickness={1} />}
      {(title || id || statusInfo) && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            marginBottom: compact ? 10 : 16,
            paddingBottom: compact ? 8 : 10,
            borderBottom: '1px solid var(--border-hud)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {id && (
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-dim)', letterSpacing: 2 }}>
                // {id}
              </span>
            )}
            {title && (
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-primary)', letterSpacing: 2, textTransform: 'uppercase', fontWeight: 500 }}>
                {title}
              </span>
            )}
          </div>
          {statusInfo && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: statusInfo.color,
                  boxShadow: `0 0 8px ${statusInfo.color}`,
                  animation: status === 'live' ? 'hud-pulse 1.6s ease-in-out infinite' : undefined,
                }}
              />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: 2, color: statusInfo.color }}>
                {statusInfo.label}
              </span>
            </div>
          )}
        </div>
      )}
      {children}
    </div>
  )
}
