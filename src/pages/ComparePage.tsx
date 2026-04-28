import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { Trash2, Plus, ArrowLeft, Crown } from 'lucide-react'
import { useComparePlanets, useStore } from '../store/useStore'
import { CornerBrackets } from '../components/HUD/CornerBrackets'
import { Barcode } from '../components/HUD/Barcode'
import { RegistrationField } from '../components/HUD/RegistrationField'
import { TrackingCode } from '../components/HUD/TrackingCode'
import { HatchFill } from '../components/HUD/HatchFill'
import { PageMeta } from '../components/seo/PageMeta'
import { useReveal } from '../hooks/useReveal'
import { getExoplanetTexture } from '../utils/textureMap'
import { planetNameToSeed } from '../utils/planetSeed'
import { formatNumber, formatTemperature } from '../utils/planetVisuals'
import type { Exoplanet } from '../data/types'

/* ─────────── PLANET COLOR LANE ───────────
 * Each compared planet gets a stable accent color used in the orbit ring,
 * the radar overlay and the column header. Indexed by position in compareIds. */
const PLANET_COLORS = [
  { key: 'cyan',  stroke: '#22D3EE', glow: 'rgba(34,211,238,0.45)',  fill: 'rgba(34,211,238,0.10)' },
  { key: 'amber', stroke: '#FFB547', glow: 'rgba(255,181,71,0.45)',  fill: 'rgba(255,181,71,0.10)' },
  { key: 'green', stroke: '#5EEAD4', glow: 'rgba(94,234,212,0.45)',  fill: 'rgba(94,234,212,0.10)' },
  { key: 'red',   stroke: '#FF5470', glow: 'rgba(255,84,112,0.45)',  fill: 'rgba(255,84,112,0.10)' },
] as const

const TYPE_LABEL: Record<string, string> = {
  rocky: 'Rocky', super_earth: 'Super Earth', gas_giant: 'Gas Giant',
  hot_jupiter: 'Hot Jupiter', ice_giant: 'Ice Giant', mini_neptune: 'Mini Neptune',
  lava_world: 'Lava', frozen_rocky: 'Frozen', water: 'Water', unknown: 'Unknown',
}

/* ─────────── METRICS ───────────
 * Each metric has a getter, a format fn, and an "Earth-likeness" sigma used by
 * the radar chart. winnerCmp returns true if `a` is "more Earth-like" than `b`. */
type Metric = {
  key: string
  label: string
  unit?: string
  earthRef: number | null
  getValue: (p: Exoplanet) => number | null
  format: (v: number | null) => string
  /** If true: closer to earthRef wins. If false: higher value wins (e.g. score). */
  closerToEarth: boolean
}

const METRICS: Metric[] = [
  { key: 'habitability', label: 'Habitability',  earthRef: 100,  getValue: (p) => p.habitability_score, format: (v) => v !== null ? `${v.toFixed(1)} / 100` : '—', closerToEarth: false },
  { key: 'temperature', label: 'Eq. Temperature', unit: 'K',     earthRef: 288, getValue: (p) => p.pl_eqt,  format: (v) => formatTemperature(v).split(' ')[0] + ' K', closerToEarth: true },
  { key: 'radius',      label: 'Radius',          unit: 'R⊕',    earthRef: 1,   getValue: (p) => p.pl_rade, format: (v) => formatNumber(v), closerToEarth: true },
  { key: 'mass',        label: 'Mass',            unit: 'M⊕',    earthRef: 1,   getValue: (p) => p.pl_masse,format: (v) => formatNumber(v), closerToEarth: true },
  { key: 'density',     label: 'Density',         unit: 'g/cm³', earthRef: 5.51,getValue: (p) => p.pl_dens, format: (v) => formatNumber(v), closerToEarth: true },
  { key: 'insolation',  label: 'Stellar Flux',    unit: 'S⊕',    earthRef: 1,   getValue: (p) => p.pl_insol,format: (v) => formatNumber(v), closerToEarth: true },
  { key: 'period',      label: 'Orbital Period',  unit: 'd',     earthRef: 365, getValue: (p) => p.pl_orbper, format: (v) => v !== null ? v.toFixed(1) : '—', closerToEarth: false },
  { key: 'distance',    label: 'Distance',        unit: 'pc',    earthRef: null, getValue: (p) => p.sy_dist, format: (v) => v !== null ? v.toFixed(1) : '—', closerToEarth: false },
  { key: 'discYear',    label: 'Discovered',      earthRef: null, getValue: (p) => p.disc_year ?? null, format: (v) => v !== null ? v.toString() : '—', closerToEarth: false },
]

