import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { generateComparison } from '../utils/planetDescriptions'
import { formatNumber, formatTemperature } from '../utils/planetVisuals'
import type { Exoplanet } from '../data/types'
import { ACCENT } from '../constants/colors'

// Earth-like reference values for deciding which planet "wins" on habitability-related metrics
const EARTH_REFS: Record<string, number> = {
  habitability: 100,
  temperature: 288,
  radius: 1.0,
  mass: 1.0,
  density: 5.51,
  orbitalPeriod: 365.25,
  insolation: 1.0,
  distance: 0,
}

interface MetricDef {
  label: string
  key: string
  getValue: (p: Exoplanet) => number | null
  format: (v: number | null) => string
  earthLike: boolean
}

const METRICS: MetricDef[] = [
  {
    label: 'Habitability Score',
    key: 'habitability',
    getValue: (p) => p.habitability_score,
    format: (v) => (v !== null ? v.toFixed(1) : '--'),
    earthLike: true,
  },
  {
    label: 'Temperature',
    key: 'temperature',
    getValue: (p) => p.pl_eqt,
    format: (v) => (v !== null ? `${v.toFixed(0)} K` : '--'),
    earthLike: true,
  },
  {
    label: 'Radius (R_Earth)',
    key: 'radius',
    getValue: (p) => p.pl_rade,
    format: (v) => formatNumber(v),
    earthLike: true,
  },
  {
    label: 'Mass (M_Earth)',
    key: 'mass',
    getValue: (p) => p.pl_masse,
    format: (v) => formatNumber(v),
    earthLike: true,
  },
  {
    label: 'Density (g/cm3)',
    key: 'density',
    getValue: (p) => p.pl_dens,
    format: (v) => formatNumber(v),
    earthLike: true,
  },
  {
    label: 'Orbital Period (days)',
    key: 'orbitalPeriod',
    getValue: (p) => p.pl_orbper,
    format: (v) => (v !== null ? v.toFixed(1) : '--'),
    earthLike: true,
  },
  {
    label: 'Insolation (S_Earth)',
    key: 'insolation',
    getValue: (p) => p.pl_insol,
    format: (v) => formatNumber(v),
    earthLike: true,
  },
  {
    label: 'Distance (parsecs)',
    key: 'distance',
    getValue: (p) => p.sy_dist,
    format: (v) => (v !== null ? v.toFixed(1) : '--'),
    earthLike: false,
  },
]

