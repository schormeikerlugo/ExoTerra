import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { CornerBrackets } from './CornerBrackets'
import { Barcode } from './Barcode'

type Variant = 'loading' | 'error' | 'not-found'

interface StateScreenProps {
  variant: Variant
  code?: string
  title: string
  message?: ReactNode
  detail?: string
  primaryAction?: { label: string; to?: string; onClick?: () => void }
  secondaryAction?: { label: string; to?: string; onClick?: () => void }
}

const VARIANT_META: Record<Variant, { eyebrow: string; status: string; statusColor: string; led: string }> = {
  loading:    { eyebrow: 'BOOT_SEQ',  status: 'STREAMING', statusColor: 'var(--hud-cyan)',  led: 'var(--hud-cyan)'  },
  error:      { eyebrow: 'ERR_500',   status: 'FAULT',     statusColor: 'var(--hud-red)',   led: 'var(--hud-red)'   },
  'not-found':{ eyebrow: 'ERR_404',   status: 'NO SIGNAL', statusColor: 'var(--hud-amber)', led: 'var(--hud-amber)' },
}

export function StateScreen({ variant, code, title, message, detail, primaryAction, secondaryAction }: StateScreenProps) {
  const meta = VARIANT_META[variant]
  const eyebrow = code ?? meta.eyebrow

  return (
    <div style={{ minHeight: '100vh', paddingTop: 56, position: 'relative' }}>
      <section style={{ padding: 'clamp(80px, 14vh, 160px) var(--gutter) 60px', position: 'relative' }}>
        <div style={{ maxWidth: 'var(--max-w)', margin: '0 auto' }}>
          {/* Top strip */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 14,
            paddingBottom: 24,
            borderBottom: '1px solid var(--border-hud)',
            marginBottom: 36,
            flexWrap: 'wrap', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: 11,
                color: meta.statusColor, letterSpacing: 3,
              }}>
                {eyebrow}
              </span>
              <span style={{ width: 32, height: 1, background: meta.statusColor, opacity: 0.6 }} />
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: 11,
                color: 'var(--text-muted)', letterSpacing: 2.5, textTransform: 'uppercase',
              }}>
                Mission Control
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginLeft: 8 }}>
                <span style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: meta.led,
                  boxShadow: `0 0 6px ${meta.led}`,
                  animation: variant === 'loading' ? 'hud-pulse 1.2s ease-in-out infinite' : 'hud-pulse 2s ease-in-out infinite',
                }} />
                <span style={{
                  fontFamily: 'var(--font-mono)', fontSize: 9,
                  color: meta.statusColor, letterSpacing: 2,
                }}>
                  {meta.status}
                </span>
              </span>
            </div>
            <Barcode seed={`state-${variant}-${title.length}`} bars={40} height={18} />
          </div>

          {/* Content panel */}
          <div className="hud-glass" style={{
            position: 'relative',
            border: '1px solid var(--border-hud)',
            padding: 'clamp(28px, 5vw, 56px) clamp(24px, 5vw, 56px)',
          }}>
            <CornerBrackets size={10} inset={-1} color={meta.statusColor} thickness={1} />

            {/* Animated indicator */}
            {variant === 'loading' ? (
              <LoadingRig />
            ) : (
              <FaultRig color={meta.statusColor} />
            )}

            <h1 style={{
              fontFamily: 'var(--font-astra)',
              fontSize: 'clamp(36px, 6vw, 84px)',
              fontWeight: 600,
              lineHeight: 0.96,
              letterSpacing: '0.01em',
              color: 'var(--text-primary)',
              margin: '32px 0 0',
            }}>
              {title}
            </h1>

            {message && (
              <p style={{
                fontFamily: 'var(--font-body)', fontSize: 16, lineHeight: 1.7,
                color: 'var(--text-muted)',
                margin: '20px 0 0', maxWidth: '64ch',
              }}>
                {message}
              </p>
            )}

            {detail && (
              <pre style={{
                fontFamily: 'var(--font-mono)', fontSize: 11,
                color: 'var(--text-dim)', letterSpacing: 0.5,
                margin: '24px 0 0', padding: '12px 16px',
                border: '1px dashed var(--border-hud)',
                background: 'rgba(0,0,0,0.32)',
                whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                overflowX: 'auto',
              }}>
                {detail}
              </pre>
            )}

            {(primaryAction || secondaryAction) && (
              <div style={{
                display: 'flex', flexWrap: 'wrap', gap: 12,
                marginTop: 32,
              }}>
                {primaryAction && <ActionButton variant="primary" {...primaryAction} />}
                {secondaryAction && <ActionButton variant="secondary" {...secondaryAction} />}
              </div>
            )}
          </div>

          {/* Bottom telemetry strip */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginTop: 18, flexWrap: 'wrap', gap: 12,
            fontFamily: 'var(--font-mono)', fontSize: 9,
            color: 'var(--text-dim)', letterSpacing: 2, textTransform: 'uppercase',
          }}>
            <span>// state · {variant.replace('-', '_')}</span>
            <span>uplink · ground control</span>
          </div>
        </div>
      </section>
    </div>
  )
}