/** Determine which planet has the "winning" value for a metric. */
function getWinnerIndex(planets: Exoplanet[], metric: Metric): number | null {
  const values = planets.map((p) => metric.getValue(p))
  if (values.every((v) => v === null)) return null
  let bestIdx = -1
  let bestScore = -Infinity
  values.forEach((v, i) => {
    if (v === null) return
    let score: number
    if (metric.closerToEarth && metric.earthRef !== null) {
      score = -Math.abs(v - metric.earthRef)
    } else if (metric.key === 'distance') {
      score = -v // closest to Earth wins
    } else {
      score = v // higher wins (habitability, disc year)
    }
    if (score > bestScore) {
      bestScore = score
      bestIdx = i
    }
  })
  return bestIdx === -1 ? null : bestIdx
}

/* ─────────── Mini-orb (real texture) ─────────── */
function miniOrbStyle(planet: Exoplanet, size: number): CSSProperties {
  const texture = getExoplanetTexture(planet)
  const seed = planetNameToSeed(planet.pl_name)
  const bgX = Math.floor(seed) % 100
  const insetShadow = Math.round(size * 0.12)
  return {
    width: size,
    height: size,
    borderRadius: '50%',
    backgroundImage: [
      'radial-gradient(circle at 30% 25%, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0) 32%)',
      'radial-gradient(circle at 50% 50%, transparent 52%, rgba(0,0,0,0.7) 100%)',
      `url(${texture})`,
    ].join(', '),
    backgroundSize: 'cover, cover, 220% 180%',
    backgroundPosition: `center, center, ${bgX}% 50%`,
    backgroundRepeat: 'no-repeat, no-repeat, no-repeat',
    boxShadow: `inset -${insetShadow * 0.6}px -${insetShadow}px ${insetShadow * 2}px rgba(0,0,0,0.7), 0 0 ${size * 0.2}px rgba(255,255,255,0.04)`,
  }
}

