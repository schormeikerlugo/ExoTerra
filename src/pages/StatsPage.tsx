import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../store/useStore'

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

export function StatsPage() {
  const planets = useStore((s) => s.planets)

  const stats = useMemo(() => {
    const total = planets.length
    const habitableZone = planets.filter((p) => p.in_habitable_zone).length
    const avgScore =
      total > 0
        ? planets.reduce((sum, p) => sum + p.habitability_score, 0) / total
        : 0
    const methods = new Set(planets.map((p) => p.discoverymethod).filter(Boolean))

    // Type distribution
    const typeCounts: Record<string, number> = {}
    for (const p of planets) {
      typeCounts[p.planet_type] = (typeCounts[p.planet_type] || 0) + 1
    }

    // Discovery methods
    const methodCounts: Record<string, number> = {}
    for (const p of planets) {
      const m = p.discoverymethod ?? 'Unknown'
      methodCounts[m] = (methodCounts[m] || 0) + 1
    }
    const sortedMethods = Object.entries(methodCounts).sort((a, b) => b[1] - a[1])

    // Discoveries by year
    const yearCounts: Record<number, number> = {}
    for (const p of planets) {
      if (p.disc_year !== null) {
        yearCounts[p.disc_year] = (yearCounts[p.disc_year] || 0) + 1
      }
    }
    const years = Object.keys(yearCounts)
      .map(Number)
      .sort((a, b) => a - b)

    // Extremes
    const withTemp = planets.filter((p) => p.pl_eqt !== null)
    const hottest = withTemp.length > 0 ? withTemp.reduce((a, b) => (a.pl_eqt! > b.pl_eqt! ? a : b)) : null
    const coldest = withTemp.length > 0 ? withTemp.reduce((a, b) => (a.pl_eqt! < b.pl_eqt! ? a : b)) : null

    const withRadius = planets.filter((p) => p.pl_rade !== null)
    const largest = withRadius.length > 0 ? withRadius.reduce((a, b) => (a.pl_rade! > b.pl_rade! ? a : b)) : null
    const smallest = withRadius.length > 0 ? withRadius.reduce((a, b) => (a.pl_rade! < b.pl_rade! ? a : b)) : null

    const withMass = planets.filter((p) => p.pl_masse !== null)
    const mostMassive = withMass.length > 0 ? withMass.reduce((a, b) => (a.pl_masse! > b.pl_masse! ? a : b)) : null
    const leastMassive = withMass.length > 0 ? withMass.reduce((a, b) => (a.pl_masse! < b.pl_masse! ? a : b)) : null

    const mostHabitable = planets.length > 0 ? planets.reduce((a, b) => (a.habitability_score > b.habitability_score ? a : b)) : null

    const withDist = planets.filter((p) => p.sy_dist !== null && p.sy_dist > 0)
    const closest = withDist.length > 0 ? withDist.reduce((a, b) => (a.sy_dist! < b.sy_dist! ? a : b)) : null

    // Top facilities
    const facilityCounts: Record<string, number> = {}
    for (const p of planets) {
      const f = p.disc_facility ?? 'Unknown'
      facilityCounts[f] = (facilityCounts[f] || 0) + 1
    }
    const topFacilities = Object.entries(facilityCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)

    return {
      total,
      habitableZone,
      avgScore,
      methodCount: methods.size,
      typeCounts,
      sortedMethods,
      yearCounts,
      years,
      hottest,
      coldest,
      largest,
      smallest,
      mostMassive,
      leastMassive,
      mostHabitable,
      closest,
      topFacilities,
    }
  }, [planets])

  // Donut chart calculations
  const donutData = useMemo(() => {
    const entries = Object.entries(stats.typeCounts).sort((a, b) => b[1] - a[1])
    const total = entries.reduce((sum, [, count]) => sum + count, 0)
    let cumulative = 0
    const segmentCount = entries.length
    return entries.map(([type, count], i) => {
      const start = cumulative
      cumulative += count
      // Generate opacity from 0.4 (top) down to 0.1 (bottom)
      const opacity = 0.4 - (i / Math.max(segmentCount - 1, 1)) * 0.3
      return {
        type,
        count,
        startAngle: (start / total) * 360,
        endAngle: (cumulative / total) * 360,
        percentage: ((count / total) * 100).toFixed(1),
        fill: `rgba(255,255,255,${Math.max(opacity, 0.1).toFixed(2)})`,
      }
    })
  }, [stats.typeCounts])

  // Bar chart max for discovery methods
  const maxMethodCount = stats.sortedMethods.length > 0 ? stats.sortedMethods[0][1] : 1

  // Year chart max
  const maxYearCount = stats.years.length > 0
    ? Math.max(...stats.years.map((y) => stats.yearCounts[y]))
    : 1

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
          Statistics
        </h2>
      </header>

      {/* Summary stats - inline text row */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px 112px' }}>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 32,
          alignItems: 'baseline',
        }}>
          <SummaryStat label="Total Planets" value={stats.total.toLocaleString()} />
          <SummaryStat label="In Habitable Zone" value={stats.habitableZone.toLocaleString()} />
          <SummaryStat label="Avg Habitability" value={stats.avgScore.toFixed(1)} />
          <SummaryStat label="Discovery Methods" value={stats.methodCount.toString()} />
        </div>
      </div>

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px 112px' }}>
        {/* Planet Type Distribution */}
        <Section title="Planet Type Distribution">
          <div style={{ display: 'flex', gap: 40, flexWrap: 'wrap', alignItems: 'center' }}>
            <svg width={240} height={240} viewBox="0 0 240 240">
              {donutData.map((d) => {
                const r = 100
                const ir = 60
                const cx = 120
                const cy = 120
                const startRad = ((d.startAngle - 90) * Math.PI) / 180
                const endRad = ((d.endAngle - 90) * Math.PI) / 180
                const largeArc = d.endAngle - d.startAngle > 180 ? 1 : 0

                const x1 = cx + r * Math.cos(startRad)
                const y1 = cy + r * Math.sin(startRad)
                const x2 = cx + r * Math.cos(endRad)
                const y2 = cy + r * Math.sin(endRad)
                const ix1 = cx + ir * Math.cos(endRad)
                const iy1 = cy + ir * Math.sin(endRad)
                const ix2 = cx + ir * Math.cos(startRad)
                const iy2 = cy + ir * Math.sin(startRad)

                const path = [
                  `M ${x1} ${y1}`,
                  `A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`,
                  `L ${ix1} ${iy1}`,
                  `A ${ir} ${ir} 0 ${largeArc} 0 ${ix2} ${iy2}`,
                  'Z',
                ].join(' ')

                return (
                  <path
                    key={d.type}
                    d={path}
                    fill={d.fill}
                    stroke="#000"
                    strokeWidth={2}
                  />
                )
              })}
              <text x={120} y={115} textAnchor="middle" fill="#fff" fontSize={24} fontWeight={700} fontFamily="'JetBrains Mono', monospace">
                {stats.total.toLocaleString()}
              </text>
              <text x={120} y={135} textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize={11}>
                planets
              </text>
            </svg>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {donutData.map((d) => (
                <div key={d.type} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 14, height: 14, borderRadius: 3,
                    backgroundColor: d.fill,
                  }} />
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', minWidth: 110 }}>
                    {TYPE_LABELS[d.type] || d.type}
                  </span>
                  <span style={{ fontSize: 13, color: '#fff', fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>
                    {d.count.toLocaleString()}
                  </span>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
                    ({d.percentage}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Section>

        {/* Discovery Methods */}
        <Section title="Discovery Methods">
          <svg width="100%" height={stats.sortedMethods.length * 36 + 10} viewBox={`0 0 800 ${stats.sortedMethods.length * 36 + 10}`}>
            {stats.sortedMethods.map(([method, count], i) => {
              const barWidth = (count / maxMethodCount) * 500
              const y = i * 36 + 5
              return (
                <g key={method}>
                  <text x={0} y={y + 18} fill="rgba(255,255,255,0.3)" fontSize={12} dominantBaseline="middle">
                    {method}
                  </text>
                  <rect
                    x={220}
                    y={y + 4}
                    width={barWidth}
                    height={22}
                    rx={4}
                    fill="rgba(255,255,255,0.15)"
                  />
                  <text
                    x={220 + barWidth + 8}
                    y={y + 18}
                    fill="#fff"
                    fontSize={12}
                    fontWeight={600}
                    fontFamily="'JetBrains Mono', monospace"
                    dominantBaseline="middle"
                  >
                    {count.toLocaleString()}
                  </text>
                </g>
              )
            })}
          </svg>
        </Section>

        {/* Discoveries by Year */}
        <Section title="Discoveries by Year">
          {stats.years.length > 0 && (() => {
            const chartWidth = 800
            const chartHeight = 300
            const padding = { top: 20, right: 20, bottom: 40, left: 50 }
            const plotWidth = chartWidth - padding.left - padding.right
            const plotHeight = chartHeight - padding.top - padding.bottom
            const barWidth = Math.max(2, Math.min(12, plotWidth / stats.years.length - 2))

            return (
              <svg width="100%" viewBox={`0 0 ${chartWidth} ${chartHeight}`} style={{ overflow: 'visible' }}>
                {/* Y axis grid lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
                  const y = padding.top + plotHeight * (1 - frac)
                  const val = Math.round(maxYearCount * frac)
                  return (
                    <g key={frac}>
                      <line
                        x1={padding.left}
                        y1={y}
                        x2={chartWidth - padding.right}
                        y2={y}
                        stroke="rgba(255,255,255,0.04)"
                        strokeWidth={1}
                      />
                      <text x={padding.left - 8} y={y + 4} textAnchor="end" fill="rgba(255,255,255,0.3)" fontSize={10} fontFamily="'JetBrains Mono', monospace">
                        {val}
                      </text>
                    </g>
                  )
                })}

                {/* Bars */}
                {stats.years.map((year, i) => {
                  const count = stats.yearCounts[year]
                  const barHeight = (count / maxYearCount) * plotHeight
                  const x = padding.left + (i / stats.years.length) * plotWidth
                  const y = padding.top + plotHeight - barHeight
                  return (
                    <g key={year}>
                      <rect
                        x={x}
                        y={y}
                        width={barWidth}
                        height={barHeight}
                        rx={2}
                        fill="rgba(255,255,255,0.15)"
                      />
                      {/* Show year labels for every ~5th year */}
                      {(i % Math.max(1, Math.floor(stats.years.length / 20)) === 0) && (
                        <text
                          x={x + barWidth / 2}
                          y={chartHeight - padding.bottom + 18}
                          textAnchor="middle"
                          fill="rgba(255,255,255,0.3)"
                          fontSize={9}
                          fontFamily="'JetBrains Mono', monospace"
                          transform={`rotate(-45, ${x + barWidth / 2}, ${chartHeight - padding.bottom + 18})`}
                        >
                          {year}
                        </text>
                      )}
                    </g>
                  )
                })}
              </svg>
            )
          })()}
        </Section>

        {/* Extremes Grid */}
        <Section title="Record Holders">
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 12,
          }}>
            {stats.hottest && (
              <ExtremeCard
                label="Hottest Planet"
                planet={stats.hottest.pl_name}
                value={`${stats.hottest.pl_eqt!.toLocaleString()} K`}
              />
            )}
            {stats.coldest && (
              <ExtremeCard
                label="Coldest Planet"
                planet={stats.coldest.pl_name}
                value={`${stats.coldest.pl_eqt!.toLocaleString()} K`}
              />
            )}
            {stats.largest && (
              <ExtremeCard
                label="Largest Planet"
                planet={stats.largest.pl_name}
                value={`${stats.largest.pl_rade!.toFixed(2)} R Earth`}
              />
            )}
            {stats.smallest && (
              <ExtremeCard
                label="Smallest Planet"
                planet={stats.smallest.pl_name}
                value={`${stats.smallest.pl_rade!.toFixed(2)} R Earth`}
              />
            )}
            {stats.mostMassive && (
              <ExtremeCard
                label="Most Massive"
                planet={stats.mostMassive.pl_name}
                value={`${stats.mostMassive.pl_masse!.toLocaleString()} M Earth`}
              />
            )}
            {stats.leastMassive && (
              <ExtremeCard
                label="Least Massive"
                planet={stats.leastMassive.pl_name}
                value={`${stats.leastMassive.pl_masse!.toFixed(4)} M Earth`}
              />
            )}
            {stats.mostHabitable && (
              <ExtremeCard
                label="Most Habitable"
                planet={stats.mostHabitable.pl_name}
                value={`Score: ${stats.mostHabitable.habitability_score.toFixed(1)}`}
              />
            )}
            {stats.closest && (
              <ExtremeCard
                label="Closest to Us"
                planet={stats.closest.pl_name}
                value={`${stats.closest.sy_dist!.toFixed(2)} pc (${(stats.closest.sy_dist! * 3.26).toFixed(2)} ly)`}
              />
            )}
          </div>
        </Section>

        {/* Top Facilities */}
        <Section title="Top Discovery Facilities">
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {stats.topFacilities.map(([facility, count], i) => (
              <div
                key={facility}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  padding: '14px 16px',
                  borderBottom: i < stats.topFacilities.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                }}
                onMouseEnter={(e) => {
                  ;(e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.04)'
                }}
                onMouseLeave={(e) => {
                  ;(e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'
                }}
              >
                <span style={{
                  width: 28, height: 28, borderRadius: 8,
                  backgroundColor: 'rgba(255,255,255,0.06)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 700, color: '#fff',
                  fontFamily: "'JetBrains Mono', monospace",
                }}>
                  {i + 1}
                </span>
                <span style={{ flex: 1, fontSize: 14, color: 'rgba(255,255,255,0.6)' }}>
                  {facility}
                </span>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#fff', fontFamily: "'JetBrains Mono', monospace" }}>
                  {count.toLocaleString()}
                </span>
                <div style={{
                  width: 120, height: 6, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 3,
                  overflow: 'hidden',
                }}>
                  <div style={{
                    width: `${(count / stats.topFacilities[0][1]) * 100}%`,
                    height: '100%',
                    backgroundColor: 'rgba(255,255,255,0.15)',
                    borderRadius: 3,
                  }} />
                </div>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </div>
  )
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 8 }}>
      <span style={{ fontSize: 32, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: '#fff' }}>
        {value}
      </span>
      <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>
        {label}
      </span>
    </span>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 112 }}>
      <h3 style={{
        fontSize: 20, fontWeight: 600, color: '#fff',
        fontFamily: "'Outfit', sans-serif",
        marginBottom: 24, paddingBottom: 12,
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        {title}
      </h3>
      {children}
    </section>
  )
}

function ExtremeCard({ label, planet, value }: { label: string; planet: string; value: string }) {
  return (
    <Link
      to={`/explore/${encodeURIComponent(planet)}`}
      style={{ textDecoration: 'none' }}
    >
      <div
        style={{
          backgroundColor: '#0f0f0f',
          borderRadius: 16,
          padding: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}
        onMouseEnter={(e) => {
          ;(e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.04)'
        }}
        onMouseLeave={(e) => {
          ;(e.currentTarget as HTMLElement).style.backgroundColor = '#0f0f0f'
        }}
      >
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
          {label}
        </div>
        <div style={{ fontSize: 15, fontWeight: 600, color: '#fff', marginTop: 2 }}>
          {planet}
        </div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', fontFamily: "'JetBrains Mono', monospace", marginTop: 2 }}>
          {value}
        </div>
      </div>
    </Link>
  )
}
