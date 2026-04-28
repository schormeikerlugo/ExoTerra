import { useMemo, useState, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { ChevronRight } from 'lucide-react'
import { useStore } from '../store/useStore'
import { useReveal } from '../hooks/useReveal'
import { CornerBrackets } from '../components/HUD/CornerBrackets'
import { Barcode } from '../components/HUD/Barcode'
import { Sparkline } from '../components/HUD/Sparkline'
import { RegistrationField } from '../components/HUD/RegistrationField'
import { TrackingCode } from '../components/HUD/TrackingCode'
import { HatchFill } from '../components/HUD/HatchFill'
import { PageMeta } from '../components/seo/PageMeta'
import { getExoplanetTexture } from '../utils/textureMap'
import { planetNameToSeed } from '../utils/planetSeed'
import type { Exoplanet } from '../data/types'

const MILESTONES: Record<number, string> = {
  1992: 'First exoplanet confirmed',
  1995: '51 Pegasi b — First around a Sun-like star',
  2009: 'Kepler Space Telescope launched',
  2014: 'Kepler bulk verification — 715 confirmed',
  2018: 'TESS Mission launched',
  2021: 'James Webb Space Telescope launched',
}

const TYPE_LABELS: Record<string, string> = {
  rocky: 'Rocky',
  super_earth: 'Super Earth',
  gas_giant: 'Gas Giant',
  hot_jupiter: 'Hot Jupiter',
  ice_giant: 'Ice Giant',
  mini_neptune: 'Mini Neptune',
  lava_world: 'Lava World',
  frozen_rocky: 'Frozen Rocky',
  unknown: 'Unknown',
}

function orbStyle(planet: Exoplanet, size: number): CSSProperties {
  const texture = getExoplanetTexture(planet)
  const seed = planetNameToSeed(planet.pl_name)
  const bgX = Math.floor(seed) % 100
  const insetShadow = Math.round(size * 0.12)
  return {
    width: size, height: size, borderRadius: '50%',
    backgroundImage: [
      'radial-gradient(circle at 30% 25%, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0) 32%)',
      'radial-gradient(circle at 50% 50%, transparent 52%, rgba(0,0,0,0.7) 100%)',
      `url(${texture})`,
    ].join(', '),
    backgroundSize: 'cover, cover, 220% 180%',
    backgroundPosition: `center, center, ${bgX}% 50%`,
    backgroundRepeat: 'no-repeat, no-repeat, no-repeat',
    boxShadow: `inset -${insetShadow * 0.6}px -${insetShadow}px ${insetShadow * 2}px rgba(0,0,0,0.7)`,
  }
}

export function TimelinePage() {
  const planets = useStore((s) => s.planets)
  useReveal()

  const yearRange = useMemo(() => {
    const years = planets.map((p) => p.disc_year).filter((y): y is number => y !== null)
    if (years.length === 0) return { min: 1990, max: 2025 }
    return { min: Math.min(...years), max: Math.max(...years) }
  }, [planets])

  const [minYear, setMinYear] = useState(yearRange.min)
  const [maxYear, setMaxYear] = useState(yearRange.max)
  const [expandedYears, setExpandedYears] = useState<Record<number, boolean>>({})

  const data = useMemo(() => {
    const grouped: Record<number, Exoplanet[]> = {}
    for (const p of planets) {
      if (p.disc_year !== null && p.disc_year >= minYear && p.disc_year <= maxYear) {
        if (!grouped[p.disc_year]) grouped[p.disc_year] = []
        grouped[p.disc_year].push(p)
      }
    }
    const maxCount = Math.max(1, ...Object.values(grouped).map((arr) => arr.length))
    const entries = Object.entries(grouped)
      .map(([year, pls]) => {
        const y = Number(year)
        const methods: Record<string, number> = {}
        for (const p of pls) {
          const m = p.discoverymethod ?? 'Unknown'
          methods[m] = (methods[m] || 0) + 1
        }
        const top3 = [...pls].sort((a, b) => b.habitability_score - a.habitability_score).slice(0, 3)
        const habitable = pls.filter((p) => p.in_habitable_zone).length
        return { year: y, count: pls.length, methods, top3, habitable, barFrac: pls.length / maxCount }
      })
      .sort((a, b) => b.year - a.year)
    return entries
  }, [planets, minYear, maxYear])

  const counters = useMemo(() => {
    const totalShown = data.reduce((s, d) => s + d.count, 0)
    const yearsCovered = data.length
    const peak = data.reduce((b, c) => (c.count > b.count ? c : b), data[0] ?? { year: 0, count: 0 })
    const habitableTotal = data.reduce((s, d) => s + d.habitable, 0)
    const firstYear = data.length > 0 ? data[data.length - 1].year : yearRange.min
    const latestYear = data.length > 0 ? data[0].year : yearRange.max
    return { totalShown, yearsCovered, peak, habitableTotal, firstYear, latestYear }
  }, [data, yearRange])

  const toggleYear = (year: number) => {
    setExpandedYears((prev) => ({ ...prev, [year]: !prev[year] }))
  }

  if (planets.length === 0) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', paddingTop: 56,
        color: 'var(--text-muted)',
        fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase',
      }}>
        Loading log…
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', paddingTop: 56, position: 'relative' }}>
      <PageMeta
        title="Discovery Timeline"
        description={`Every confirmed exoplanet, indexed by discovery year. Mission milestones from 1992 to today — Kepler, TESS, JWST and more. Currently logging ${planets.length.toLocaleString()} discoveries across ${yearRange.max - yearRange.min + 1} years.`}
      />
      {/* ─── Hero strip ─── */}
      <section style={{ padding: '96px var(--gutter) 60px', position: 'relative' }}>
        <RegistrationField seed="timeline-hero" density="medium" opacity={0.4} hideMobile inset={32} />
        <div style={{ maxWidth: 'var(--max-w)', margin: '0 auto', position: 'relative' }}>
          <div data-reveal="up" style={{
            display: 'flex', alignItems: 'center', gap: 14,
            paddingBottom: 32,
            borderBottom: '1px solid var(--border-hud)',
            marginBottom: 48,
            flexWrap: 'wrap', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-primary)', letterSpacing: 3 }}>
                TIMELINE
              </span>
              <span style={{ width: 32, height: 1, background: 'var(--hud-line)' }} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', letterSpacing: 2.5, textTransform: 'uppercase' }}>
                Discovery Log · {yearRange.min}–{yearRange.max}
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginLeft: 8 }}>
                <span style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: 'var(--hud-green)',
                  boxShadow: '0 0 6px var(--hud-green)',
                  animation: 'hud-pulse 1.8s ease-in-out infinite',
                }} />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--hud-green)', letterSpacing: 2 }}>LIVE</span>
              </span>
            </div>
            <span className="page-eyebrow-tail">
              <span data-tail-hatch><HatchFill style={{ width: 18, height: 8 }} opacity={0.4} /></span>
              <TrackingCode seed={`timeline-${planets.length}`} variant="rec" />
              <span data-tail-barcode><Barcode seed={`timeline-${planets.length}`} bars={36} height={18} /></span>
            </span>
          </div>

          <h1 data-reveal="up" data-d="2" style={{
            fontFamily: 'var(--font-astra)',
            fontSize: 'clamp(40px, 6.5vw, 96px)',
            fontWeight: 600,
            lineHeight: 0.95,
            letterSpacing: '0.01em',
            color: 'var(--text-primary)',
            margin: 0,
          }}>
            Discovery{' '}
            <span style={{
              fontFamily: 'var(--font-display)',
              fontStyle: 'italic',
              fontWeight: 300,
              letterSpacing: '-0.01em',
              color: 'var(--text-muted)',
            }}>
              log.
            </span>
          </h1>
          <p data-reveal="up" data-d="3" style={{
            fontFamily: 'var(--font-body)', fontSize: 16, lineHeight: 1.7,
            color: 'var(--text-muted)',
            margin: '24px 0 0', maxWidth: '64ch',
          }}>
            Every confirmed exoplanet, indexed by the year it joined the archive. Scrub the
            range, expand any year to see its top-ranked worlds, and follow the method mix
            shift as our instruments evolved.
          </p>
        </div>
      </section>

      {/* ─── Sec 01 · Mission counters ─── */}
      <Section code="01" label="Log Counters">
        <div className="tl-counters" style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14,
        }}>
          <div data-reveal="up"><CounterPanel code="LOG_01" label="Discoveries In Range" value={counters.totalShown.toLocaleString()} status="live" seed="tl-1" /></div>
          <div data-reveal="up" data-d="2"><CounterPanel code="LOG_02" label="Years Covered"     value={counters.yearsCovered.toString()}     status="live" seed="tl-2" /></div>
          <div data-reveal="up" data-d="3"><CounterPanel code="LOG_03" label="Peak Year"         value={`${counters.peak.year} · ${counters.peak.count}`} status="idle" seed="tl-3" accent /></div>
          <div data-reveal="up" data-d="4"><CounterPanel code="LOG_04" label="Habitable Zone"    value={counters.habitableTotal.toLocaleString()} status="idle" seed="tl-4" /></div>
        </div>
      </Section>

      {/* ─── Sec 02 · Range filter ─── */}
      <Section code="02" label="Range Filter">
        <p data-reveal="up" style={{
          fontFamily: 'var(--font-body)', fontSize: 15, lineHeight: 1.7,
          color: 'var(--text-muted)', margin: '0 0 28px', maxWidth: '60ch',
        }}>
          Drag either lever to clamp the discovery window. The log below redraws against the
          new range — counters update live.
        </p>
        <div data-reveal="up" data-d="2" className="hud-glass" style={{
          position: 'relative', padding: '22px 24px',
          border: '1px solid var(--border-hud)',
        }}>
          <CornerBrackets size={8} inset={-1} color="var(--hud-line)" thickness={1} />
          <div style={{
            display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 18, alignItems: 'center',
          }} className="tl-range-row">
            <div className="tl-range-cap">
              <span className="tl-range-cap-label">From</span>
              <span className="tl-range-cap-value">{minYear}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 }}>
              <input
                type="range"
                min={yearRange.min}
                max={yearRange.max}
                value={minYear}
                onChange={(e) => {
                  const v = Number(e.target.value)
                  setMinYear(Math.min(v, maxYear))
                }}
                className="tl-range"
                aria-label="Minimum year"
              />
              <input
                type="range"
                min={yearRange.min}
                max={yearRange.max}
                value={maxYear}
                onChange={(e) => {
                  const v = Number(e.target.value)
                  setMaxYear(Math.max(v, minYear))
                }}
                className="tl-range"
                aria-label="Maximum year"
              />
            </div>
            <div className="tl-range-cap" style={{ alignItems: 'flex-end', textAlign: 'right' }}>
              <span className="tl-range-cap-label">To</span>
              <span className="tl-range-cap-value">{maxYear}</span>
            </div>
          </div>
        </div>
      </Section>

      {/* ─── Sec 03 · Vertical log ─── */}
      <Section code="03" label="Discovery Log · Year by Year">
        <p data-reveal="up" style={{
          fontFamily: 'var(--font-body)', fontSize: 15, lineHeight: 1.7,
          color: 'var(--text-muted)', margin: '0 0 36px', maxWidth: '60ch',
        }}>
          Newest at the top. Cyan markers flag mission milestones. Click any year to surface
          its three best-scored worlds.
        </p>

        {data.length === 0 ? (
          <div style={{
            border: '1px dashed var(--border-hud)', padding: '56px 24px', textAlign: 'center',
            fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)',
            letterSpacing: 2, textTransform: 'uppercase',
          }}>
            No discoveries in the selected window.
          </div>
        ) : (
          <div className="tl-log">
            <div className="tl-log-rail" />
            {data.map((entry, idx) => {
              const milestone = MILESTONES[entry.year]
              const isExpanded = expandedYears[entry.year] || false
              return (
                <div
                  key={entry.year}
                  data-reveal="up"
                  data-d={Math.min(idx + 1, 8).toString()}
                  className="tl-log-entry"
                >
                  {/* Marker */}
                  <div className="tl-log-marker">
                    {milestone ? (
                      <>
                        <span className="tl-log-diamond" />
                        <span className="tl-log-halo" />
                      </>
                    ) : (
                      <span className="tl-log-dot" />
                    )}
                  </div>

                  {/* Card */}
                  <div className="tl-log-card hud-glass">
                    <CornerBrackets size={6} inset={-1} color="var(--hud-line)" thickness={1} />

                    {/* Milestone banner */}
                    {milestone && (
                      <div className="tl-log-banner">
                        <span style={{
                          width: 6, height: 6, borderRadius: '50%',
                          background: 'var(--hud-cyan)',
                          boxShadow: '0 0 5px var(--hud-cyan-glow)',
                        }} />
                        <span style={{
                          fontFamily: 'var(--font-mono)', fontSize: 9,
                          color: 'var(--hud-cyan)', letterSpacing: 2, textTransform: 'uppercase',
                        }}>
                          Milestone
                        </span>
                        <span style={{ width: 18, height: 1, background: 'var(--hud-cyan-50)' }} />
                        <span style={{
                          fontFamily: 'var(--font-body)', fontSize: 12,
                          color: 'var(--text-primary)',
                        }}>
                          {milestone}
                        </span>
                      </div>
                    )}

                    {/* Header row */}
                    <button
                      onClick={() => toggleYear(entry.year)}
                      className="tl-log-head"
                      aria-expanded={isExpanded}
                    >
                      <span className="tl-log-rank">
                        {(idx + 1).toString().padStart(3, '0')}
                      </span>
                      <span className="tl-log-year">
                        {entry.year}
                      </span>
                      <span className="tl-log-count">
                        <span style={{ color: 'var(--text-primary)' }}>{entry.count.toLocaleString()}</span>
                        <span style={{ color: 'var(--text-dim)' }}> planet{entry.count !== 1 ? 's' : ''}</span>
                      </span>
                      <span className="tl-log-bar">
                        <span style={{
                          position: 'absolute', left: 0, top: 0, bottom: 0,
                          width: `${entry.barFrac * 100}%`,
                          background: milestone
                            ? 'linear-gradient(to right, var(--hud-cyan-glow), var(--hud-cyan))'
                            : 'linear-gradient(to right, rgba(255,255,255,0.12), rgba(255,255,255,0.42))',
                          boxShadow: milestone ? '0 0 8px var(--hud-cyan-glow)' : 'none',
                        }} />
                        {[25, 50, 75].map((p) => (
                          <span key={p} style={{
                            position: 'absolute', left: `${p}%`, top: '25%', bottom: '25%',
                            width: 1, background: 'var(--border-hud-strong)',
                          }} />
                        ))}
                      </span>
                      <motion.span
                        animate={{ rotate: isExpanded ? 90 : 0 }}
                        transition={{ duration: 0.22 }}
                        className="tl-log-chev"
                      >
                        <ChevronRight size={14} />
                      </motion.span>
                    </button>

                    {/* Method chips */}
                    <div className="tl-log-methods">
                      {Object.entries(entry.methods)
                        .sort((a, b) => b[1] - a[1])
                        .map(([m, c]) => (
                          <span key={m} className="tl-log-chip">
                            <span style={{ color: 'var(--text-muted)' }}>{m}</span>
                            <span style={{ color: 'var(--text-dim)' }}>·</span>
                            <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{c}</span>
                          </span>
                        ))}
                      {entry.habitable > 0 && (
                        <span className="tl-log-chip tl-log-chip--accent">
                          <span style={{ color: 'var(--hud-cyan)' }}>HZ</span>
                          <span style={{ color: 'var(--hud-cyan-50)' }}>·</span>
                          <span style={{ color: 'var(--hud-cyan)', fontWeight: 600 }}>{entry.habitable}</span>
                        </span>
                      )}
                    </div>

                    {/* Expanded: top 3 */}
                    <AnimatePresence initial={false}>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                          style={{ overflow: 'hidden' }}
                        >
                          <div className="tl-log-top3">
                            <div className="tl-log-top3-label">
                              <span style={{ width: 18, height: 1, background: 'var(--hud-line)' }} />
                              <span>Top scorers · {entry.year}</span>
                              <span style={{ width: 18, height: 1, background: 'var(--hud-line)' }} />
                            </div>
                            <div className="tl-log-top3-grid">
                              {entry.top3.map((p) => (
                                <Link
                                  key={p.id}
                                  to={`/explore/${encodeURIComponent(p.pl_name)}`}
                                  className="tl-log-top3-card"
                                >
                                  <div style={orbStyle(p, 44)} />
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{
                                      fontFamily: 'var(--font-hero)', fontSize: 13, fontWeight: 500,
                                      color: 'var(--text-primary)',
                                      letterSpacing: '0.04em', textTransform: 'uppercase',
                                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                    }}>
                                      {p.pl_name}
                                    </div>
                                    <div style={{
                                      fontFamily: 'var(--font-mono)', fontSize: 10,
                                      color: 'var(--text-dim)', letterSpacing: 1, marginTop: 3,
                                    }}>
                                      {TYPE_LABELS[p.planet_type] ?? p.planet_type}
                                      {p.pl_eqt !== null && <> · {p.pl_eqt.toFixed(0)} K</>}
                                    </div>
                                  </div>
                                  <div className="tl-log-top3-score">
                                    <span style={{
                                      fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 600,
                                      color: 'var(--hud-cyan)',
                                      textShadow: '0 0 8px var(--hud-cyan-glow)',
                                    }}>
                                      {p.habitability_score.toFixed(0)}
                                    </span>
                                    <span style={{
                                      fontFamily: 'var(--font-mono)', fontSize: 8,
                                      color: 'var(--text-dim)', letterSpacing: 1.5,
                                    }}>
                                      SCORE
                                    </span>
                                  </div>
                                </Link>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Section>

      <div style={{ height: 80 }} />

      <style>{`
        /* Range slider */
        .tl-range-cap {
          display: flex; flex-direction: column; gap: 4px; min-width: 64px;
        }
        .tl-range-cap-label {
          font-family: var(--font-mono); font-size: 9px;
          color: var(--text-dim); letter-spacing: 1.5px; text-transform: uppercase;
        }
        .tl-range-cap-value {
          font-family: var(--font-mono); font-size: 22px; font-weight: 600;
          color: var(--hud-cyan); letter-spacing: -0.5px;
          text-shadow: 0 0 12px var(--hud-cyan-glow);
        }
        .tl-range {
          width: 100%; height: 18px;
          -webkit-appearance: none; appearance: none;
          background: transparent; cursor: pointer;
        }
        .tl-range::-webkit-slider-runnable-track {
          height: 2px; background: var(--border-hud-strong);
        }
        .tl-range::-moz-range-track {
          height: 2px; background: var(--border-hud-strong);
        }
        .tl-range::-webkit-slider-thumb {
          -webkit-appearance: none; appearance: none;
          width: 14px; height: 14px; border-radius: 0;
          background: var(--hud-cyan);
          border: 1px solid var(--bg-void);
          box-shadow: 0 0 8px var(--hud-cyan-glow);
          margin-top: -6px; cursor: pointer;
          transform: rotate(45deg);
        }
        .tl-range::-moz-range-thumb {
          width: 14px; height: 14px; border-radius: 0;
          background: var(--hud-cyan);
          border: 1px solid var(--bg-void);
          box-shadow: 0 0 8px var(--hud-cyan-glow);
          cursor: pointer;
          transform: rotate(45deg);
        }

        /* Log */
        .tl-log {
          position: relative;
          padding-left: 36px;
        }
        .tl-log-rail {
          position: absolute; left: 11px; top: 8px; bottom: 8px;
          width: 1px; background: linear-gradient(
            to bottom,
            transparent 0%,
            var(--border-hud) 8%,
            var(--border-hud) 92%,
            transparent 100%
          );
        }
        .tl-log-entry {
          position: relative; margin-bottom: 18px;
        }
        .tl-log-entry:last-child { margin-bottom: 0; }
        .tl-log-marker {
          position: absolute; left: -32px; top: 16px;
          width: 22px; height: 22px;
          display: flex; align-items: center; justify-content: center;
        }
        .tl-log-dot {
          width: 7px; height: 7px; border-radius: 50%;
          background: rgba(255,255,255,0.18);
          border: 1px solid var(--border-hud-strong);
        }
        .tl-log-diamond {
          width: 10px; height: 10px;
          background: var(--hud-cyan);
          box-shadow: 0 0 8px var(--hud-cyan-glow);
          transform: rotate(45deg);
          animation: hud-pulse 2.4s ease-in-out infinite;
        }
        .tl-log-halo {
          position: absolute; inset: 0;
          border: 1px solid var(--hud-cyan-50);
          transform: rotate(45deg);
          animation: hud-pulse 2.4s ease-in-out infinite reverse;
        }
        .tl-log-card {
          position: relative;
          border: 1px solid var(--border-hud);
          padding: 16px 18px;
        }
        .tl-log-banner {
          display: inline-flex; align-items: center; gap: 10px;
          padding: 6px 12px;
          margin-bottom: 14px;
          background: rgba(34,211,238,0.05);
          border: 1px solid var(--hud-cyan-30);
          flex-wrap: wrap;
        }
        .tl-log-head {
          display: grid;
          grid-template-columns: 44px 90px minmax(110px, auto) 1fr 22px;
          gap: 16px; align-items: center;
          width: 100%;
          background: transparent; border: none;
          padding: 4px 0; cursor: pointer;
          text-align: left;
        }
        .tl-log-rank {
          font-family: var(--font-mono); font-size: 10px;
          color: var(--text-dim); letter-spacing: 1.5px;
        }
        .tl-log-year {
          font-family: var(--font-mono); font-size: 22px; font-weight: 600;
          color: var(--text-primary); letter-spacing: -0.5px;
        }
        .tl-log-count {
          font-family: var(--font-mono); font-size: 12px;
          letter-spacing: 1px;
        }
        .tl-log-bar {
          position: relative; height: 10px;
          border: 1px solid var(--border-hud);
        }
        .tl-log-chev {
          display: inline-flex; align-items: center; justify-content: center;
          color: var(--text-muted);
        }
        .tl-log-methods {
          display: flex; flex-wrap: wrap; gap: 8px;
          margin-top: 14px;
          padding-top: 14px;
          border-top: 1px dashed var(--border-hud);
        }
        .tl-log-chip {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 4px 10px;
          border: 1px solid var(--border-hud);
          background: rgba(255,255,255,0.02);
          font-family: var(--font-mono); font-size: 10px;
          letter-spacing: 0.5px;
        }
        .tl-log-chip--accent {
          border-color: var(--hud-cyan-30);
          background: rgba(34,211,238,0.04);
        }
        .tl-log-top3 {
          margin-top: 14px;
          padding-top: 14px;
          border-top: 1px dashed var(--border-hud);
        }
        .tl-log-top3-label {
          display: flex; align-items: center; gap: 12px;
          margin-bottom: 14px;
          font-family: var(--font-mono); font-size: 10px;
          color: var(--text-muted); letter-spacing: 2px; text-transform: uppercase;
        }
        .tl-log-top3-grid {
          display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;
        }
        .tl-log-top3-card {
          display: flex; align-items: center; gap: 12px;
          padding: 12px 14px;
          border: 1px solid var(--border-hud);
          background: rgba(0,0,0,0.32);
          text-decoration: none;
          transition: all 220ms;
        }
        .tl-log-top3-card:hover {
          border-color: var(--hud-cyan-50);
          background: rgba(34,211,238,0.05);
          transform: translateY(-1px);
        }
        .tl-log-top3-score {
          display: flex; flex-direction: column; align-items: flex-end; gap: 2px;
        }

        @media (max-width: 1100px) {
          .tl-counters { grid-template-columns: repeat(2, 1fr) !important; }
          .tl-log-top3-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 768px) {
          .tl-counters { grid-template-columns: 1fr !important; }
          .tl-range-row { grid-template-columns: 1fr !important; gap: 14px !important; }
          .tl-range-cap { align-items: flex-start !important; text-align: left !important; }
          .tl-log { padding-left: 28px; }
          .tl-log-marker { left: -24px; }
          .tl-log-rail { left: 7px; }
          .tl-log-head {
            grid-template-columns: auto 1fr 22px;
            row-gap: 8px;
          }
          .tl-log-rank { display: none; }
          .tl-log-bar { display: none; }
        }
      `}</style>
    </div>
  )
}

/* ─────────── Section ─────────── */

function Section({ code, label, children }: {
  code: string; label: string; children: React.ReactNode
}) {
  return (
    <section style={{ padding: '60px var(--gutter)', position: 'relative' }}>
      <div style={{ maxWidth: 'var(--max-w)', margin: '0 auto' }}>
        <div data-reveal="up" style={{
          display: 'flex', alignItems: 'center', gap: 14,
          paddingBottom: 24,
          borderBottom: '1px solid var(--border-hud)',
          marginBottom: 36,
        }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-primary)', letterSpacing: 3 }}>
            {code}
          </span>
          <span style={{ width: 32, height: 1, background: 'var(--hud-line)' }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', letterSpacing: 2.5, textTransform: 'uppercase' }}>
            {label}
          </span>
        </div>
        {children}
      </div>
    </section>
  )
}

/* ─────────── CounterPanel ─────────── */

function CounterPanel({ code, label, value, status, seed, accent }: {
  code: string; label: string; value: string; status: 'live' | 'idle'; seed: string; accent?: boolean
}) {
  return (
    <div className="hud-glass" style={{
      position: 'relative',
      border: '1px solid var(--border-hud)',
      padding: '18px 18px 14px',
      display: 'flex', flexDirection: 'column', gap: 14,
      minHeight: 130,
    }}>
      <CornerBrackets size={6} inset={-1} color="var(--hud-line)" thickness={1} />
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        paddingBottom: 8, borderBottom: '1px solid var(--border-hud)',
      }}>
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: 9,
          color: 'var(--text-dim)', letterSpacing: 1.5,
        }}>
          // {code}
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <span style={{
            width: 5, height: 5, borderRadius: '50%',
            background: status === 'live' ? 'var(--hud-green)' : 'var(--text-dim)',
            boxShadow: status === 'live' ? '0 0 5px var(--hud-green)' : 'none',
            animation: status === 'live' ? 'hud-pulse 1.8s ease-in-out infinite' : undefined,
          }} />
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 8,
            color: status === 'live' ? 'var(--hud-green)' : 'var(--text-dim)',
            letterSpacing: 1.5,
          }}>
            {status.toUpperCase()}
          </span>
        </span>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: 28, fontWeight: 600,
          color: accent ? 'var(--hud-cyan)' : 'var(--text-primary)',
          letterSpacing: '-0.02em', lineHeight: 1,
          textShadow: accent ? '0 0 12px var(--hud-cyan-glow)' : 'none',
        }}>
          {value}
        </span>
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: 10,
          color: 'var(--text-muted)', letterSpacing: 1.5, textTransform: 'uppercase',
        }}>
          {label}
        </span>
      </div>
      <Sparkline seed={seed} points={28} height={30} />
    </div>
  )
}
