import { useMemo, type CSSProperties } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useStore } from '../store/useStore'
import { useReveal } from '../hooks/useReveal'
import { CornerBrackets } from '../components/HUD/CornerBrackets'
import { Barcode } from '../components/HUD/Barcode'
import { TelemetryRow } from '../components/HUD/Telemetry'
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

export function SystemPage() {
  const { hostname } = useParams<{ hostname: string }>()
  const planets = useStore((s) => s.planets)
  useReveal()

  const decodedHostname = decodeURIComponent(hostname ?? '')

  const systemPlanets = useMemo(
    () =>
      planets
        .filter((p) => p.hostname === decodedHostname)
        .sort((a, b) => (a.pl_orbsmax ?? 999) - (b.pl_orbsmax ?? 999)),
    [planets, decodedHostname],
  )

  const star = useMemo(() => {
    if (systemPlanets.length === 0) return null
    const p = systemPlanets[0]
    return {
      hostname: p.hostname,
      spectype: p.st_spectype,
      teff: p.st_teff,
      mass: p.st_mass,
      radius: p.st_rad,
      age: p.st_age,
      luminosity: p.st_lum,
    }
  }, [systemPlanets])

  const habitableCount = systemPlanets.filter((p) => p.in_habitable_zone).length
  const topScorer = systemPlanets.length > 0
    ? systemPlanets.reduce((a, b) => (a.habitability_score > b.habitability_score ? a : b))
    : null

  if (planets.length === 0) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', paddingTop: 56,
        color: 'var(--text-muted)',
        fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase',
      }}>
        Linking system…
      </div>
    )
  }

  if (systemPlanets.length === 0) {
    return (
      <div style={{ minHeight: '100vh', paddingTop: 56, position: 'relative' }}>
        <PageMeta
          title="System not found"
          description={`No archive entry matches the host star "${decodedHostname}". The name may have been retired, merged, or never confirmed.`}
        />
        <section style={{ padding: '120px var(--gutter) 60px' }}>
          <div style={{ maxWidth: 'var(--max-w)', margin: '0 auto' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 14,
              paddingBottom: 32,
              borderBottom: '1px solid var(--border-hud)',
              marginBottom: 32,
            }}>
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: 11,
                color: 'var(--hud-red)', letterSpacing: 3,
              }}>
                ERR_404
              </span>
              <span style={{ width: 32, height: 1, background: 'var(--hud-red)' }} />
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: 11,
                color: 'var(--text-muted)', letterSpacing: 2.5, textTransform: 'uppercase',
              }}>
                System Not Found
              </span>
            </div>
            <h1 style={{
              fontFamily: 'var(--font-astra)',
              fontSize: 'clamp(32px, 5vw, 64px)',
              fontWeight: 600,
              color: 'var(--text-primary)',
              margin: 0,
            }}>
              No record for "{decodedHostname}".
            </h1>
            <p style={{
              fontFamily: 'var(--font-body)', fontSize: 16,
              color: 'var(--text-muted)', margin: '20px 0 32px', maxWidth: '60ch',
            }}>
              The archive has no host star matching this identifier. It may have been renamed,
              merged, or never confirmed.
            </p>
            <Link to="/catalog" style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              padding: '14px 22px',
              border: '1px solid var(--hud-cyan)',
              color: 'var(--hud-cyan)',
              fontFamily: 'var(--font-mono)', fontSize: 11,
              letterSpacing: 2, textTransform: 'uppercase',
              textDecoration: 'none',
            }}>
              <ArrowLeft size={14} /> Back to catalog
            </Link>
          </div>
        </section>
      </div>
    )
  }

  // Orbital diagram calculations
  const orbits = systemPlanets.map((p) => p.pl_orbsmax).filter((v): v is number => v !== null && v > 0)
  const svgSize = 520
  const svgCenter = svgSize / 2
  const starRadius = 8
  const minOrbitR = 64
  const maxOrbitR = (svgSize / 2) - 36

  return (
    <div style={{ minHeight: '100vh', paddingTop: 56, position: 'relative' }}>
      <PageMeta
        title={`${decodedHostname} system`}
        description={`Host star ${decodedHostname} with ${systemPlanets.length} confirmed planet${systemPlanets.length !== 1 ? 's' : ''}${habitableCount > 0 ? `, ${habitableCount} in the habitable zone` : ''}. Spectral profile, orbital diagram (log scale), and full planet roster.`}
      />
      {/* ─── Hero strip ─── */}
      <section style={{ padding: '96px var(--gutter) 60px', position: 'relative' }}>
        <RegistrationField seed={`system-${decodedHostname}`} density="medium" opacity={0.4} hideMobile inset={32} />
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
                SYSTEM
              </span>
              <span style={{ width: 32, height: 1, background: 'var(--hud-line)' }} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', letterSpacing: 2.5, textTransform: 'uppercase' }}>
                Host Telemetry · {systemPlanets.length} planet{systemPlanets.length !== 1 ? 's' : ''}
              </span>
              {habitableCount > 0 && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginLeft: 8 }}>
                  <span style={{
                    width: 6, height: 6, borderRadius: '50%',
                    background: 'var(--hud-cyan)',
                    boxShadow: '0 0 6px var(--hud-cyan-glow)',
                    animation: 'hud-pulse 1.8s ease-in-out infinite',
                  }} />
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--hud-cyan)', letterSpacing: 2 }}>
                    HZ · {habitableCount}
                  </span>
                </span>
              )}
            </div>
            <span className="page-eyebrow-tail">
              <span data-tail-hatch><HatchFill style={{ width: 18, height: 8 }} opacity={0.4} /></span>
              <TrackingCode seed={`system-${decodedHostname}`} variant="coords" />
              <span data-tail-barcode><Barcode seed={`system-${decodedHostname}`} bars={36} height={18} /></span>
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
            {decodedHostname}{' '}
            <span style={{
              fontFamily: 'var(--font-display)',
              fontStyle: 'italic',
              fontWeight: 300,
              letterSpacing: '-0.01em',
              color: 'var(--text-muted)',
            }}>
              system.
            </span>
          </h1>
          <p data-reveal="up" data-d="3" style={{
            fontFamily: 'var(--font-body)', fontSize: 16, lineHeight: 1.7,
            color: 'var(--text-muted)',
            margin: '24px 0 0', maxWidth: '64ch',
          }}>
            Host star telemetry, an orbital readout drawn to log scale, and the full planet
            roster — every confirmed body bound to {decodedHostname}, ordered outward from the
            primary.
          </p>

          <Link to="/catalog" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            marginTop: 28,
            padding: '8px 14px',
            border: '1px solid var(--border-hud)',
            background: 'rgba(255,255,255,0.02)',
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-mono)', fontSize: 10,
            letterSpacing: 1.8, textTransform: 'uppercase',
            textDecoration: 'none',
            transition: 'all 200ms',
          }}>
            <ArrowLeft size={12} /> Back to catalog
          </Link>
        </div>
      </section>

      {/* ─── Sec 01 · Host star ─── */}
      {star && (
        <Section code="01" label="Host Star · Spectral Profile">
          <div data-reveal="up" className="hud-glass" style={{
            position: 'relative',
            border: '1px solid var(--border-hud)',
            padding: '24px 26px',
          }}>
            <CornerBrackets size={8} inset={-1} color="var(--hud-line)" thickness={1} />
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              paddingBottom: 16, marginBottom: 20,
              borderBottom: '1px solid var(--border-hud)',
            }}>
              <div style={{
                width: 14, height: 14, borderRadius: '50%',
                background: 'radial-gradient(circle at 35% 30%, #fff 0%, #ffe9b8 40%, #ffb84a 80%, #6b3500 100%)',
                boxShadow: '0 0 16px rgba(255,184,74,0.4)',
              }} />
              <span style={{
                fontFamily: 'var(--font-hero)', fontSize: 13, fontWeight: 500,
                color: 'var(--text-primary)',
                letterSpacing: '0.06em', textTransform: 'uppercase',
              }}>
                Primary · {star.hostname}
              </span>
              <span style={{ flex: 1, height: 1, background: 'var(--border-hud)', marginLeft: 8 }} />
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: 9,
                color: 'var(--text-dim)', letterSpacing: 1.5,
              }}>
                STAR_REC
              </span>
            </div>
            <div className="sys-star-grid">
              <TelemetryRow label="Spectral Type"  value={star.spectype ?? '—'} />
              <TelemetryRow label="Effective Temp" value={star.teff !== null ? star.teff.toFixed(0) : '—'} unit={star.teff !== null ? 'K' : undefined} />
              <TelemetryRow label="Stellar Mass"   value={star.mass !== null ? star.mass.toFixed(3) : '—'} unit={star.mass !== null ? 'M☉' : undefined} />
              <TelemetryRow label="Stellar Radius" value={star.radius !== null ? star.radius.toFixed(3) : '—'} unit={star.radius !== null ? 'R☉' : undefined} />
              <TelemetryRow label="Age"            value={star.age !== null ? star.age.toFixed(1) : '—'} unit={star.age !== null ? 'Gyr' : undefined} />
              <TelemetryRow label="Luminosity"     value={star.luminosity !== null ? `10^${star.luminosity.toFixed(2)}` : '—'} unit={star.luminosity !== null ? 'L☉' : undefined} />
            </div>
          </div>
        </Section>
      )}

      {/* ─── Sec 02 · Orbital diagram ─── */}
      <Section code="02" label="Orbital Diagram · Log Scale">
        <p data-reveal="up" style={{
          fontFamily: 'var(--font-body)', fontSize: 15, lineHeight: 1.7,
          color: 'var(--text-muted)', margin: '0 0 36px', maxWidth: '60ch',
        }}>
          Semi-major axes plotted logarithmically — orbits crowd the inner system in reality.
          Marker size scales with planet radius; cyan rings flag bodies in the habitable zone.
        </p>
        <div data-reveal="up" data-d="2" className="hud-glass" style={{
          position: 'relative',
          border: '1px solid var(--border-hud)',
          padding: '24px',
          display: 'flex', justifyContent: 'center',
        }}>
          <CornerBrackets size={8} inset={-1} color="var(--hud-line)" thickness={1} />

          {/* Top legend */}
          <div style={{
            position: 'absolute', top: 14, left: 18, right: 18,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            pointerEvents: 'none',
          }}>
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: 9,
              color: 'var(--text-dim)', letterSpacing: 1.5,
            }}>
              ORBITAL_MAP_v1
            </span>
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: 9,
              color: 'var(--text-dim)', letterSpacing: 1.5,
            }}>
              {systemPlanets.length} BODIES
            </span>
          </div>

          <svg
            width={svgSize}
            height={svgSize}
            viewBox={`0 0 ${svgSize} ${svgSize}`}
            style={{ maxWidth: '100%', height: 'auto', overflow: 'visible' }}
          >
            <defs>
              <radialGradient id="sys-star" cx="35%" cy="30%">
                <stop offset="0%" stopColor="#fff" />
                <stop offset="35%" stopColor="#ffe9b8" />
                <stop offset="75%" stopColor="#ffb84a" />
                <stop offset="100%" stopColor="#6b3500" />
              </radialGradient>
              <radialGradient id="sys-star-glow" cx="50%" cy="50%">
                <stop offset="0%" stopColor="rgba(255,184,74,0.5)" />
                <stop offset="100%" stopColor="rgba(255,184,74,0)" />
              </radialGradient>
            </defs>

            {/* Crosshairs through star */}
            <line x1={0} y1={svgCenter} x2={svgSize} y2={svgCenter} stroke="var(--border-hud)" strokeWidth={1} strokeDasharray="2 6" />
            <line x1={svgCenter} y1={0} x2={svgCenter} y2={svgSize} stroke="var(--border-hud)" strokeWidth={1} strokeDasharray="2 6" />

            {/* Star glow */}
            <circle cx={svgCenter} cy={svgCenter} r={28} fill="url(#sys-star-glow)" />
            <circle cx={svgCenter} cy={svgCenter} r={starRadius} fill="url(#sys-star)" />

            {/* Star label */}
            <text
              x={svgCenter}
              y={svgCenter + 24}
              textAnchor="middle"
              fill="var(--text-muted)"
              fontFamily="var(--font-mono)"
              fontSize={9}
              letterSpacing={1.5}
            >
              {star?.hostname}
            </text>

            {/* Orbits and planets */}
            {systemPlanets.map((planet, i) => {
              const orbDist = planet.pl_orbsmax
              let orbitR: number
              if (orbDist !== null && orbDist > 0 && orbits.length > 0) {
                const logMin = Math.log(Math.min(...orbits))
                const logMax = Math.log(Math.max(...orbits))
                const logRange = logMax - logMin
                const frac = logRange > 0 ? (Math.log(orbDist) - logMin) / logRange : 0.5
                orbitR = minOrbitR + frac * (maxOrbitR - minOrbitR)
              } else {
                orbitR = minOrbitR + ((i + 1) / (systemPlanets.length + 1)) * (maxOrbitR - minOrbitR)
              }

              const angle = ((i * 137.5) % 360) * (Math.PI / 180)
              const px = svgCenter + orbitR * Math.cos(angle)
              const py = svgCenter + orbitR * Math.sin(angle)
              const planetRadius = Math.max(5, Math.min(12, (planet.pl_rade ?? 1) * 2))
              const inHZ = planet.in_habitable_zone
              const labelOffsetY = py < svgCenter ? -planetRadius - 14 : planetRadius + 18
              const distLabelY = py < svgCenter ? labelOffsetY - 11 : labelOffsetY + 11

              const planetLabel = planet.pl_name.replace(planet.hostname, '').trim() || planet.pl_name

              return (
                <g key={planet.id}>
                  {/* Orbit ring */}
                  <circle
                    cx={svgCenter}
                    cy={svgCenter}
                    r={orbitR}
                    fill="none"
                    stroke={inHZ ? 'var(--hud-cyan-30)' : 'var(--border-hud-strong)'}
                    strokeWidth={1}
                    strokeDasharray={inHZ ? '4 4' : 'none'}
                  />

                  {/* Tick on orbit at planet angle */}
                  <line
                    x1={svgCenter + (orbitR - 4) * Math.cos(angle)}
                    y1={svgCenter + (orbitR - 4) * Math.sin(angle)}
                    x2={svgCenter + (orbitR + 4) * Math.cos(angle)}
                    y2={svgCenter + (orbitR + 4) * Math.sin(angle)}
                    stroke={inHZ ? 'var(--hud-cyan)' : 'var(--text-muted)'}
                    strokeWidth={1}
                  />

                  {/* Planet marker outer ring */}
                  <circle
                    cx={px}
                    cy={py}
                    r={planetRadius + 4}
                    fill="none"
                    stroke={inHZ ? 'var(--hud-cyan-50)' : 'var(--border-hud-strong)'}
                    strokeWidth={1}
                  />
                  {/* Planet marker */}
                  <circle
                    cx={px}
                    cy={py}
                    r={planetRadius}
                    fill={inHZ ? 'var(--hud-cyan)' : 'rgba(255,255,255,0.7)'}
                    style={inHZ ? { filter: 'drop-shadow(0 0 4px var(--hud-cyan-glow))' } : undefined}
                  />

                  {/* Label */}
                  <text
                    x={px}
                    y={py + labelOffsetY}
                    textAnchor="middle"
                    fill="var(--text-primary)"
                    fontFamily="var(--font-hero)"
                    fontSize={10}
                    fontWeight={500}
                    letterSpacing={0.5}
                    style={{ textTransform: 'uppercase' }}
                  >
                    {planetLabel}
                  </text>
                  {orbDist !== null && (
                    <text
                      x={px}
                      y={py + distLabelY}
                      textAnchor="middle"
                      fill="var(--text-dim)"
                      fontFamily="var(--font-mono)"
                      fontSize={8}
                      letterSpacing={1}
                    >
                      {orbDist.toFixed(orbDist < 1 ? 3 : 2)} AU
                    </text>
                  )}
                </g>
              )
            })}
          </svg>
        </div>

        {/* Diagram legend */}
        <div data-reveal="up" data-d="3" style={{
          display: 'flex', flexWrap: 'wrap', gap: 18,
          marginTop: 18,
          fontFamily: 'var(--font-mono)', fontSize: 10,
          color: 'var(--text-dim)', letterSpacing: 1.5, textTransform: 'uppercase',
        }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 8, height: 8, background: 'rgba(255,255,255,0.7)', borderRadius: '50%' }} />
            Planet
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 8, height: 8, background: 'var(--hud-cyan)', borderRadius: '50%', boxShadow: '0 0 6px var(--hud-cyan-glow)' }} />
            Habitable Zone
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              width: 14, height: 14, border: '1px solid var(--border-hud-strong)', borderRadius: '50%',
            }} />
            Orbit Ring
          </span>
        </div>
      </Section>

      {/* ─── Sec 03 · Planet roster ─── */}
      <Section code="03" label={`Planet Roster · ${systemPlanets.length} Bod${systemPlanets.length !== 1 ? 'ies' : 'y'}`}>
        <p data-reveal="up" style={{
          fontFamily: 'var(--font-body)', fontSize: 15, lineHeight: 1.7,
          color: 'var(--text-muted)', margin: '0 0 36px', maxWidth: '60ch',
        }}>
          Ordered outward from the primary. {topScorer && (
            <>The leader is{' '}
              <Link to={`/explore/${encodeURIComponent(topScorer.pl_name)}`} style={{ color: 'var(--hud-cyan)', textDecoration: 'none' }}>
                {topScorer.pl_name}
              </Link>{' '}
              at score {topScorer.habitability_score.toFixed(1)}.
            </>
          )}
        </p>
        <div className="sys-roster">
          {systemPlanets.map((planet, idx) => {
            const inHZ = planet.in_habitable_zone
            const isTop = topScorer && planet.id === topScorer.id
            return (
              <Link
                key={planet.id}
                to={`/explore/${encodeURIComponent(planet.pl_name)}`}
                data-reveal="up"
                data-d={Math.min(idx + 1, 8).toString()}
                className="sys-roster-card hud-glass"
              >
                <CornerBrackets size={6} inset={-1} color="var(--hud-line)" thickness={1} />

                {/* Header */}
                <div className="sys-card-head">
                  <div style={orbStyle(planet, 56)} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      fontFamily: 'var(--font-mono)', fontSize: 9,
                      color: 'var(--text-dim)', letterSpacing: 1.5,
                      marginBottom: 4,
                    }}>
                      <span>P_{(idx + 1).toString().padStart(2, '0')}</span>
                      <span style={{ width: 12, height: 1, background: 'var(--hud-line)' }} />
                      <span>{TYPE_LABELS[planet.planet_type] ?? planet.planet_type}</span>
                    </div>
                    <div style={{
                      fontFamily: 'var(--font-hero)', fontSize: 16, fontWeight: 500,
                      color: 'var(--text-primary)',
                      letterSpacing: '0.04em', textTransform: 'uppercase',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {planet.pl_name}
                    </div>
                  </div>
                  <div className="sys-card-score">
                    <span style={{
                      fontFamily: 'var(--font-mono)', fontSize: 8,
                      color: 'var(--text-dim)', letterSpacing: 1.5,
                    }}>
                      SCORE
                    </span>
                    <span style={{
                      fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 600,
                      color: isTop ? 'var(--hud-cyan)' : 'var(--text-primary)',
                      lineHeight: 1,
                      textShadow: isTop ? '0 0 12px var(--hud-cyan-glow)' : 'none',
                    }}>
                      {planet.habitability_score.toFixed(0)}
                    </span>
                  </div>
                </div>

                {/* Telemetry */}
                <div className="sys-card-tele">
                  <TelemetryRow label="Temperature" value={planet.pl_eqt !== null ? planet.pl_eqt.toFixed(0) : '—'} unit={planet.pl_eqt !== null ? 'K' : undefined} />
                  <TelemetryRow label="Radius"      value={planet.pl_rade !== null ? planet.pl_rade.toFixed(2) : '—'} unit={planet.pl_rade !== null ? 'R⊕' : undefined} />
                  <TelemetryRow label="Mass"        value={planet.pl_masse !== null ? planet.pl_masse.toFixed(2) : '—'} unit={planet.pl_masse !== null ? 'M⊕' : undefined} />
                </div>

                {/* Orbit row */}
                {(planet.pl_orbsmax !== null || planet.pl_orbper !== null) && (
                  <div className="sys-card-orbit">
                    {planet.pl_orbsmax !== null && (
                      <span>
                        <span style={{ color: 'var(--text-dim)' }}>SMA · </span>
                        <span style={{ color: 'var(--text-primary)' }}>
                          {planet.pl_orbsmax.toFixed(planet.pl_orbsmax < 1 ? 4 : 2)} AU
                        </span>
                      </span>
                    )}
                    {planet.pl_orbper !== null && (
                      <span>
                        <span style={{ color: 'var(--text-dim)' }}>P · </span>
                        <span style={{ color: 'var(--text-primary)' }}>
                          {planet.pl_orbper.toFixed(2)} d
                        </span>
                      </span>
                    )}
                  </div>
                )}

                {/* Tags */}
                <div className="sys-card-tags">
                  {inHZ && (
                    <span className="sys-tag sys-tag--accent">Habitable Zone</span>
                  )}
                  {planet.has_atmosphere_likely && (
                    <span className="sys-tag">Atmosphere likely</span>
                  )}
                  {isTop && (
                    <span className="sys-tag sys-tag--accent">★ System Leader</span>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      </Section>

      <div style={{ height: 80 }} />

      <style>{`
        .sys-star-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 22px 36px;
        }
        .sys-roster {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 14px;
        }
        .sys-roster-card {
          position: relative;
          display: flex; flex-direction: column; gap: 16px;
          padding: 18px 20px;
          border: 1px solid var(--border-hud);
          text-decoration: none;
          transition: all 240ms;
        }
        .sys-roster-card:hover {
          border-color: var(--hud-cyan-50);
          background: rgba(34,211,238,0.04);
          transform: translateY(-2px);
        }
        .sys-card-head {
          display: flex; align-items: center; gap: 14px;
          padding-bottom: 14px;
          border-bottom: 1px solid var(--border-hud);
        }
        .sys-card-score {
          display: flex; flex-direction: column; align-items: flex-end; gap: 2px;
        }
        .sys-card-tele {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
        }
        .sys-card-orbit {
          display: flex; flex-wrap: wrap; gap: 18px;
          padding-top: 12px;
          border-top: 1px dashed var(--border-hud);
          font-family: var(--font-mono); font-size: 11px;
          letter-spacing: 0.5px;
        }
        .sys-card-tags {
          display: flex; flex-wrap: wrap; gap: 6px;
        }
        .sys-tag {
          padding: 3px 10px;
          border: 1px solid var(--border-hud);
          background: rgba(255,255,255,0.02);
          color: var(--text-muted);
          font-family: var(--font-mono); font-size: 9px;
          letter-spacing: 1.2px; text-transform: uppercase;
        }
        .sys-tag--accent {
          border-color: var(--hud-cyan-30);
          background: rgba(34,211,238,0.04);
          color: var(--hud-cyan);
        }

        @media (max-width: 1100px) {
          .sys-star-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 768px) {
          .sys-star-grid { grid-template-columns: 1fr !important; gap: 16px !important; }
          .sys-roster { grid-template-columns: 1fr !important; }
          .sys-card-tele { grid-template-columns: 1fr 1fr !important; }
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
