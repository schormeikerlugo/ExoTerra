import { useMemo, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
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

export function StatsPage() {
  const planets = useStore((s) => s.planets)
  useReveal()

  const stats = useMemo(() => {
    const total = planets.length
    const habitableZone = planets.filter((p) => p.in_habitable_zone).length
    const avgScore = total > 0 ? planets.reduce((s, p) => s + p.habitability_score, 0) / total : 0
    const methods = new Set(planets.map((p) => p.discoverymethod).filter(Boolean))
    const hosts = new Set(planets.map((p) => p.hostname)).size

    // Type distribution
    const typeCounts: Record<string, number> = {}
    planets.forEach((p) => { typeCounts[p.planet_type] = (typeCounts[p.planet_type] || 0) + 1 })
    const typeDistribution = Object.keys(TYPE_LABELS)
      .map((t) => ({
        type: t,
        label: TYPE_LABELS[t] ?? t,
        count: typeCounts[t] ?? 0,
        percent: total > 0 ? ((typeCounts[t] ?? 0) / total) * 100 : 0,
      }))
      .filter((d) => d.count > 0)
      .sort((a, b) => b.count - a.count)

    // Method distribution
    const methodCounts: Record<string, number> = {}
    planets.forEach((p) => {
      const m = p.discoverymethod ?? 'Unknown'
      methodCounts[m] = (methodCounts[m] || 0) + 1
    })
    const sortedMethods = Object.entries(methodCounts).sort((a, b) => b[1] - a[1])

    // Year distribution
    const yearCounts: Record<number, number> = {}
    planets.forEach((p) => {
      if (p.disc_year !== null) yearCounts[p.disc_year] = (yearCounts[p.disc_year] || 0) + 1
    })
    const allYears = Object.keys(yearCounts).map(Number).sort((a, b) => a - b)
    const minYear = allYears[0] ?? 1995
    const maxYear = allYears[allYears.length - 1] ?? new Date().getFullYear()
    const yearDistribution: { year: number; count: number }[] = []
    for (let y = minYear; y <= maxYear; y++) {
      yearDistribution.push({ year: y, count: yearCounts[y] || 0 })
    }
    const peakYear = yearDistribution.reduce((b, c) => c.count > b.count ? c : b, yearDistribution[0] ?? { year: 0, count: 0 })

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

    const mostHabitable = planets.length > 0
      ? planets.reduce((a, b) => (a.habitability_score > b.habitability_score ? a : b))
      : null

    const withDist = planets.filter((p) => p.sy_dist !== null && p.sy_dist > 0)
    const closest = withDist.length > 0 ? withDist.reduce((a, b) => (a.sy_dist! < b.sy_dist! ? a : b)) : null
    const farthest = withDist.length > 0 ? withDist.reduce((a, b) => (a.sy_dist! > b.sy_dist! ? a : b)) : null

    // Facilities
    const facilityCounts: Record<string, number> = {}
    planets.forEach((p) => {
      const f = p.disc_facility ?? 'Unknown'
      facilityCounts[f] = (facilityCounts[f] || 0) + 1
    })
    const topFacilities = Object.entries(facilityCounts).sort((a, b) => b[1] - a[1]).slice(0, 10)

    return {
      total, habitableZone, avgScore, methodCount: methods.size, hosts,
      typeDistribution, sortedMethods, yearDistribution, peakYear, minYear, maxYear,
      hottest, coldest, largest, smallest, mostMassive, leastMassive, mostHabitable,
      closest, farthest, topFacilities,
    }
  }, [planets])

  if (planets.length === 0) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', paddingTop: 56,
        color: 'var(--text-muted)',
        fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase',
      }}>
        Loading archive…
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', paddingTop: 56, position: 'relative' }}>
      <PageMeta
        title="Archive Stats"
        description={`Aggregate readouts of the exoplanet archive: ${stats.total.toLocaleString()} confirmed planets, ${stats.habitableZone.toLocaleString()} in habitable zones, distribution by class and detection protocol, plus record holders for size, temperature and habitability.`}
      />
      {/* ─── Hero strip ─── */}
      <section style={{ padding: '96px var(--gutter) 60px', position: 'relative' }}>
        <RegistrationField seed="stats-hero" density="medium" opacity={0.4} hideMobile inset={32} />
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
                STATS
              </span>
              <span style={{ width: 32, height: 1, background: 'var(--hud-line)' }} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', letterSpacing: 2.5, textTransform: 'uppercase' }}>
                Mission Control · Archive Statistics
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
              <TrackingCode seed={`stats-${stats.total}`} variant="hex" />
              <span data-tail-barcode><Barcode seed={`stats-${stats.total}`} bars={36} height={18} /></span>
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
            Archive{' '}
            <span style={{
              fontFamily: 'var(--font-display)',
              fontStyle: 'italic',
              fontWeight: 300,
              letterSpacing: '-0.01em',
              color: 'var(--text-muted)',
            }}>
              readout.
            </span>
          </h1>
          <p data-reveal="up" data-d="3" style={{
            fontFamily: 'var(--font-body)', fontSize: 16, lineHeight: 1.7,
            color: 'var(--text-muted)',
            margin: '24px 0 0', maxWidth: '64ch',
          }}>
            Live aggregates of every confirmed exoplanet in the archive — class breakdowns,
            detection protocols, discovery cadence, and the records that anchor each axis of
            extreme. Pulled directly from the Supabase mirror, no caching.
          </p>
        </div>
      </section>

      {/* ─── Sec 01 · Mission counters ─── */}
      <Section code="01" label="Mission Counters">
        <div className="stats-counters" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: 14,
        }}>
          {[
            { code: 'UNIT_01', label: 'Total Planets',     value: stats.total.toLocaleString(),         status: 'live' as const },
            { code: 'UNIT_02', label: 'Habitable Zone',    value: stats.habitableZone.toLocaleString(), status: 'live' as const },
            { code: 'UNIT_03', label: 'Avg Habitability',  value: stats.avgScore.toFixed(1),            status: 'idle' as const },
            { code: 'UNIT_04', label: 'Detection Methods', value: stats.methodCount.toString(),         status: 'idle' as const },
            { code: 'UNIT_05', label: 'Host Systems',      value: stats.hosts.toLocaleString(),         status: 'idle' as const },
          ].map((u, i) => (
            <div key={u.code} data-reveal="up" data-d={Math.min(i + 1, 8).toString()}>
              <CounterPanel {...u} seed={`stats-counter-${i}`} />
            </div>
          ))}
        </div>
      </Section>

      {/* ─── Sec 02 · Class distribution ─── */}
      <Section code="02" label="Class Distribution">
        <p data-reveal="up" style={{
          fontFamily: 'var(--font-body)', fontSize: 15, lineHeight: 1.7,
          color: 'var(--text-muted)',
          margin: '0 0 36px', maxWidth: '60ch',
        }}>
          The eight planet classes ordered by archive frequency. Detection bias favors the
          large and hot — the leader sits at {stats.typeDistribution[0]?.percent.toFixed(0)}% of every confirmed entry.
        </p>
        <div data-reveal="up" data-d="2" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {stats.typeDistribution.map((row, i) => {
            const max = stats.typeDistribution[0]?.count ?? 1
            const fillPct = (row.count / max) * 100
            const isLeader = i === 0
            return (
              <div
                key={row.type}
                data-reveal="up"
                data-d={Math.min(i + 1, 8).toString()}
                className="stats-row"
              >
                <span className="stats-row-rank">
                  {(i + 1).toString().padStart(2, '0')}
                </span>
                <span className="stats-row-label" style={{
                  color: isLeader ? 'var(--hud-cyan)' : 'var(--text-primary)',
                }}>
                  {row.label}
                </span>
                <div className="stats-row-bar">
                  <div style={{
                    position: 'absolute', left: 0, top: 0, bottom: 0,
                    width: `${fillPct}%`,
                    background: isLeader
                      ? 'linear-gradient(to right, var(--hud-cyan-glow), var(--hud-cyan))'
                      : 'linear-gradient(to right, rgba(255,255,255,0.12), rgba(255,255,255,0.42))',
                    boxShadow: isLeader ? '0 0 8px var(--hud-cyan-glow)' : 'none',
                  }} />
                  {[25, 50, 75].map((p) => (
                    <span key={p} style={{
                      position: 'absolute', left: `${p}%`, top: '25%', bottom: '25%',
                      width: 1, background: 'var(--border-hud-strong)',
                    }} />
                  ))}
                </div>
                <span className="stats-row-count">
                  {row.count.toLocaleString()}
                </span>
                <span className="stats-row-percent">
                  {row.percent.toFixed(1)}%
                </span>
              </div>
            )
          })}
        </div>
      </Section>

      {/* ─── Sec 03 · Detection protocols ─── */}
      <Section code="03" label="Detection Protocols">
        <p data-reveal="up" style={{
          fontFamily: 'var(--font-body)', fontSize: 15, lineHeight: 1.7,
          color: 'var(--text-muted)',
          margin: '0 0 36px', maxWidth: '60ch',
        }}>
          Six observational techniques produced every confirmed exoplanet. Transit dominates
          because it scales — Kepler and TESS sweep thousands of stars at once.
        </p>
        <div data-reveal="up" data-d="2" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {stats.sortedMethods.map(([method, count], i) => {
            const max = stats.sortedMethods[0]?.[1] ?? 1
            const fillPct = (count / max) * 100
            const percent = stats.total > 0 ? (count / stats.total) * 100 : 0
            const isLeader = i === 0
            return (
              <div
                key={method}
                data-reveal="up"
                data-d={Math.min(i + 1, 8).toString()}
                className="stats-row"
              >
                <span className="stats-row-rank">
                  {(i + 1).toString().padStart(2, '0')}
                </span>
                <span className="stats-row-label" style={{
                  color: isLeader ? 'var(--hud-cyan)' : 'var(--text-primary)',
                }}>
                  {method}
                </span>
                <div className="stats-row-bar">
                  <div style={{
                    position: 'absolute', left: 0, top: 0, bottom: 0,
                    width: `${fillPct}%`,
                    background: isLeader
                      ? 'linear-gradient(to right, var(--hud-cyan-glow), var(--hud-cyan))'
                      : 'linear-gradient(to right, rgba(255,255,255,0.12), rgba(255,255,255,0.42))',
                    boxShadow: isLeader ? '0 0 8px var(--hud-cyan-glow)' : 'none',
                  }} />
                </div>
                <span className="stats-row-count">{count.toLocaleString()}</span>
                <span className="stats-row-percent">{percent.toFixed(1)}%</span>
              </div>
            )
          })}
        </div>
      </Section>

      {/* ─── Sec 04 · Discovery timeline ─── */}
      <Section code="04" label="Discovery Cadence">
        <div data-reveal="up" style={{
          display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)',
          gap: 48, marginBottom: 36,
        }} className="stats-cadence-head">
          <p style={{
            fontFamily: 'var(--font-body)', fontSize: 15, lineHeight: 1.7,
            color: 'var(--text-muted)', margin: 0, maxWidth: '60ch',
          }}>
            From the first confirmed detection in {stats.minYear} to today, {stats.total.toLocaleString()} planets joined
            the archive. The peak — {stats.peakYear.year} — added {stats.peakYear.count.toLocaleString()} alone.
          </p>
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16,
            paddingLeft: 24, borderLeft: '1px solid var(--border-hud)',
          }}>
            <KeyStat label="First Year" value={stats.minYear.toString()} />
            <KeyStat label="Latest Year" value={stats.maxYear.toString()} />
            <KeyStat label="Peak Year" value={stats.peakYear.year.toString()} accent />
            <KeyStat label="Peak Count" value={stats.peakYear.count.toLocaleString()} accent />
          </div>
        </div>

        <div data-reveal="up" data-d="2" className="hud-glass" style={{
          position: 'relative',
          padding: '20px 22px',
          border: '1px solid var(--border-hud)',
        }}>
          <CornerBrackets size={8} inset={-1} color="var(--hud-line)" thickness={1} />
          <YearBars data={stats.yearDistribution} peakYear={stats.peakYear.year} />
        </div>
      </Section>

      {/* ─── Sec 05 · Record holders ─── */}
      <Section code="05" label="Record Holders · Extremes of the Archive">
        <p data-reveal="up" style={{
          fontFamily: 'var(--font-body)', fontSize: 15, lineHeight: 1.7,
          color: 'var(--text-muted)',
          margin: '0 0 36px', maxWidth: '60ch',
        }}>
          Each card pins one axis of extreme — the hottest, coldest, biggest, smallest worlds
          in the catalog. Click any to open its full HUD profile.
        </p>
        <div className="stats-records-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 12,
        }}>
          {[
            { label: 'Hottest',         planet: stats.hottest,      stat: stats.hottest      ? `${stats.hottest.pl_eqt!.toLocaleString()} K`         : null, code: 'R_01' },
            { label: 'Coldest',         planet: stats.coldest,      stat: stats.coldest      ? `${stats.coldest.pl_eqt!.toLocaleString()} K`         : null, code: 'R_02' },
            { label: 'Largest',         planet: stats.largest,      stat: stats.largest      ? `${stats.largest.pl_rade!.toFixed(2)} R⊕`             : null, code: 'R_03' },
            { label: 'Smallest',        planet: stats.smallest,     stat: stats.smallest     ? `${stats.smallest.pl_rade!.toFixed(2)} R⊕`            : null, code: 'R_04' },
            { label: 'Most Massive',    planet: stats.mostMassive,  stat: stats.mostMassive  ? `${stats.mostMassive.pl_masse!.toLocaleString()} M⊕`  : null, code: 'R_05' },
            { label: 'Least Massive',   planet: stats.leastMassive, stat: stats.leastMassive ? `${stats.leastMassive.pl_masse!.toFixed(3)} M⊕`       : null, code: 'R_06' },
            { label: 'Most Habitable',  planet: stats.mostHabitable,stat: stats.mostHabitable? `${stats.mostHabitable.habitability_score.toFixed(1)} / 100` : null, code: 'R_07' },
            { label: 'Closest',         planet: stats.closest,      stat: stats.closest      ? `${stats.closest.sy_dist!.toFixed(2)} pc`             : null, code: 'R_08' },
          ].filter((r) => r.planet).map((r, i) => (
            <RecordCard key={r.code} {...r} planet={r.planet!} stat={r.stat!} idx={i} />
          ))}
        </div>
      </Section>

      {/* ─── Sec 06 · Top facilities ─── */}
      <Section code="06" label="Top Discovery Facilities">
        <p data-reveal="up" style={{
          fontFamily: 'var(--font-body)', fontSize: 15, lineHeight: 1.7,
          color: 'var(--text-muted)',
          margin: '0 0 36px', maxWidth: '60ch',
        }}>
          The ten observatories and missions that have contributed the most confirmed planets
          to the archive.
        </p>
        <div data-reveal="up" data-d="2" style={{ display: 'flex', flexDirection: 'column' }}>
          {stats.topFacilities.map(([facility, count], i) => {
            const max = stats.topFacilities[0]?.[1] ?? 1
            const fillPct = (count / max) * 100
            const percent = stats.total > 0 ? (count / stats.total) * 100 : 0
            const isLeader = i === 0
            return (
              <div
                key={facility}
                data-reveal="up"
                data-d={Math.min(i + 1, 8).toString()}
                className="stats-row stats-row--facility"
              >
                <span className="stats-row-rank">
                  {(i + 1).toString().padStart(2, '0')}
                </span>
                <span className="stats-row-label stats-row-label--facility" style={{
                  color: isLeader ? 'var(--hud-cyan)' : 'var(--text-primary)',
                }}>
                  {facility}
                </span>
                <div className="stats-row-bar">
                  <div style={{
                    position: 'absolute', left: 0, top: 0, bottom: 0,
                    width: `${fillPct}%`,
                    background: isLeader
                      ? 'linear-gradient(to right, var(--hud-cyan-glow), var(--hud-cyan))'
                      : 'linear-gradient(to right, rgba(255,255,255,0.12), rgba(255,255,255,0.42))',
                    boxShadow: isLeader ? '0 0 8px var(--hud-cyan-glow)' : 'none',
                  }} />
                </div>
                <span className="stats-row-count">{count.toLocaleString()}</span>
                <span className="stats-row-percent">{percent.toFixed(1)}%</span>
              </div>
            )
          })}
        </div>
      </Section>

      <div style={{ height: 80 }} />

      <style>{`
        .stats-row {
          display: grid;
          grid-template-columns: 32px 200px 1fr 100px 70px;
          gap: 14px;
          align-items: center;
          padding: 14px 0;
          border-bottom: 1px dashed var(--border-hud);
        }
        .stats-row:last-child { border-bottom: none; }
        .stats-row-rank {
          font-family: var(--font-mono); font-size: 10px;
          color: var(--text-dim); letter-spacing: 1.5px;
        }
        .stats-row-label {
          font-family: var(--font-hero); font-size: 13px; font-weight: 500;
          letter-spacing: 0.05em; text-transform: uppercase;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .stats-row-label--facility {
          font-family: var(--font-mono); font-size: 12px;
          letter-spacing: 0.5px; text-transform: none;
        }
        .stats-row-bar {
          position: relative; height: 12px;
          border: 1px solid var(--border-hud);
        }
        .stats-row-count {
          font-family: var(--font-mono); font-size: 14px;
          color: var(--text-primary); text-align: right;
        }
        .stats-row-percent {
          font-family: var(--font-mono); font-size: 11px;
          color: var(--text-dim); text-align: right;
        }

        @media (max-width: 1100px) {
          .stats-counters { grid-template-columns: repeat(3, 1fr) !important; }
          .stats-records-grid { grid-template-columns: repeat(3, 1fr) !important; }
        }
        @media (max-width: 768px) {
          .stats-counters { grid-template-columns: 1fr !important; }
          .stats-records-grid { grid-template-columns: 1fr !important; }
          .stats-cadence-head { grid-template-columns: 1fr !important; gap: 24px !important; }
          .stats-cadence-head > div:last-child { padding-left: 0 !important; border-left: none !important; }
          .stats-row {
            grid-template-columns: 28px 1fr auto;
            gap: 10px;
          }
          .stats-row-bar { display: none; }
          .stats-row-percent { display: none; }
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

function CounterPanel({ code, label, value, status, seed }: {
  code: string; label: string; value: string; status: 'live' | 'idle'; seed: string
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
          fontFamily: 'var(--font-mono)', fontSize: 32, fontWeight: 600,
          color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1,
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

/* ─────────── KeyStat ─────────── */

function KeyStat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{
        fontFamily: 'var(--font-mono)', fontSize: 9,
        color: 'var(--text-dim)', letterSpacing: 1.5, textTransform: 'uppercase',
      }}>
        {label}
      </span>
      <span style={{
        fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 600,
        color: accent ? 'var(--hud-cyan)' : 'var(--text-primary)',
        letterSpacing: '-0.5px',
        textShadow: accent ? '0 0 12px var(--hud-cyan-glow)' : 'none',
      }}>
        {value}
      </span>
    </div>
  )
}

/* ─────────── YearBars · simple inline timeline ─────────── */

function YearBars({ data, peakYear }: {
  data: { year: number; count: number }[]
  peakYear: number
}) {
  const max = Math.max(...data.map((d) => d.count), 1)
  return (
    <div style={{ width: '100%' }}>
      <div style={{
        display: 'flex', alignItems: 'flex-end', gap: 1,
        height: 120, paddingBottom: 4,
      }}>
        {data.map((d) => {
          const h = (d.count / max) * 100
          const isPeak = d.year === peakYear
          return (
            <div
              key={d.year}
              title={`${d.year}: ${d.count}`}
              style={{
                flex: 1,
                height: `${Math.max(h, 1)}%`,
                background: isPeak
                  ? 'var(--hud-cyan)'
                  : 'var(--hud-line-soft)',
                opacity: isPeak ? 1 : 0.65,
                minHeight: 1,
              }}
            />
          )
        })}
      </div>
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        marginTop: 8, paddingTop: 8,
        borderTop: '1px solid var(--border-hud)',
        fontFamily: 'var(--font-mono)', fontSize: 9,
        color: 'var(--text-dim)', letterSpacing: 1,
      }}>
        <span>{data[0]?.year ?? '—'}</span>
        <span style={{ color: 'var(--hud-cyan)' }}>
          PEAK · {peakYear}
        </span>
        <span>{data[data.length - 1]?.year ?? '—'}</span>
      </div>
    </div>
  )
}

/* ─────────── RecordCard ─────────── */

function RecordCard({ label, planet, stat, code, idx: _idx }: {
  label: string
  planet: Exoplanet
  stat: string
  code: string
  idx: number
}) {
  void _idx
  return (
    <Link
      to={`/explore/${encodeURIComponent(planet.pl_name)}`}
      className="hud-card"
      style={{
        position: 'relative',
        display: 'flex', flexDirection: 'column', gap: 12,
        padding: '18px 18px 16px',
        border: '1px solid var(--border-hud)',
        textDecoration: 'none', color: 'inherit',
      }}
    >
      <span className="hud-card__march" />
      <CornerBrackets size={6} inset={-1} color="var(--hud-line)" thickness={1} />

      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: 9,
          color: 'var(--text-dim)', letterSpacing: 1.5,
        }}>
          {code}
        </span>
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: 9,
          color: 'var(--hud-cyan)', letterSpacing: 1.5,
          padding: '2px 6px',
          border: '1px solid var(--border-hud-strong)',
        }}>
          {label.toUpperCase()}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ position: 'relative' }}>
          <div style={orbStyle(planet, 56)} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: 'var(--font-hero)', fontSize: 14, fontWeight: 500,
            letterSpacing: '0.04em', textTransform: 'uppercase',
            color: 'var(--text-primary)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {planet.pl_name}
          </div>
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: 10,
            color: 'var(--text-muted)', letterSpacing: 1, marginTop: 4,
          }}>
            HOST · {planet.hostname}
          </div>
        </div>
      </div>

      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
        paddingTop: 10, marginTop: 'auto',
        borderTop: '1px dashed var(--border-hud)',
      }}>
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: 9,
          color: 'var(--text-dim)', letterSpacing: 1.5, textTransform: 'uppercase',
        }}>
          Reading
        </span>
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: 14,
          color: 'var(--text-primary)',
        }}>
          {stat}
        </span>
      </div>
    </Link>
  )
}