/* ─────────── PAGE ─────────── */
export function ComparePage() {
  const planets = useComparePlanets()
  const removeFromCompare = useStore((s) => s.removeFromCompare)
  const clearCompare = useStore((s) => s.clearCompare)

  useReveal()

  if (planets.length === 0) {
    return (
      <>
        <PageMeta
          title="Compare"
          description="Stack up to 4 exoplanets side-by-side and see which is most Earth-like. Pick targets from the Catalog or Explore views to begin."
        />
        <EmptyState />
      </>
    )
  }

  const compareDesc = `Comparing ${planets.length} exoplanets side-by-side: ${planets.map((p) => p.pl_name).join(', ')}. Specifications, habitability radar, and verdict.`

  return (
    <div style={{ minHeight: '100vh', paddingTop: 56 }}>
      <PageMeta title={`Compare · ${planets.length}`} description={compareDesc} />
      <Header count={planets.length} onClear={clearCompare} />

      {/* Identity strip — orbs colored by lane */}
      <Section padding="48px var(--gutter) 32px">
        <div data-reveal="up" className="compare-identity-grid" style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${planets.length}, 1fr)`,
          gap: 24,
        }}>
          {planets.map((p, i) => (
            <PlanetIdentityCard
              key={p.id}
              planet={p}
              colorIdx={i}
              onRemove={() => removeFromCompare(p.id)}
            />
          ))}
        </div>
      </Section>

      {/* Spec table */}
      <Section padding="60px var(--gutter)">
        <SectionHeader code="01" label="Side by Side" />
        <SpecTable planets={planets} />
      </Section>

      {/* Habitability radar */}
      <Section padding="80px var(--gutter)">
        <SectionHeader code="02" label="Habitability Radar" />
        <RadarChart planets={planets} />
      </Section>

      {/* Verdict — quick summary */}
      <Section padding="60px var(--gutter) 120px">
        <SectionHeader code="03" label="Verdict" />
        <Verdict planets={planets} />
      </Section>

      <style>{`
        @media (max-width: 900px) {
          /* Radar + Verdict: stack 2-col layouts vertically */
          .compare-radar-grid,
          .compare-verdict-grid {
            grid-template-columns: 1fr !important;
            gap: 32px !important;
          }
        }
        @media (max-width: 768px) {
          /* Stack identity cards vertically */
          .compare-identity-grid {
            grid-template-columns: 1fr !important;
            gap: 14px !important;
          }
          /* Stack spec rows: label on top, then values below */
          .compare-spec-row {
            grid-template-columns: 1fr !important;
            gap: 6px !important;
            padding: 14px 0 !important;
          }
          .compare-spec-row > span:first-child {
            margin-bottom: 4px;
          }
        }
        @media (max-width: 480px) {
          .compare-verdict-row {
            grid-template-columns: minmax(0, 1fr) 56px !important;
            grid-template-rows: auto auto;
            row-gap: 6px !important;
          }
          .compare-verdict-row > div {
            grid-column: 1 / -1;
            order: 3;
          }
          .compare-verdict-row > span:last-child {
            order: 2;
          }
        }
      `}</style>
    </div>
  )
}

/* ─────────── Sub-components ─────────── */

function Header({ count, onClear }: { count: number; onClear: () => void }) {
  return (
    <div style={{ padding: '32px var(--gutter) 0', position: 'relative' }}>
      <RegistrationField seed="compare-hero" density="medium" opacity={0.4} hideMobile inset={28} />
      <div style={{ maxWidth: 'var(--max-w)', margin: '0 auto', position: 'relative' }}>
        <div data-reveal="up" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 24, flexWrap: 'wrap',
          paddingBottom: 24,
          borderBottom: '1px solid var(--border-hud)',
        }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-primary)', letterSpacing: 3 }}>
              COMPARE
            </span>
            <span style={{ width: 32, height: 1, background: 'var(--hud-line)' }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', letterSpacing: 2.5, textTransform: 'uppercase' }}>
              {count} {count === 1 ? 'Target' : 'Targets'} · Side by Side
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginLeft: 4 }}>
              <span style={{
                width: 6, height: 6, borderRadius: '50%',
                background: 'var(--hud-cyan)',
                boxShadow: '0 0 6px var(--hud-cyan-glow)',
                animation: 'hud-pulse 1.8s ease-in-out infinite',
              }} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--hud-cyan)', letterSpacing: 2 }}>SIDE-BY-SIDE</span>
            </span>
            <span className="page-eyebrow-tail" style={{ marginLeft: 6 }}>
              <span data-tail-hatch><HatchFill style={{ width: 16, height: 7 }} opacity={0.4} /></span>
              <TrackingCode seed={`compare-${count}`} variant="rec" />
            </span>
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
            <Link
              to="/explore"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '8px 14px',
                border: '1px solid var(--border-hud)',
                color: 'var(--text-muted)',
                fontFamily: 'var(--font-mono)', fontSize: 10,
                letterSpacing: 1.8, textTransform: 'uppercase',
                textDecoration: 'none',
                transition: 'all 180ms',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--hud-cyan)'; e.currentTarget.style.color = 'var(--hud-cyan)' }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-hud)'; e.currentTarget.style.color = 'var(--text-muted)' }}
            >
              <Plus size={12} /> Add Targets
            </Link>
            <button
              onClick={onClear}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '8px 14px',
                background: 'transparent',
                border: '1px solid var(--border-hud)',
                color: 'var(--text-muted)',
                fontFamily: 'var(--font-mono)', fontSize: 10,
                letterSpacing: 1.8, textTransform: 'uppercase',
                cursor: 'pointer',
                transition: 'all 180ms',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--hud-red)'; e.currentTarget.style.color = 'var(--hud-red)' }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-hud)'; e.currentTarget.style.color = 'var(--text-muted)' }}
            >
              <Trash2 size={12} /> Clear All
            </button>
          </div>
        </div>

        {/* Big display heading */}
        <h1 data-reveal="up" data-d="2" style={{
          fontFamily: 'var(--font-astra)',
          fontSize: 'clamp(40px, 6.5vw, 96px)',
          fontWeight: 600,
          lineHeight: 0.95,
          letterSpacing: '0.01em',
          color: 'var(--text-primary)',
          margin: '36px 0 0',
        }}>
          Comparing{' '}
          <span style={{
            fontFamily: 'var(--font-display)',
            fontStyle: 'italic',
            fontWeight: 300,
            letterSpacing: '-0.01em',
            color: 'var(--text-muted)',
          }}>
            {count}
          </span>
          {' '}{count === 1 ? 'world' : 'worlds'}.
        </h1>
      </div>
    </div>
  )
}

function PlanetIdentityCard({ planet, colorIdx, onRemove }: {
  planet: Exoplanet
  colorIdx: number
  onRemove: () => void
}) {
  const color = PLANET_COLORS[colorIdx]
  return (
    <div className="hud-card" style={{
      position: 'relative',
      border: `1px solid ${color.stroke}`,
      borderTop: `2px solid ${color.stroke}`,
      padding: '20px 22px',
      boxShadow: `0 0 24px ${color.glow}`,
    }}>
      <CornerBrackets size={7} inset={-1} color={color.stroke} thickness={1} />

      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 16,
      }}>
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: 9,
          color: color.stroke, letterSpacing: 2,
        }}>
          LANE {String.fromCharCode(65 + colorIdx)} · {TYPE_LABEL[planet.planet_type]?.toUpperCase() ?? '—'}
        </span>
        <button
          onClick={onRemove}
          aria-label={`Remove ${planet.pl_name}`}
          style={{
            width: 24, height: 24,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            background: 'transparent',
            border: '1px solid var(--border-hud)',
            color: 'var(--text-dim)',
            cursor: 'pointer',
            transition: 'all 180ms',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--hud-red)'; e.currentTarget.style.color = 'var(--hud-red)' }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-hud)'; e.currentTarget.style.color = 'var(--text-dim)' }}
        >
          ✕
        </button>
      </div>

      {/* Orb + name */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
        <div style={{ position: 'relative' }}>
          <div style={miniOrbStyle(planet, 96)} />
          {/* color ring */}
          <div style={{
            position: 'absolute', inset: -6,
            border: `1px dashed ${color.stroke}`,
            borderRadius: '50%',
            opacity: 0.5,
          }} />
        </div>

        <Link
          to={`/explore/${encodeURIComponent(planet.pl_name)}`}
          style={{
            fontFamily: 'var(--font-hero)', fontSize: 18, fontWeight: 500,
            letterSpacing: '0.05em', textTransform: 'uppercase',
            color: 'var(--text-primary)',
            textDecoration: 'none',
            textAlign: 'center',
            wordBreak: 'normal',
          }}
        >
          {planet.pl_name}
        </Link>
        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: 10,
          color: 'var(--text-muted)', letterSpacing: 1, textTransform: 'uppercase',
          textAlign: 'center',
        }}>
          HOST · {planet.hostname}
        </div>
      </div>
    </div>
  )
}

function SpecTable({ planets }: { planets: Exoplanet[] }) {
  return (
    <div data-reveal="up" data-d="2">
      {METRICS.map((metric, i) => {
        const winnerIdx = getWinnerIndex(planets, metric)
        return (
          <div
            key={metric.key}
            className="compare-spec-row"
            style={{
              display: 'grid',
              gridTemplateColumns: `200px repeat(${planets.length}, 1fr)`,
              gap: 14,
              alignItems: 'center',
              padding: '18px 0',
              borderBottom: i < METRICS.length - 1 ? '1px dashed var(--border-hud)' : 'none',
            }}
          >
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: 11,
              color: 'var(--text-dim)', letterSpacing: 1.5, textTransform: 'uppercase',
            }}>
              {metric.label}
            </span>
            {planets.map((p, idx) => {
              const value = metric.getValue(p)
              const formatted = metric.format(value)
              const isWinner = winnerIdx === idx && planets.length > 1
              const color = PLANET_COLORS[idx]
              return (
                <div
                  key={p.id}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    fontFamily: 'var(--font-mono)', fontSize: 16,
                    color: 'var(--text-primary)',
                    paddingLeft: isWinner ? 10 : 0,
                    borderLeft: isWinner ? `2px solid ${color.stroke}` : '2px solid transparent',
                  }}
                >
                  {isWinner && (
                    <Crown size={12} style={{ color: color.stroke, flexShrink: 0 }} />
                  )}
                  <span>
                    {formatted}
                    {metric.unit && (
                      <span style={{ marginLeft: 4, fontSize: 11, color: 'var(--text-dim)' }}>
                        {metric.unit}
                      </span>
                    )}
                  </span>
                </div>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}

/* ─────────── RadarChart ─────────── */

const RADAR_AXES = [
  { key: 'habitability', label: 'HABITABILITY', getScore: (p: Exoplanet) => p.habitability_score },
  { key: 'temp',         label: 'TEMP',         getScore: (p: Exoplanet) => earthLikeness(p.pl_eqt, 288, 100) },
  { key: 'radius',       label: 'RADIUS',       getScore: (p: Exoplanet) => earthLikeness(p.pl_rade, 1, 1) },
  { key: 'mass',         label: 'MASS',         getScore: (p: Exoplanet) => earthLikeness(p.pl_masse, 1, 3) },
  { key: 'flux',         label: 'FLUX',         getScore: (p: Exoplanet) => earthLikeness(p.pl_insol, 1, 1) },
] as const

function earthLikeness(value: number | null, target: number, sigma: number): number {
  if (value === null) return 0
  const z = (value - target) / sigma
  return Math.max(0, Math.min(100, 100 * Math.exp(-(z * z) / 2)))
}

function RadarChart({ planets }: { planets: Exoplanet[] }) {
  const SIZE = 480
  const CENTER = SIZE / 2
  const MAX_RADIUS = SIZE / 2 - 70
  const numAxes = RADAR_AXES.length

  // Polar → Cartesian, axis 0 at top
  const angleAt = (i: number) => -Math.PI / 2 + (i / numAxes) * Math.PI * 2
  const pointAt = (i: number, ratio: number) => ({
    x: CENTER + Math.cos(angleAt(i)) * MAX_RADIUS * ratio,
    y: CENTER + Math.sin(angleAt(i)) * MAX_RADIUS * ratio,
  })

  return (
    <div data-reveal="up" data-d="2" className="compare-radar-grid" style={{
      display: 'grid',
      gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)',
      gap: 48,
      alignItems: 'center',
    }}>
      <div style={{ position: 'relative', maxWidth: SIZE, margin: '0 auto', width: '100%' }}>
        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} style={{ width: '100%', height: 'auto' }} aria-hidden>
          {/* Concentric guide rings */}
          {[0.25, 0.5, 0.75, 1].map((r) => (
            <circle key={r}
              cx={CENTER} cy={CENTER} r={MAX_RADIUS * r}
              fill="none"
              stroke={r === 1 ? 'var(--hud-line)' : 'var(--border-hud)'}
              strokeWidth={r === 1 ? 1 : 0.5}
              strokeDasharray={r === 1 ? '0' : '2 3'}
            />
          ))}
          {/* Axis spokes */}
          {RADAR_AXES.map((axis, i) => {
            const end = pointAt(i, 1)
            return (
              <g key={axis.key}>
                <line
                  x1={CENTER} y1={CENTER} x2={end.x} y2={end.y}
                  stroke="var(--border-hud)" strokeWidth="0.6"
                  strokeDasharray="2 3"
                />
                {/* Axis label */}
                <text
                  x={CENTER + Math.cos(angleAt(i)) * (MAX_RADIUS + 28)}
                  y={CENTER + Math.sin(angleAt(i)) * (MAX_RADIUS + 28)}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="var(--text-muted)"
                  style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 1.5 }}
                >
                  {axis.label}
                </text>
              </g>
            )
          })}
          {/* Center dot */}
          <circle cx={CENTER} cy={CENTER} r="2" fill="var(--hud-line)" />

          {/* Planet polygons */}
          {planets.map((p, idx) => {
            const color = PLANET_COLORS[idx]
            const points = RADAR_AXES.map((axis, i) => {
              const score = axis.getScore(p) / 100
              return pointAt(i, score)
            })
            const polyD = points.map((pt) => `${pt.x},${pt.y}`).join(' ')
            return (
              <g key={p.id}>
                <polygon
                  points={polyD}
                  fill={color.fill}
                  stroke={color.stroke}
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
                {points.map((pt, i) => (
                  <circle
                    key={i}
                    cx={pt.x} cy={pt.y} r="3"
                    fill={color.stroke}
                  />
                ))}
              </g>
            )
          })}
        </svg>
      </div>

      {/* Side legend */}
      <div>
        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: 10,
          color: 'var(--text-dim)', letterSpacing: 2, textTransform: 'uppercase',
          marginBottom: 16,
        }}>
          Planet Lanes
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {planets.map((p, idx) => {
            const color = PLANET_COLORS[idx]
            const avgScore = RADAR_AXES.reduce((sum, a) => sum + a.getScore(p), 0) / RADAR_AXES.length
            return (
              <div
                key={p.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '20px 1fr auto',
                  gap: 12,
                  alignItems: 'center',
                  padding: '10px 14px',
                  border: `1px solid ${color.stroke}`,
                  background: color.fill,
                }}
              >
                <span style={{
                  width: 12, height: 12,
                  background: color.stroke,
                  boxShadow: `0 0 6px ${color.glow}`,
                }} />
                <span style={{
                  fontFamily: 'var(--font-hero)', fontSize: 13, fontWeight: 500,
                  letterSpacing: '0.04em', textTransform: 'uppercase',
                  color: 'var(--text-primary)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {p.pl_name}
                </span>
                <span style={{
                  fontFamily: 'var(--font-mono)', fontSize: 12,
                  color: color.stroke,
                }}>
                  AVG {avgScore.toFixed(0)}
                </span>
              </div>
            )
          })}
        </div>
        <p style={{
          fontFamily: 'var(--font-body)', fontSize: 13,
          color: 'var(--text-muted)', lineHeight: 1.6,
          marginTop: 24,
          maxWidth: '38ch',
        }}>
          Each axis is a 0–100 Earth-likeness score. Larger polygons → closer to
          Earth-like conditions. Habitability uses our composite model; the rest
          measure how near each value sits to Earth's reference.
        </p>
      </div>
    </div>
  )
}

/* ─────────── Verdict ─────────── */

function Verdict({ planets }: { planets: Exoplanet[] }) {
  // Collect win-counts per planet across earthLikeness metrics
  const wins = planets.map(() => 0)
  let evaluable = 0
  METRICS.forEach((metric) => {
    if (metric.key === 'distance' || metric.key === 'discYear') return
    const widx = getWinnerIndex(planets, metric)
    if (widx !== null) {
      wins[widx]++
      evaluable++
    }
  })
  const overallWinIdx = wins.indexOf(Math.max(...wins))
  const winner = planets[overallWinIdx]
  const winnerColor = PLANET_COLORS[overallWinIdx]

  return (
    <div data-reveal="up" data-d="2" className="compare-verdict-grid" style={{
      display: 'grid',
      gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1fr)',
      gap: 48,
      alignItems: 'start',
    }}>
      <div>
        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: 10,
          color: 'var(--text-dim)', letterSpacing: 2, textTransform: 'uppercase',
          marginBottom: 12,
        }}>
          Most Earth-like Overall
        </div>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 18,
          padding: '20px 24px',
          border: `1px solid ${winnerColor.stroke}`,
          background: winnerColor.fill,
          boxShadow: `0 0 28px ${winnerColor.glow}`,
        }}>
          <Crown size={28} style={{ color: winnerColor.stroke }} />
          <div>
            <div style={{
              fontFamily: 'var(--font-astra)', fontSize: 28, fontWeight: 600,
              letterSpacing: '0.02em',
              color: 'var(--text-primary)',
            }}>
              {winner.pl_name}
            </div>
            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: 11,
              color: 'var(--text-muted)', letterSpacing: 1.5, textTransform: 'uppercase',
              marginTop: 4,
            }}>
              {wins[overallWinIdx]} / {evaluable} categories won
            </div>
          </div>
        </div>
      </div>

      <div>
        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: 10,
          color: 'var(--text-dim)', letterSpacing: 2, textTransform: 'uppercase',
          marginBottom: 12,
        }}>
          Wins by lane
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {planets.map((p, idx) => {
            const c = PLANET_COLORS[idx]
            const w = wins[idx]
            const ratio = evaluable > 0 ? w / evaluable : 0
            return (
              <div key={p.id} className="compare-verdict-row" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 120px) minmax(80px, 1fr) 60px', gap: 12, alignItems: 'center' }}>
                <span style={{
                  fontFamily: 'var(--font-mono)', fontSize: 11,
                  color: c.stroke, letterSpacing: 1, textTransform: 'uppercase',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {p.pl_name}
                </span>
                <div style={{ position: 'relative', height: 8, border: '1px solid var(--border-hud)' }}>
                  <div style={{
                    position: 'absolute', left: 0, top: 0, bottom: 0,
                    width: `${ratio * 100}%`,
                    background: c.stroke,
                    boxShadow: `0 0 8px ${c.glow}`,
                  }} />
                </div>
                <span style={{
                  fontFamily: 'var(--font-mono)', fontSize: 11,
                  color: 'var(--text-primary)', textAlign: 'right',
                }}>
                  {w} / {evaluable}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/* ─────────── Section / SectionHeader ─────────── */

function Section({ children, padding }: { children: React.ReactNode; padding: string }) {
  return (
    <section style={{ position: 'relative', padding, zIndex: 2 }}>
      <div style={{ maxWidth: 'var(--max-w)', margin: '0 auto' }}>
        {children}
      </div>
    </section>
  )
}

function SectionHeader({ code, label }: { code: string; label: string }) {
  return (
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
  )
}

/* ─────────── Empty state ─────────── */

function EmptyState() {
  return (
    <div style={{
      minHeight: '100vh', paddingTop: 56,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '0 var(--gutter)',
    }}>
      <div style={{
        maxWidth: 720, textAlign: 'center',
        position: 'relative',
        padding: '64px 48px',
        border: '1px dashed var(--border-hud)',
      }}>
        <CornerBrackets size={12} inset={-1} color="var(--hud-line)" thickness={1} />

        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: 10,
          color: 'var(--text-dim)', letterSpacing: 2.5, textTransform: 'uppercase',
          marginBottom: 18,
        }}>
          // Compare · Empty Bin
        </div>

        <h1 style={{
          fontFamily: 'var(--font-astra)',
          fontSize: 'clamp(40px, 6vw, 80px)',
          fontWeight: 600, lineHeight: 0.95,
          letterSpacing: '0.01em',
          color: 'var(--text-primary)',
          margin: 0,
        }}>
          No targets{' '}
          <span style={{
            fontFamily: 'var(--font-display)',
            fontStyle: 'italic',
            fontWeight: 300,
            color: 'var(--text-muted)',
          }}>
            pinned.
          </span>
        </h1>

        <p style={{
          fontFamily: 'var(--font-body)', fontSize: 16, lineHeight: 1.7,
          color: 'var(--text-muted)',
          margin: '24px auto 32px',
          maxWidth: '46ch',
        }}>
          Pin up to 4 planets from anywhere — Explore, Catalog or the Featured grid —
          and they'll line up here side by side.
        </p>

        <Barcode seed="empty" bars={48} height={20} style={{ marginBottom: 32 }} />

        <Link
          to="/explore"
          className="hud-cta-primary"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            padding: '14px 32px',
            background: 'var(--hud-cyan)', color: 'var(--bg-void)',
            fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600,
            letterSpacing: 2, textTransform: 'uppercase', textDecoration: 'none',
            clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)',
          }}
        >
          <ArrowLeft size={13} strokeWidth={2.5} />
          Pick Targets in Explore
        </Link>
      </div>
    </div>
  )
}
