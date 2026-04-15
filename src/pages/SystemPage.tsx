import { useMemo } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { getScoreColor, ACCENT, ACCENT_15 } from '../constants/colors'

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

export function SystemPage() {
  const { hostname } = useParams<{ hostname: string }>()
  const navigate = useNavigate()
  const planets = useStore((s) => s.planets)

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

  // Loading / not found
  if (systemPlanets.length === 0) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', height: '100vh',
        backgroundColor: 'transparent', color: '#fff',
      }}>
        {planets.length === 0 ? (
          <div style={{
            width: 32, height: 32,
            border: '3px solid rgba(255,255,255,0.06)',
            borderTop: '3px solid #fff',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }} />
        ) : (
          <>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 16 }}>Star system "{decodedHostname}" not found</p>
            <Link to="/" style={{ marginTop: 16, color: '#fff', textDecoration: 'none', fontSize: 14 }}>
              Back to catalog
            </Link>
          </>
        )}
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  // Orbital diagram calculations
  const orbits = systemPlanets.map((p) => p.pl_orbsmax).filter((v): v is number => v !== null && v > 0)
  const svgSize = 400
  const svgCenter = svgSize / 2
  const starRadius = 6
  const minOrbitR = 50
  const maxOrbitR = (svgSize / 2) - 24

  // Build star info inline string
  const starInfoParts: string[] = []
  if (star) {
    if (star.spectype) starInfoParts.push(star.spectype)
    if (star.teff !== null) starInfoParts.push(`${star.teff.toFixed(0)} K`)
    if (star.mass !== null) starInfoParts.push(`${star.mass.toFixed(3)} M\u2609`)
    if (star.age !== null) starInfoParts.push(`${star.age.toFixed(1)} Gyr`)
    if (star.radius !== null) starInfoParts.push(`${star.radius.toFixed(3)} R\u2609`)
    if (star.luminosity !== null) starInfoParts.push(`10^${star.luminosity.toFixed(2)} L\u2609`)
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'transparent', color: '#fff' }}>
      {/* Nav */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        backgroundColor: 'rgba(0,0,0,0.85)',
        height: 56,
      }}>
        <div style={{
          maxWidth: 1280, margin: '0 auto',
          padding: '0 24px',
          height: '100%',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button
              onClick={() => navigate(-1)}
              style={{
                color: 'rgba(255,255,255,0.4)', background: 'none', border: 'none', fontSize: 14, cursor: 'pointer',
              }}
              onMouseEnter={(e) => { ;(e.currentTarget as HTMLElement).style.color = '#fff' }}
              onMouseLeave={(e) => { ;(e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.4)' }}
            >
              Back
            </button>
            <Link to="/" style={{ fontSize: 15, fontWeight: 800, textDecoration: 'none', color: '#fff', fontFamily: "'Outfit', sans-serif" }}>
              ExoTerra
            </Link>
          </div>
          <span style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}>
            {decodedHostname} System
          </span>
        </div>
      </nav>

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '112px 24px 112px' }}>
        {/* Star Info */}
        {star && (
          <section style={{ marginBottom: 112 }}>
            <h2 style={{ fontSize: 48, fontWeight: 700, fontFamily: "'Outfit', sans-serif", color: '#fff', letterSpacing: '-1.5px', margin: 0 }}>
              {star.hostname}
            </h2>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', marginTop: 8 }}>
              Host star · {systemPlanets.length} known planet{systemPlanets.length !== 1 ? 's' : ''}
            </p>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', marginTop: 8, fontFamily: "'JetBrains Mono', monospace" }}>
              {starInfoParts.join(' \u00B7 ')}
            </p>
          </section>
        )}

        {/* Orbital Diagram */}
        <section style={{ marginBottom: 112 }}>
          <h3 style={{
            fontSize: 20, fontWeight: 600, color: '#fff',
            fontFamily: "'Outfit', sans-serif",
            marginBottom: 24, paddingBottom: 12,
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}>
            Orbital Diagram
          </h3>
          <div style={{
            display: 'flex', justifyContent: 'center',
            backgroundColor: 'rgba(0,0,0,0.7)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 16,
            padding: 32,
          }}>
            <svg
              width={svgSize}
              height={svgSize}
              viewBox={`0 0 ${svgSize} ${svgSize}`}
              style={{ maxWidth: '100%' }}
            >
              {/* Star - small white dot */}
              <circle cx={svgCenter} cy={svgCenter} r={starRadius} fill="#fff" />

              {/* Orbits and planets */}
              {systemPlanets.map((planet, i) => {
                const orbDist = planet.pl_orbsmax
                let orbitR: number
                if (orbDist !== null && orbDist > 0) {
                  const logMin = Math.log(Math.min(...orbits))
                  const logMax = Math.log(Math.max(...orbits))
                  const logRange = logMax - logMin
                  const frac = logRange > 0
                    ? (Math.log(orbDist) - logMin) / logRange
                    : 0.5
                  orbitR = minOrbitR + frac * (maxOrbitR - minOrbitR)
                } else {
                  orbitR = minOrbitR + ((i + 1) / (systemPlanets.length + 1)) * (maxOrbitR - minOrbitR)
                }

                const angle = ((i * 137.5) % 360) * (Math.PI / 180)
                const px = svgCenter + orbitR * Math.cos(angle)
                const py = svgCenter + orbitR * Math.sin(angle)
                const planetRadius = Math.max(4, Math.min(10, (planet.pl_rade ?? 1) * 1.5))

                return (
                  <g key={planet.id}>
                    {/* Orbit ring */}
                    <circle
                      cx={svgCenter}
                      cy={svgCenter}
                      r={orbitR}
                      fill="none"
                      stroke="rgba(255,255,255,0.06)"
                      strokeWidth={1}
                    />
                    {/* Planet */}
                    <circle
                      cx={px}
                      cy={py}
                      r={planetRadius}
                      fill="rgba(255,255,255,0.4)"
                    />
                    {/* Label */}
                    <text
                      x={px}
                      y={py - planetRadius - 6}
                      textAnchor="middle"
                      fill="#fff"
                      fontSize={9}
                      fontWeight={600}
                    >
                      {planet.pl_name.replace(planet.hostname, '').trim() || planet.pl_name}
                    </text>
                    {/* Orbit distance */}
                    {orbDist !== null && (
                      <text
                        x={px}
                        y={py + planetRadius + 12}
                        textAnchor="middle"
                        fill="rgba(255,255,255,0.4)"
                        fontSize={7}
                        fontFamily="'JetBrains Mono', monospace"
                      >
                        {orbDist.toFixed(orbDist < 1 ? 3 : 2)} AU
                      </text>
                    )}
                  </g>
                )
              })}
            </svg>
          </div>
        </section>

        {/* Single planet message */}
        {systemPlanets.length === 1 && (
          <div style={{
            textAlign: 'center',
            padding: '16px 24px',
            marginBottom: 24,
            backgroundColor: '#0f0f0f',
            borderRadius: 16,
            color: 'rgba(255,255,255,0.6)',
            fontSize: 14,
          }}>
            Only known planet in this system
          </div>
        )}

        {/* Planet List */}
        <section>
          <h3 style={{
            fontSize: 20, fontWeight: 600, color: '#fff',
            fontFamily: "'Outfit', sans-serif",
            marginBottom: 24, paddingBottom: 12,
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}>
            Planets in System ({systemPlanets.length})
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: 14,
          }}>
            {systemPlanets.map((planet) => (
              <Link
                key={planet.id}
                to={`/planet/${encodeURIComponent(planet.pl_name)}`}
                style={{ textDecoration: 'none' }}
              >
                <div
                  style={{
                    backgroundColor: '#0f0f0f',
                    borderRadius: 16,
                    padding: 20,
                  }}
                  onMouseEnter={(e) => {
                    ;(e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.04)'
                  }}
                  onMouseLeave={(e) => {
                    ;(e.currentTarget as HTMLElement).style.backgroundColor = '#0f0f0f'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        {TYPE_LABELS[planet.planet_type] || planet.planet_type}
                      </div>
                      <div style={{ fontSize: 18, fontWeight: 600, color: '#fff', marginTop: 4 }}>
                        {planet.pl_name}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1 }}>
                        Habitability
                      </div>
                      <div style={{
                        fontSize: 24, fontWeight: 800, lineHeight: 1.1, marginTop: 2,
                        color: getScoreColor(planet.habitability_score),
                        fontFamily: "'JetBrains Mono', monospace",
                      }}>
                        {planet.habitability_score.toFixed(1)}
                      </div>
                    </div>
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: 8,
                    marginTop: 16,
                  }}>
                    <MiniStat
                      label="Temperature"
                      value={planet.pl_eqt !== null ? `${planet.pl_eqt.toFixed(0)} K` : '--'}
                    />
                    <MiniStat
                      label="Radius"
                      value={planet.pl_rade !== null ? `${planet.pl_rade.toFixed(2)} R Earth` : '--'}
                    />
                    <MiniStat
                      label="Mass"
                      value={planet.pl_masse !== null ? `${planet.pl_masse.toFixed(2)} M Earth` : '--'}
                    />
                  </div>

                  {planet.pl_orbsmax !== null && (
                    <div style={{
                      marginTop: 12, paddingTop: 12,
                      borderTop: '1px solid rgba(255,255,255,0.06)',
                      fontSize: 12, color: 'rgba(255,255,255,0.4)',
                      fontFamily: "'JetBrains Mono', monospace",
                    }}>
                      Orbital distance: {planet.pl_orbsmax.toFixed(planet.pl_orbsmax < 1 ? 4 : 2)} AU
                      {planet.pl_orbper !== null && ` \u00B7 Period: ${planet.pl_orbper.toFixed(2)} days`}
                    </div>
                  )}

                  {/* Tags */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                    {planet.in_habitable_zone && (
                      <span style={{
                        padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600,
                        backgroundColor: ACCENT_15,
                        color: ACCENT,
                      }}>
                        Habitable Zone
                      </span>
                    )}
                    {planet.has_atmosphere_likely && (
                      <span style={{
                        padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600,
                        backgroundColor: 'rgba(255,255,255,0.06)',
                        color: 'rgba(255,255,255,0.6)',
                      }}>
                        Atmosphere
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
        {label}
      </div>
      <div style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.6)', marginTop: 2, fontFamily: "'JetBrains Mono', monospace" }}>
        {value}
      </div>
    </div>
  )
}
