import { useState, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { ChevronUp, X, Trash2 } from 'lucide-react'
import { COMPARE_MAX, useComparePlanets, useStore } from '../../store/useStore'
import { getExoplanetTexture } from '../../utils/textureMap'
import { planetNameToSeed } from '../../utils/planetSeed'
import type { Exoplanet } from '../../data/types'

function miniOrbStyle(planet: Exoplanet): CSSProperties {
  const texture = getExoplanetTexture(planet)
  const seed = planetNameToSeed(planet.pl_name)
  const bgX = Math.floor(seed) % 100
  return {
    borderRadius: '50%',
    backgroundImage: [
      'radial-gradient(circle at 30% 25%, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0) 32%)',
      'radial-gradient(circle at 50% 50%, transparent 52%, rgba(0,0,0,0.7) 100%)',
      `url(${texture})`,
    ].join(', '),
    backgroundSize: 'cover, cover, 220% 180%',
    backgroundPosition: `center, center, ${bgX}% 50%`,
    backgroundRepeat: 'no-repeat, no-repeat, no-repeat',
    boxShadow: 'inset -3px -5px 10px rgba(0,0,0,0.7)',
  }
}

export function CompareTray() {
  const compare = useComparePlanets()
  const removeFromCompare = useStore((s) => s.removeFromCompare)
  const clearCompare = useStore((s) => s.clearCompare)
  const [open, setOpen] = useState(false)

  if (compare.length === 0) return null

  return (
    <div
      className="compare-tray"
      style={{
        position: 'fixed',
        right: 24, bottom: 24,
        zIndex: 60,
        pointerEvents: 'none',
        maxWidth: 'calc(100vw - 32px)',
      }}
    >
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            style={{
              pointerEvents: 'auto',
              marginBottom: 10,
              width: 'min(320px, calc(100vw - 32px))',
              background: 'rgba(0,0,0,0.78)',
              border: '1px solid var(--border-hud)',
              backdropFilter: 'blur(14px) saturate(1.1)',
              WebkitBackdropFilter: 'blur(14px) saturate(1.1)',
              boxShadow: '0 16px 48px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.05)',
            }}
          >
            {/* Header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 14px',
              borderBottom: '1px solid var(--border-hud)',
            }}>
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: 10,
                color: 'var(--text-primary)', letterSpacing: 2, textTransform: 'uppercase',
              }}>
                // Compare · {compare.length}/{COMPARE_MAX}
              </span>
              <button
                onClick={() => clearCompare()}
                title="Clear all"
                aria-label="Clear all from compare"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  padding: '4px 8px',
                  background: 'transparent',
                  border: '1px solid var(--border-hud)',
                  color: 'var(--text-muted)',
                  fontFamily: 'var(--font-mono)', fontSize: 9,
                  letterSpacing: 1.5, textTransform: 'uppercase',
                  cursor: 'pointer',
                  transition: 'all 180ms',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--hud-red)' }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)' }}
              >
                <Trash2 size={11} />
                Clear
              </button>
            </div>

            {/* Chips */}
            <div style={{ display: 'flex', flexDirection: 'column', maxHeight: 280, overflowY: 'auto' }}>
              {compare.map((p) => (
                <div
                  key={p.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '34px 1fr auto',
                    gap: 12,
                    alignItems: 'center',
                    padding: '10px 14px',
                    borderBottom: '1px dashed var(--border-hud)',
                  }}
                >
                  <div style={{ position: 'relative', width: 34, height: 34 }}>
                    <div style={{ position: 'absolute', inset: 2, ...miniOrbStyle(p) }} />
                  </div>
                  <Link
                    to={`/explore/${encodeURIComponent(p.pl_name)}`}
                    onClick={() => setOpen(false)}
                    style={{
                      display: 'flex', flexDirection: 'column', gap: 2,
                      textDecoration: 'none', color: 'inherit',
                      minWidth: 0,
                    }}
                  >
                    <span style={{
                      fontFamily: 'var(--font-hero)', fontSize: 12, fontWeight: 500,
                      color: 'var(--text-primary)',
                      letterSpacing: '0.04em', textTransform: 'uppercase',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {p.pl_name}
                    </span>
                    <span style={{
                      fontFamily: 'var(--font-mono)', fontSize: 9,
                      color: 'var(--text-muted)', letterSpacing: 1,
                    }}>
                      SCORE {p.habitability_score.toFixed(0)}
                      {p.in_habitable_zone && <span style={{ color: 'var(--hud-cyan)' }}> · HZ</span>}
                    </span>
                  </Link>
                  <button
                    onClick={() => removeFromCompare(p.id)}
                    aria-label={`Remove ${p.pl_name}`}
                    title="Remove from compare"
                    style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      width: 22, height: 22,
                      background: 'transparent',
                      border: '1px solid var(--border-hud)',
                      color: 'var(--text-dim)',
                      cursor: 'pointer',
                      transition: 'all 180ms',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--hud-red)'
                      e.currentTarget.style.color = 'var(--hud-red)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border-hud)'
                      e.currentTarget.style.color = 'var(--text-dim)'
                    }}
                  >
                    <X size={11} />
                  </button>
                </div>
              ))}
            </div>

            {/* Footer CTA */}
            <Link
              to="/compare"
              onClick={() => setOpen(false)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                padding: '14px',
                background: 'var(--hud-cyan)',
                color: 'var(--bg-void)',
                fontFamily: 'var(--font-mono)', fontSize: 11,
                fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase',
                textDecoration: 'none',
              }}
            >
              Open Compare →
            </Link>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Collapsed pill — always visible when count ≥ 1 */}
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          pointerEvents: 'auto',
          display: 'inline-flex', alignItems: 'center', gap: 10,
          padding: '12px 18px',
          background: 'rgba(0,0,0,0.78)',
          border: '1px solid var(--hud-cyan)',
          backdropFilter: 'blur(14px) saturate(1.1)',
          WebkitBackdropFilter: 'blur(14px) saturate(1.1)',
          color: 'var(--text-primary)',
          fontFamily: 'var(--font-mono)', fontSize: 11,
          letterSpacing: 1.8, textTransform: 'uppercase',
          cursor: 'pointer',
          boxShadow: '0 12px 32px rgba(0,0,0,0.45), 0 0 24px rgba(34,211,238,0.18)',
        }}
      >
        <span style={{
          width: 7, height: 7, borderRadius: '50%',
          background: 'var(--hud-cyan)',
          boxShadow: '0 0 6px var(--hud-cyan)',
        }} />
        <span>
          <span style={{ color: 'var(--hud-cyan)' }}>{compare.length}</span>
          <span style={{ color: 'var(--text-muted)' }}>/{COMPARE_MAX}</span>
          {' '}in Compare
        </span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.22 }}
          style={{ display: 'inline-flex' }}
        >
          <ChevronUp size={13} />
        </motion.span>
      </button>
    </div>
  )
}
