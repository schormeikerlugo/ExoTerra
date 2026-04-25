import { useParams } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useStore } from '../store/useStore'
import { PlanetScene } from '../components/Scene/PlanetScene'
import { FilterPanel } from '../components/Controls/FilterPanel'
import { PlanetList } from '../components/Controls/PlanetList'
import { PlanetHUD } from '../components/HUD/PlanetHUD'
import { CornerBrackets } from '../components/HUD/CornerBrackets'

export function ExplorerPage() {
  const { name } = useParams<{ name: string }>()
  const planets = useStore((s) => s.planets)
  const selectedPlanet = useStore((s) => s.selectedPlanet)
  const setSelectedPlanet = useStore((s) => s.setSelectedPlanet)
  const isLoading = useStore((s) => s.isLoading)

  const [leftOpen, setLeftOpen] = useState(true)
  const [rightOpen, setRightOpen] = useState(true)

  const planet = useMemo(
    () => (name ? planets.find((p) => p.pl_name === decodeURIComponent(name)) : null),
    [planets, name],
  )

  useEffect(() => {
    if (planet) setSelectedPlanet(planet)
  }, [planet, setSelectedPlanet])

  return (
    <div style={{
      position: 'relative',
      height: '100vh',
      background: '#000',
      color: 'var(--text-primary)',
      overflow: 'hidden',
    }}>
      {/* ── 3D scene as full-viewport base ── */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <PlanetScene />
      </div>

      {/* ── Outer frame brackets ── */}
      <div style={{
        position: 'absolute', inset: 12, zIndex: 5,
        pointerEvents: 'none',
      }}>
        <CornerBrackets size={18} thickness={1} color="var(--hud-line)" />
      </div>

      {/* ── Center crosshair reticle ── */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 3, pointerEvents: 'none',
        width: 220, height: 220,
      }}>
        <svg viewBox="-110 -110 220 220" width="100%" height="100%" aria-hidden>
          <circle cx="0" cy="0" r="90" fill="none"
            stroke="var(--border-hud)" strokeWidth="0.5" strokeDasharray="3 4" />
          {[0, 90, 180, 270].map((a) => (
            <g key={a} transform={`rotate(${a})`}>
              <line x1="82" y1="0" x2="100" y2="0" stroke="var(--hud-line)" strokeWidth="0.8" />
              <line x1="100" y1="-2" x2="100" y2="2" stroke="var(--hud-line)" strokeWidth="0.8" />
            </g>
          ))}
        </svg>
      </div>

      {/* ── LEFT RAIL: filters + planet list ── */}
      <aside
        className="hud-glass"
        style={{
          position: 'absolute',
          left: 24, top: 80, bottom: 56,
          width: 340,
          zIndex: 4,
          border: '1px solid var(--border-hud)',
          display: 'flex', flexDirection: 'column',
          transform: leftOpen ? 'translateX(0)' : 'translateX(calc(-100% - 24px))',
          transition: 'transform 380ms cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
        <CornerBrackets size={8} inset={-1} color="var(--hud-line)" thickness={1} />

        {/* Header */}
        <div style={{
          padding: '14px 16px',
          borderBottom: '1px solid var(--border-hud)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 10,
            color: 'var(--text-primary)', letterSpacing: 2, textTransform: 'uppercase',
          }}>
            // NAV · QUERY
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span style={{
              width: 6, height: 6, borderRadius: '50%',
              background: 'var(--hud-green)',
              boxShadow: '0 0 6px var(--hud-green)',
              animation: 'hud-pulse 1.8s ease-in-out infinite',
            }} />
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: 9,
              color: 'var(--hud-green)', letterSpacing: 2,
            }}>
              LIVE
            </span>
          </span>
        </div>

        {/* Filter panel */}
        <div style={{ borderBottom: '1px solid var(--border-hud)', flexShrink: 0 }}>
          <FilterPanel />
        </div>

        {/* List */}
        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
          {isLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
              <div style={{
                width: 24, height: 24,
                border: '2px solid var(--border-hud)',
                borderTop: '2px solid var(--hud-cyan)',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
              }} />
            </div>
          ) : (
            <PlanetList />
          )}
        </div>
      </aside>

      {/* Left collapse toggle */}
      <button
        onClick={() => setLeftOpen(!leftOpen)}
        aria-label={leftOpen ? 'Collapse filters' : 'Expand filters'}
        className="explorer-toggle"
        style={{
          position: 'absolute',
          left: leftOpen ? 370 : 24,
          top: '50%', transform: 'translateY(-50%)',
          zIndex: 5,
          width: 24, height: 52,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          border: '1px solid var(--border-hud)',
          color: 'var(--text-primary)',
          cursor: 'pointer',
          transition: 'left 380ms cubic-bezier(0.22, 1, 0.36, 1), border-color 200ms',
        }}
      >
        {leftOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
      </button>

      {/* ── RIGHT RAIL: selected planet HUD ── */}
      <aside
        className="hud-glass"
        style={{
          position: 'absolute',
          right: 24, top: 80, bottom: 56,
          width: 360,
          zIndex: 4,
          border: '1px solid var(--border-hud)',
          overflowY: 'auto',
          transform: rightOpen ? 'translateX(0)' : 'translateX(calc(100% + 24px))',
          transition: 'transform 380ms cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
        <CornerBrackets size={8} inset={-1} color="var(--hud-line)" thickness={1} />
        <PlanetHUD />
      </aside>

      {/* Right collapse toggle */}
      <button
        onClick={() => setRightOpen(!rightOpen)}
        aria-label={rightOpen ? 'Collapse telemetry' : 'Expand telemetry'}
        className="explorer-toggle"
        style={{
          position: 'absolute',
          right: rightOpen ? 390 : 24,
          top: '50%', transform: 'translateY(-50%)',
          zIndex: 5,
          width: 24, height: 52,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          border: '1px solid var(--border-hud)',
          color: 'var(--text-primary)',
          cursor: 'pointer',
          transition: 'right 380ms cubic-bezier(0.22, 1, 0.36, 1), border-color 200ms',
        }}
      >
        {rightOpen ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      {/* ── TOP STATUS BAR ── */}
      <div style={{
        position: 'absolute',
        top: 80, left: '50%', transform: 'translateX(-50%)',
        zIndex: 4,
        padding: '10px 18px',
        display: 'flex', alignItems: 'center', gap: 16,
        border: '1px solid var(--border-hud)',
        fontFamily: 'var(--font-mono)', fontSize: 10,
        letterSpacing: 2, textTransform: 'uppercase',
        color: 'var(--text-muted)',
        background: 'rgba(0,0,0,0.45)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
      }}>
        <span style={{ color: 'var(--text-primary)' }}>NAVIGATOR</span>
        <span style={{ width: 1, height: 12, background: 'var(--border-hud)' }} />
        <span>
          TARGET · <span style={{ color: 'var(--text-primary)' }}>
            {selectedPlanet?.pl_name ?? '—'}
          </span>
        </span>
        {selectedPlanet && (
          <>
            <span style={{ width: 1, height: 12, background: 'var(--border-hud)' }} />
            <span>
              CLASS · <span style={{ color: 'var(--text-primary)' }}>
                {selectedPlanet.planet_type.replace('_', ' ').toUpperCase()}
              </span>
            </span>
          </>
        )}
      </div>

      {/* ── BOTTOM TELEMETRY STRIP ── */}
      {selectedPlanet && (
        <div style={{
          position: 'absolute',
          bottom: 20, left: '50%', transform: 'translateX(-50%)',
          zIndex: 4,
          display: 'flex', gap: 0,
          border: '1px solid var(--border-hud)',
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          fontFamily: 'var(--font-mono)', fontSize: 10,
          letterSpacing: 1.5, textTransform: 'uppercase',
        }}>
          {[
            { label: 'RADIUS', value: selectedPlanet.pl_rade !== null ? selectedPlanet.pl_rade.toFixed(2) : '—', unit: 'R⊕' },
            { label: 'MASS',   value: selectedPlanet.pl_masse !== null ? selectedPlanet.pl_masse.toFixed(1) : '—', unit: 'M⊕' },
            { label: 'TEMP',   value: selectedPlanet.pl_eqt !== null ? selectedPlanet.pl_eqt.toFixed(0) : '—', unit: 'K' },
            { label: 'DIST',   value: selectedPlanet.sy_dist !== null ? selectedPlanet.sy_dist.toFixed(1) : '—', unit: 'PC' },
            { label: 'SCORE',  value: selectedPlanet.habitability_score.toFixed(0), unit: '/100' },
          ].map((t, i, arr) => (
            <div key={t.label} style={{
              padding: '10px 18px',
              borderRight: i < arr.length - 1 ? '1px solid var(--border-hud)' : 'none',
              display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'center',
            }}>
              <span style={{ color: 'var(--text-dim)', fontSize: 9 }}>{t.label}</span>
              <span style={{ color: 'var(--text-primary)', fontSize: 13 }}>
                {t.value}
                <span style={{ marginLeft: 3, fontSize: 9, color: 'var(--text-dim)' }}>{t.unit}</span>
              </span>
            </div>
          ))}
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .explorer-toggle:hover { border-color: var(--border-hud-strong) !important; color: var(--hud-cyan) !important; }
      `}</style>
    </div>
  )
}
