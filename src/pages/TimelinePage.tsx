import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { ACCENT, ACCENT_15 } from '../constants/colors'

const MILESTONES: Record<number, string> = {
  1992: 'First exoplanet confirmed',
  1995: '51 Pegasi b - First around Sun-like star',
  2009: 'Kepler Space Telescope launched',
  2018: 'TESS Mission launched',
}

const TYPE_LABELS: Record<string, string> = {
  rocky: 'Rocky',
  super_earth: 'Super Earth',
  gas_giant: 'Gas Giant',
  hot_jupiter: 'Hot Jupiter',
  ice_giant: 'Ice Giant',
  mini_neptune: 'Mini Neptune',
  lava_world: 'Lava World',
  frozen_rocky: 'Frozen',
  unknown: 'Unknown',
}

export function TimelinePage() {
  const planets = useStore((s) => s.planets)

  const yearRange = useMemo(() => {
    const years = planets.map((p) => p.disc_year).filter((y): y is number => y !== null)
    if (years.length === 0) return { min: 1990, max: 2025 }
    return { min: Math.min(...years), max: Math.max(...years) }
  }, [planets])

  const [minYear, setMinYear] = useState(yearRange.min)
  const [maxYear, setMaxYear] = useState(yearRange.max)
  const [expandedYears, setExpandedYears] = useState<Record<number, boolean>>({})

  const yearData = useMemo(() => {
    const grouped: Record<number, typeof planets> = {}
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
        // Method breakdown
        const methods: Record<string, number> = {}
        for (const p of pls) {
          const m = p.discoverymethod ?? 'Unknown'
          methods[m] = (methods[m] || 0) + 1
        }
        // Top 3 by habitability
        const top3 = [...pls].sort((a, b) => b.habitability_score - a.habitability_score).slice(0, 3)
        return { year: y, count: pls.length, methods, top3, barFrac: pls.length / maxCount }
      })
      .sort((a, b) => b.year - a.year)

    return entries
  }, [planets, minYear, maxYear])

  const totalShown = useMemo(() => yearData.reduce((s, d) => s + d.count, 0), [yearData])

  const toggleYear = (year: number) => {
    setExpandedYears((prev) => ({ ...prev, [year]: !prev[year] }))
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'transparent' }}>
      {/* Header */}
      <header style={{ maxWidth: 1280, margin: '0 auto', padding: '112px 24px 24px' }}>
        <h2 style={{
          fontSize: 48,
          fontWeight: 700,
          fontFamily: "'Outfit', sans-serif",
          color: '#fff',
          letterSpacing: '-1.5px',
          margin: 0,
        }}>
          Timeline
        </h2>
        <p style={{ marginTop: 8, fontSize: 14, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>
          {totalShown.toLocaleString()} planets discovered across {yearData.length} years
        </p>
      </header>

      {/* Year Range Slider */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px 48px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          flexWrap: 'wrap',
        }}>
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>Year Range:</span>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#fff', fontFamily: "'JetBrains Mono', monospace", minWidth: 36, textAlign: 'center' }}>
            {minYear}
          </span>
          <input
            type="range"
            min={yearRange.min}
            max={yearRange.max}
            value={minYear}
            onChange={(e) => {
              const v = Number(e.target.value)
              setMinYear(Math.min(v, maxYear))
            }}
            style={{ flex: 1, minWidth: 120, accentColor: '#fff' }}
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
            style={{ flex: 1, minWidth: 120, accentColor: '#fff' }}
          />
          <span style={{ fontSize: 14, fontWeight: 600, color: '#fff', fontFamily: "'JetBrains Mono', monospace", minWidth: 36, textAlign: 'center' }}>
            {maxYear}
          </span>
        </div>
      </div>

      {/* Timeline */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px 112px' }}>
        <div style={{ position: 'relative', paddingLeft: 32 }}>
          {/* Vertical line */}
          <div style={{
            position: 'absolute', left: 10, top: 0, bottom: 0,
            width: 2, backgroundColor: 'rgba(255,255,255,0.06)',
          }} />

          {yearData.map((data) => {
            const isMilestone = MILESTONES[data.year]
            const isExpanded = expandedYears[data.year] || false

            return (
              <div
                key={data.year}
                style={{ marginBottom: 16, position: 'relative' }}
              >
                {/* Dot */}
                {isMilestone ? (
                  <div
                    style={{
                      position: 'absolute', left: -28, top: 14,
                      width: 12, height: 12, borderRadius: '50%',
                      backgroundColor: ACCENT,
                    }}
                  />
                ) : (
                  <div style={{
                    position: 'absolute', left: -28, top: 14,
                    width: 12, height: 12, borderRadius: '50%',
                    backgroundColor: 'rgba(255,255,255,0.2)',
                  }} />
                )}

                {/* Milestone banner */}
                {isMilestone && (
                  <div style={{
                    padding: '6px 14px',
                    backgroundColor: ACCENT_15,
                    borderRadius: 8,
                    marginBottom: 8,
                    display: 'inline-block',
                  }}>
                    <span style={{ fontSize: 12, color: ACCENT, fontWeight: 600 }}>
                      {MILESTONES[data.year]}
                    </span>
                  </div>
                )}

                {/* Year header */}
                <div
                  onClick={() => toggleYear(data.year)}
                  style={{
                    backgroundColor: '#0f0f0f',
                    borderRadius: 16,
                    padding: '14px 18px',
                    cursor: 'pointer',
                    userSelect: 'none',
                  }}
                  onMouseEnter={(e) => {
                    ;(e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.04)'
                  }}
                  onMouseLeave={(e) => {
                    ;(e.currentTarget as HTMLElement).style.backgroundColor = '#0f0f0f'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)', display: 'inline-block' }}>
                      &#9654;
                    </span>
                    <span style={{ fontSize: 18, fontWeight: 700, color: '#fff', fontFamily: "'JetBrains Mono', monospace", minWidth: 50 }}>
                      {data.year}
                    </span>
                    <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>
                      {data.count} planet{data.count !== 1 ? 's' : ''}
                    </span>
                    <div style={{ flex: 1, marginLeft: 8 }}>
                      <div style={{
                        height: 8, borderRadius: 4,
                        backgroundColor: 'rgba(255,255,255,0.06)',
                        overflow: 'hidden',
                      }}>
                        <div style={{
                          width: `${data.barFrac * 100}%`,
                          height: '100%',
                          backgroundColor: 'rgba(255,255,255,0.1)',
                          borderRadius: 4,
                        }} />
                      </div>
                    </div>
                  </div>

                  {/* Method breakdown - simple text */}
                  <div style={{ marginTop: 10, paddingLeft: 25, fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
                    {Object.entries(data.methods)
                      .sort((a, b) => b[1] - a[1])
                      .map(([method, count]) => `${method}: ${count}`)
                      .join(' \u00B7 ')}
                  </div>
                </div>

                {/* Expanded: top 3 planets */}
                {isExpanded && (
                  <div style={{
                    marginTop: 8, marginLeft: 25,
                    display: 'flex', flexWrap: 'wrap', gap: 10,
                  }}>
                    {data.top3.map((p) => (
                      <Link
                        key={p.id}
                        to={`/planet/${encodeURIComponent(p.pl_name)}`}
                        style={{ textDecoration: 'none', flex: '1 1 260px', maxWidth: 380 }}
                      >
                        <div
                          style={{
                            backgroundColor: '#0f0f0f',
                            borderRadius: 16,
                            padding: 14,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                          }}
                          onMouseEnter={(e) => {
                            ;(e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.04)'
                          }}
                          onMouseLeave={(e) => {
                            ;(e.currentTarget as HTMLElement).style.backgroundColor = '#0f0f0f'
                          }}
                        >
                          <div style={{
                            width: 36, height: 36, borderRadius: '50%',
                            backgroundColor: 'rgba(255,255,255,0.06)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 14, fontWeight: 700,
                            color: '#fff',
                            fontFamily: "'JetBrains Mono', monospace",
                          }}>
                            {p.habitability_score.toFixed(0)}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {p.pl_name}
                            </div>
                            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
                              {TYPE_LABELS[p.planet_type] || p.planet_type}
                              {p.pl_eqt !== null ? ` \u00B7 ${p.pl_eqt.toFixed(0)} K` : ''}
                              {p.discoverymethod ? ` \u00B7 ${p.discoverymethod}` : ''}
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )
          })}

          {yearData.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(255,255,255,0.4)' }}>
              No discoveries found in the selected year range.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
