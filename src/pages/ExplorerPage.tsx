import { useParams } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react'
import { useStore } from '../store/useStore'
import { PlanetScene } from '../components/Scene/PlanetScene'
import { FilterPanel } from '../components/Controls/FilterPanel'
import { PlanetList } from '../components/Controls/PlanetList'
import { PlanetHUD } from '../components/HUD/PlanetHUD'
import { CornerBrackets } from '../components/HUD/CornerBrackets'
import { PageMeta } from '../components/seo/PageMeta'

// Mobile breakpoint for the cockpit — both rails default to closed below this
// width so the 3D scene gets the whole viewport on phones, and rails open as
// full-screen overlays on demand.
const MOBILE_BREAKPOINT_PX = 860

function isMobileViewport(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT_PX}px)`).matches
}

export function ExplorerPage() {
  const { name } = useParams<{ name: string }>()
  const planets = useStore((s) => s.planets)
  const selectedPlanet = useStore((s) => s.selectedPlanet)
  const setSelectedPlanet = useStore((s) => s.setSelectedPlanet)
  const isLoading = useStore((s) => s.isLoading)

  // Default closed on mobile, open on desktop. Lazy initializer so it
  // runs once at mount and doesn't fight subsequent user toggles.
  const [leftOpen, setLeftOpen] = useState(() => !isMobileViewport())
  const [rightOpen, setRightOpen] = useState(() => !isMobileViewport())
  const [isMobile, setIsMobile] = useState(() => isMobileViewport())

  // Track viewport class so rails can bump z-index when open on mobile.
  // Doesn't auto-toggle the panels (would feel disorienting); just exposes
  // the state for layering rules.
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT_PX}px)`)
    const onChange = () => setIsMobile(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  // When a rail opens on mobile, lock body scroll so a long planet list
  // doesn't bleed into the page scroll.
  useEffect(() => {
    if (!isMobile) return
    const open = leftOpen || rightOpen
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [isMobile, leftOpen, rightOpen])

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
      <PageMeta
        title={selectedPlanet ? `${selectedPlanet.pl_name} · Cockpit` : 'Cockpit'}
        description="Full-screen interactive 3D cockpit. Scan exoplanets, filter by class and detection method, and inspect telemetry in real time."
      />
      {/* ── 3D scene as full-viewport base ── */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <PlanetScene />
      </div>

      {/* ── Outer frame brackets — top edge sits below the 56px navbar ── */}
      <div style={{
        position: 'absolute',
        top: 68, right: 12, bottom: 12, left: 12,
        zIndex: 5,
        pointerEvents: 'none',
      }}>
        <CornerBrackets size={18} thickness={1} color="var(--hud-line)" />
      </div>

      {/* ── Center crosshair reticle (only when locked on a target) ── */}
      {selectedPlanet && (
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
      )}

      {/* ── Empty state (no target locked) ── */}
      {!selectedPlanet && !isLoading && (
        <div
          className="hud-glass explorer-empty"
          style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 3,
            width: 'min(440px, calc(100vw - 64px))',
            border: '1px solid var(--border-hud)',
            padding: '32px 36px 30px',
            pointerEvents: 'none',
          }}
        >
          <CornerBrackets size={10} inset={-1} color="var(--hud-amber)" thickness={1} />

          {/* Status header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            paddingBottom: 16, marginBottom: 18,
            borderBottom: '1px solid var(--border-hud)',
          }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                width: 7, height: 7, borderRadius: '50%',
                background: 'var(--hud-amber)',
                boxShadow: '0 0 6px rgba(255,181,71,0.5)',
                animation: 'hud-pulse 1.6s ease-in-out infinite',
              }} />
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: 10,
                color: 'var(--hud-amber)', letterSpacing: 2.5,
                textTransform: 'uppercase', fontWeight: 600,
              }}>
                Standby
              </span>
            </span>
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: 9,
              color: 'var(--text-dim)', letterSpacing: 2,
              textTransform: 'uppercase',
            }}>
              No target locked
            </span>
          </div>

          {/* Title */}
          <h2 style={{
            fontFamily: 'var(--font-astra)',
            fontSize: 'clamp(24px, 3vw, 32px)',
            fontWeight: 600,
            lineHeight: 1.05,
            color: 'var(--text-primary)',
            margin: 0,
          }}>
            Awaiting target.
          </h2>

          {/* Body copy */}
          <p style={{
            fontFamily: 'var(--font-body)', fontSize: 14, lineHeight: 1.6,
            color: 'var(--text-muted)',
            margin: '14px 0 22px',
          }}>
            Select a planet from the <span style={{ color: 'var(--hud-cyan)' }}>Navigator</span> on the
            left to begin a scan. The 3D model, telemetry strip, and HUD readouts will populate automatically.
          </p>

          {/* Arrow pointing to navigator */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            paddingTop: 14,
            borderTop: '1px dashed var(--border-hud)',
            fontFamily: 'var(--font-mono)', fontSize: 10,
            color: 'var(--hud-cyan)', letterSpacing: 2,
            textTransform: 'uppercase',
          }}>
            <ArrowLeft
              size={14}
              strokeWidth={2}
              style={{ animation: 'cockpit-empty-nudge 1.6s ease-in-out infinite' }}
            />
            <span>Pick from Navigator</span>
            <span style={{ flex: 1, height: 1, background: 'var(--border-hud)' }} />
            <span style={{ color: 'var(--text-dim)' }}>{planets.length} indexed</span>
          </div>
        </div>
      )}

      {/* ── LEFT RAIL: filters + planet list ── */}
      <aside
        className="hud-glass explorer-rail explorer-rail--left"
        data-open={leftOpen}
        style={{
          position: 'absolute',
          left: 24, top: 80, bottom: 56,
          width: 340,
          zIndex: isMobile && leftOpen ? 12 : 4,
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
        onClick={() => {
          // On mobile, opening one rail closes the other so they can't
          // stack and confuse the user.
          if (isMobile && !leftOpen) setRightOpen(false)
          setLeftOpen(!leftOpen)
        }}
        aria-label={leftOpen ? 'Collapse filters' : 'Expand filters'}
        className="explorer-toggle explorer-toggle--left"
        data-open={leftOpen}
        style={{
          position: 'absolute',
          left: leftOpen ? 370 : 24,
          top: '50%', transform: 'translateY(-50%)',
          zIndex: isMobile && leftOpen ? 13 : 5,
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
        className="hud-glass explorer-rail explorer-rail--right"
        data-open={rightOpen}
        style={{
          position: 'absolute',
          right: 24, top: 80, bottom: 56,
          width: 360,
          zIndex: isMobile && rightOpen ? 12 : 4,
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
        onClick={() => {
          if (isMobile && !rightOpen) setLeftOpen(false)
          setRightOpen(!rightOpen)
        }}
        aria-label={rightOpen ? 'Collapse telemetry' : 'Expand telemetry'}
        className="explorer-toggle explorer-toggle--right"
        data-open={rightOpen}
        style={{
          position: 'absolute',
          right: rightOpen ? 390 : 24,
          top: '50%', transform: 'translateY(-50%)',
          zIndex: isMobile && rightOpen ? 13 : 5,
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
        @keyframes cockpit-empty-nudge {
          0%, 100% { transform: translateX(0); }
          50%      { transform: translateX(-4px); }
        }
        .explorer-toggle:hover { border-color: var(--border-hud-strong) !important; color: var(--hud-cyan) !important; }

        @media (prefers-reduced-motion: reduce) {
          .explorer-empty svg { animation: none !important; }
        }

        /* ── Mobile: rails become full-screen overlays ── */
        @media (max-width: 860px) {
          /* Rail expands to cover the visible viewport (below navbar) when open;
             when closed it slides off-screen as before. Width is constrained
             so we don't overflow horizontally. */
          .explorer-rail {
            top: 56px !important;
            bottom: 0 !important;
            width: min(420px, 100vw) !important;
          }
          .explorer-rail--left {
            left: 0 !important;
            border-right: 1px solid var(--border-hud);
            border-left: none !important;
          }
          .explorer-rail--right {
            right: 0 !important;
            border-left: 1px solid var(--border-hud);
            border-right: none !important;
          }
          .explorer-rail--left[data-open="false"] {
            transform: translateX(-100%) !important;
          }
          .explorer-rail--right[data-open="false"] {
            transform: translateX(100%) !important;
          }

          /* Toggles snap to the inside edge of the rail when open so they
             remain tappable as the "close" affordance. */
          .explorer-toggle--left[data-open="true"] {
            left: calc(min(420px, 100vw) - 24px) !important;
          }
          .explorer-toggle--right[data-open="true"] {
            right: calc(min(420px, 100vw) - 24px) !important;
          }
        }
      `}</style>
    </div>
  )
}