function SearchPanel({
  label,
  query,
  onQueryChange,
  selected,
  onSelect,
  planets,
}: {
  label: string
  query: string
  onQueryChange: (q: string) => void
  selected: Exoplanet | null
  onSelect: (p: Exoplanet) => void
  planets: Exoplanet[]
}) {
  const [open, setOpen] = useState(false)

  const filtered = useMemo(() => {
    if (!query.trim()) return []
    const q = query.toLowerCase()
    return planets.filter((p) => p.pl_name.toLowerCase().includes(q)).slice(0, 12)
  }, [query, planets])

  return (
    <div
      style={{
        flex: 1,
        minWidth: 280,
        background: '#0f0f0f',
        borderRadius: 16,
        padding: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>
        {label}
      </span>

      <div style={{ position: 'relative' }}>
        <input
          type="text"
          placeholder="Search planet name..."
          value={query}
          onChange={(e) => {
            onQueryChange(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 200)}
          style={{
            width: '100%',
            padding: '10px 14px',
            borderRadius: 8,
            border: '1px solid rgba(255,255,255,0.1)',
            background: 'rgba(255,255,255,0.05)',
            color: '#fff',
            fontSize: 15,
            outline: 'none',
            boxSizing: 'border-box',
          }}
          onFocusCapture={(e) => {
            ;(e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.3)'
          }}
          onBlurCapture={(e) => {
            ;(e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.1)'
          }}
        />

        {open && filtered.length > 0 && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              marginTop: 4,
              background: '#0f0f0f',
              borderRadius: 12,
              border: '1px solid rgba(255,255,255,0.06)',
              maxHeight: 240,
              overflowY: 'auto',
              zIndex: 50,
            }}
          >
            {filtered.map((p) => (
              <div
                key={p.id}
                onMouseDown={() => {
                  onSelect(p)
                  onQueryChange(p.pl_name)
                  setOpen(false)
                }}
                style={{
                  padding: '10px 14px',
                  cursor: 'pointer',
                  color: 'rgba(255,255,255,0.6)',
                  fontSize: 14,
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
                onMouseEnter={(e) => {
                  ;(e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.04)'
                }}
                onMouseLeave={(e) => {
                  ;(e.currentTarget as HTMLDivElement).style.background = 'transparent'
                }}
              >
                <span style={{ color: '#fff' }}>{p.pl_name}</span>
                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>{p.planet_type.replace('_', ' ')}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <div
          style={{
            background: '#0f0f0f',
            borderRadius: 16,
            padding: 16,
            border: '1px solid rgba(255,255,255,0.06)',
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
          }}
        >
          <Link
            to={`/planet/${encodeURIComponent(selected.pl_name)}`}
            style={{ color: '#fff', fontSize: 18, fontWeight: 700, textDecoration: 'none' }}
          >
            {selected.pl_name}
          </Link>
          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>
            Type: <span style={{ color: 'rgba(255,255,255,0.6)' }}>{selected.planet_type.replace('_', ' ')}</span>
          </span>
          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>
            Habitability:{' '}
            <span style={{ color: '#fff', fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>
              {selected.habitability_score.toFixed(1)} / 100
            </span>
          </span>
        </div>
      )}
    </div>
  )
}

function ComparisonBar({
  metric,
  planetA,
  planetB,
}: {
  metric: MetricDef
  planetA: Exoplanet
  planetB: Exoplanet
}) {
  const valA = metric.getValue(planetA)
  const valB = metric.getValue(planetB)

  if (valA === null && valB === null) {
    return (
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          alignItems: 'center',
          gap: 16,
          padding: '12px 0',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div style={{ textAlign: 'right', color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>--</div>
        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: 600, minWidth: 160, textAlign: 'center' }}>
          {metric.label}
        </div>
        <div style={{ textAlign: 'left', color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>--</div>
      </div>
    )
  }

  const a = valA ?? 0
  const b = valB ?? 0
  const maxVal = Math.max(Math.abs(a), Math.abs(b), 0.001)
  const barA = Math.abs(a) / maxVal
  const barB = Math.abs(b) / maxVal

  // Determine winner: for earthLike metrics, the one closer to Earth ref value wins
  let winnerA = false
  let winnerB = false
  if (valA !== null && valB !== null && metric.earthLike) {
    const ref = EARTH_REFS[metric.key] ?? 0
    const distA = Math.abs(a - ref)
    const distB = Math.abs(b - ref)
    if (distA < distB) winnerA = true
    else if (distB < distA) winnerB = true
  } else if (valA !== null && valB !== null && !metric.earthLike) {
    if (a < b) winnerA = true
    else if (b < a) winnerB = true
  }

  const colorA = winnerA ? ACCENT : 'rgba(255,255,255,0.15)'
  const colorB = winnerB ? ACCENT : 'rgba(255,255,255,0.3)'

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr auto 1fr',
        alignItems: 'center',
        gap: 16,
        padding: '12px 0',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Left side - Planet A */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10 }}>
        <span style={{ color: valA !== null ? '#fff' : 'rgba(255,255,255,0.4)', fontSize: 14, fontWeight: 500, whiteSpace: 'nowrap', fontFamily: "'JetBrains Mono', monospace" }}>
          {metric.format(valA)}
        </span>
        <div
          style={{
            width: 120,
            height: 14,
            borderRadius: 4,
            background: 'rgba(255,255,255,0.06)',
            overflow: 'hidden',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <div
            style={{
              width: `${barA * 100}%`,
              height: '100%',
              borderRadius: 4,
              background: colorA,
            }}
          />
        </div>
      </div>

      {/* Label */}
      <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: 600, minWidth: 160, textAlign: 'center' }}>
        {metric.label}
      </div>

      {/* Right side - Planet B */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: 10 }}>
        <div
          style={{
            width: 120,
            height: 14,
            borderRadius: 4,
            background: 'rgba(255,255,255,0.06)',
            overflow: 'hidden',
            display: 'flex',
            justifyContent: 'flex-start',
          }}
        >
          <div
            style={{
              width: `${barB * 100}%`,
              height: '100%',
              borderRadius: 4,
              background: colorB,
            }}
          />
        </div>
        <span style={{ color: valB !== null ? '#fff' : 'rgba(255,255,255,0.4)', fontSize: 14, fontWeight: 500, whiteSpace: 'nowrap', fontFamily: "'JetBrains Mono', monospace" }}>
          {metric.format(valB)}
        </span>
      </div>
    </div>
  )
}

function DetailRow({
  label,
  valueA,
  valueB,
}: {
  label: string
  valueA: string
  valueB: string
}) {
  const differ = valueA !== valueB
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr auto 1fr',
        gap: 16,
        padding: '10px 0',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div style={{ textAlign: 'right', color: differ ? '#fff' : 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: differ ? 700 : 400 }}>{valueA}</div>
      <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: 600, minWidth: 140, textAlign: 'center' }}>{label}</div>
      <div style={{ textAlign: 'left', color: differ ? '#fff' : 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: differ ? 700 : 400 }}>{valueB}</div>
    </div>
  )
}

export function ComparePage() {
  const planets = useStore((s) => s.planets)
  const [queryA, setQueryA] = useState('')
  const [queryB, setQueryB] = useState('')
  const [planetA, setPlanetA] = useState<Exoplanet | null>(null)
  const [planetB, setPlanetB] = useState<Exoplanet | null>(null)

  const bothSelected = planetA !== null && planetB !== null

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'transparent',
        color: '#fff',
        paddingTop: 112,
        paddingBottom: 112,
      }}
    >
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '0 24px' }}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 48, fontWeight: 700, fontFamily: "'Outfit', sans-serif", color: '#fff', margin: 0, letterSpacing: '-1.5px' }}>Compare Planets</h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, marginTop: 8, marginBottom: 0 }}>
            Search and select two exoplanets to compare their properties side by side.
          </p>
        </div>

        {/* Search Panels */}
        <div style={{ display: 'flex', gap: 24, marginBottom: 24, flexWrap: 'wrap' }}>
          <SearchPanel
            label="Planet A"
            query={queryA}
            onQueryChange={setQueryA}
            selected={planetA}
            onSelect={setPlanetA}
            planets={planets}
          />
          <SearchPanel
            label="Planet B"
            query={queryB}
            onQueryChange={setQueryB}
            selected={planetB}
            onSelect={setPlanetB}
            planets={planets}
          />
        </div>

        {/* Comparison Table */}
        {bothSelected && (
          <>
            {/* Table header */}
            <div
              style={{
                background: '#0f0f0f',
                borderRadius: 16,
                padding: 24,
                marginBottom: 24,
              }}
            >
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr auto 1fr',
                  gap: 16,
                  marginBottom: 16,
                  paddingBottom: 12,
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <div style={{ textAlign: 'right', color: '#fff', fontSize: 16, fontWeight: 700 }}>
                  {planetA.pl_name}
                </div>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, fontWeight: 600, minWidth: 160, textAlign: 'center' }}>
                  Metric
                </div>
                <div style={{ textAlign: 'left', color: '#fff', fontSize: 16, fontWeight: 700 }}>
                  {planetB.pl_name}
                </div>
              </div>

              {METRICS.map((m) => (
                <ComparisonBar key={m.key} metric={m} planetA={planetA} planetB={planetB} />
              ))}

              <div style={{ marginTop: 12, display: 'flex', gap: 20, justifyContent: 'center' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: ACCENT, display: 'inline-block' }} />
                  More Earth-like
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: 'rgba(255,255,255,0.2)', display: 'inline-block' }} />
                  Other value
                </span>
              </div>
            </div>

            {/* Comparison Text */}
            <div
              style={{
                background: '#0f0f0f',
                borderRadius: 16,
                padding: 24,
                marginBottom: 24,
              }}
            >
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginTop: 0, marginBottom: 12, fontFamily: "'Outfit', sans-serif" }}>
                Analysis
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, lineHeight: 1.7, margin: 0 }}>
                {generateComparison(planetA, planetB)}
              </p>
            </div>

            {/* Planet Details Side by Side */}
            <div
              style={{
                background: '#0f0f0f',
                borderRadius: 16,
                padding: 24,
              }}
            >
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginTop: 0, marginBottom: 16, fontFamily: "'Outfit', sans-serif" }}>
                Details
              </h2>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr auto 1fr',
                  gap: 16,
                  marginBottom: 12,
                  paddingBottom: 12,
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <div style={{ textAlign: 'right', color: '#fff', fontSize: 16, fontWeight: 700 }}>
                  {planetA.pl_name}
                </div>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, fontWeight: 600, minWidth: 140, textAlign: 'center' }}>
                  Property
                </div>
                <div style={{ textAlign: 'left', color: '#fff', fontSize: 16, fontWeight: 700 }}>
                  {planetB.pl_name}
                </div>
              </div>

              <DetailRow
                label="Planet Type"
                valueA={planetA.planet_type.replace('_', ' ')}
                valueB={planetB.planet_type.replace('_', ' ')}
              />
              <DetailRow
                label="Host Star"
                valueA={planetA.hostname}
                valueB={planetB.hostname}
              />
              <DetailRow
                label="Discovery Method"
                valueA={planetA.discoverymethod ?? '--'}
                valueB={planetB.discoverymethod ?? '--'}
              />
              <DetailRow
                label="Year Discovered"
                valueA={planetA.disc_year !== null ? String(planetA.disc_year) : '--'}
                valueB={planetB.disc_year !== null ? String(planetB.disc_year) : '--'}
              />
              <DetailRow
                label="Temperature"
                valueA={formatTemperature(planetA.pl_eqt)}
                valueB={formatTemperature(planetB.pl_eqt)}
              />
              <DetailRow
                label="Atmosphere Likely"
                valueA={planetA.has_atmosphere_likely ? 'Yes' : 'No'}
                valueB={planetB.has_atmosphere_likely ? 'Yes' : 'No'}
              />
              <DetailRow
                label="Rings"
                valueA={planetA.visual_has_rings ? 'Yes' : 'No'}
                valueB={planetB.visual_has_rings ? 'Yes' : 'No'}
              />
              <DetailRow
                label="Moons"
                valueA={String(planetA.visual_num_moons)}
                valueB={String(planetB.visual_num_moons)}
              />
              <DetailRow
                label="Habitable Zone"
                valueA={planetA.in_habitable_zone ? 'Yes' : 'No'}
                valueB={planetB.in_habitable_zone ? 'Yes' : 'No'}
              />
            </div>
          </>
        )}

        {/* Empty state when not both selected */}
        {!bothSelected && (
          <div
            style={{
              textAlign: 'center',
              padding: 60,
              color: 'rgba(255,255,255,0.4)',
              fontSize: 15,
              background: '#0f0f0f',
              borderRadius: 16,
            }}
          >
            Select two planets above to see a detailed comparison.
          </div>
        )}
      </div>
    </div>
  )
}