function ActionButton({ label, to, onClick, variant }: {
  label: string
  to?: string
  onClick?: () => void
  variant: 'primary' | 'secondary'
}) {
  const style = variant === 'primary'
    ? {
        background: 'var(--hud-cyan)',
        color: 'var(--bg-void)',
        border: '1px solid var(--hud-cyan)',
      }
    : {
        background: 'transparent',
        color: 'var(--text-primary)',
        border: '1px solid var(--border-hud-strong)',
      }

  const inner = (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 10,
      padding: '12px 22px',
      fontFamily: 'var(--font-mono)', fontSize: 11,
      letterSpacing: 2, textTransform: 'uppercase',
      cursor: 'pointer',
      transition: 'all 200ms',
      ...style,
    }}>
      {label}
    </span>
  )

  if (to) {
    return <Link to={to} style={{ textDecoration: 'none' }}>{inner}</Link>
  }
  return (
    <button
      onClick={onClick}
      style={{ background: 'transparent', border: 'none', padding: 0, cursor: 'pointer' }}
    >
      {inner}
    </button>
  )
}

function LoadingRig() {
  return (
    <div style={{
      position: 'relative', width: 'clamp(120px, 18vw, 168px)', height: 'clamp(120px, 18vw, 168px)',
    }}>
      <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
        <defs>
          <linearGradient id="state-arc" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--hud-cyan)" stopOpacity="0" />
            <stop offset="100%" stopColor="var(--hud-cyan)" stopOpacity="1" />
          </linearGradient>
        </defs>

        {/* Outer ring — rotating arc */}
        <g style={{ transformOrigin: '50px 50px', animation: 'state-spin 2.4s linear infinite' }}>
          <circle cx="50" cy="50" r="44" fill="none" stroke="var(--border-hud-strong)" strokeWidth="0.7" />
          <path
            d="M 50 6 A 44 44 0 0 1 94 50"
            fill="none"
            stroke="url(#state-arc)"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
          <circle cx="94" cy="50" r="2" fill="var(--hud-cyan)" style={{ filter: 'drop-shadow(0 0 4px var(--hud-cyan))' }} />
        </g>

        {/* Counter-rotating inner */}
        <g style={{ transformOrigin: '50px 50px', animation: 'state-spin 3.6s linear infinite reverse' }}>
          <circle cx="50" cy="50" r="32" fill="none" stroke="var(--border-hud)" strokeWidth="0.5" strokeDasharray="2 4" />
          <circle cx="82" cy="50" r="1.6" fill="var(--text-muted)" />
        </g>

        {/* Crosshair */}
        <line x1="50" y1="40" x2="50" y2="46" stroke="var(--text-dim)" strokeWidth="0.5" />
        <line x1="50" y1="54" x2="50" y2="60" stroke="var(--text-dim)" strokeWidth="0.5" />
        <line x1="40" y1="50" x2="46" y2="50" stroke="var(--text-dim)" strokeWidth="0.5" />
        <line x1="54" y1="50" x2="60" y2="50" stroke="var(--text-dim)" strokeWidth="0.5" />
        <circle cx="50" cy="50" r="1.4" fill="var(--hud-cyan)" style={{ filter: 'drop-shadow(0 0 3px var(--hud-cyan))' }} />
      </svg>

      <style>{`
        @keyframes state-spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}

function FaultRig({ color }: { color: string }) {
  return (
    <div style={{
      position: 'relative', width: 'clamp(120px, 18vw, 168px)', height: 'clamp(120px, 18vw, 168px)',
    }}>
      <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
        {/* Static rings */}
        <circle cx="50" cy="50" r="44" fill="none" stroke={color} strokeWidth="0.7" strokeDasharray="3 3" opacity="0.5" />
        <circle cx="50" cy="50" r="32" fill="none" stroke="var(--border-hud-strong)" strokeWidth="0.5" />

        {/* Fault triangle */}
        <g style={{ transformOrigin: '50px 50px', animation: 'fault-pulse 1.6s ease-in-out infinite' }}>
          <polygon
            points="50,28 70,62 30,62"
            fill="none"
            stroke={color}
            strokeWidth="1.6"
            strokeLinejoin="round"
            style={{ filter: `drop-shadow(0 0 6px ${color})` }}
          />
          <line x1="50" y1="40" x2="50" y2="52" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
          <circle cx="50" cy="58" r="1.4" fill={color} />
        </g>

        {/* Corner ticks */}
        {[[8, 8], [92, 8], [8, 92], [92, 92]].map(([x, y]) => (
          <g key={`${x}-${y}`}>
            <line x1={x} y1={y} x2={x === 8 ? 14 : 86} y2={y} stroke={color} strokeWidth="0.7" />
            <line x1={x} y1={y} x2={x} y2={y === 8 ? 14 : 86} stroke={color} strokeWidth="0.7" />
          </g>
        ))}
      </svg>

      <style>{`
        @keyframes fault-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  )
}
