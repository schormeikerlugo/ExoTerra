import { useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { useStore } from '../store/useStore'
import { PlanetScene } from '../components/Scene/PlanetScene'
import { getScoreColor } from '../constants/colors'
import {
  Globe,
  Wind,
  Flame,
  Snowflake,
  Eye,
  Orbit,
  Search,
  Radio,
  Aperture,
  Satellite,
  Mountain,
  Droplets,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

/* ── Planet type → Lucide icon mapping ── */
const PLANET_TYPE_ICON: Record<string, LucideIcon> = {
  rocky: Globe,
  super_earth: Globe,
  gas_giant: Wind,
  hot_jupiter: Wind,
  ice_giant: Snowflake,
  mini_neptune: Wind,
  lava_world: Flame,
  frozen_rocky: Snowflake,
  water: Globe,
  unknown: Globe,
}

/* ── Discovery methods ── */
const DISCOVERY_METHODS: { key: string; Icon: LucideIcon }[] = [
  { key: 'Transit', Icon: Eye },
  { key: 'Radial Velocity', Icon: Orbit },
  { key: 'Imaging', Icon: Aperture },
  { key: 'Microlensing', Icon: Search },
  { key: 'Transit Timing Variations', Icon: Satellite },
  { key: 'Pulsar Timing', Icon: Radio },
]

export function LandingPage() {
  const planets = useStore((s) => s.planets)
  const setSelectedPlanet = useStore((s) => s.setSelectedPlanet)
  const isLoading = useStore((s) => s.isLoading)

  // Select a random top-10 habitable planet on mount
  useEffect(() => {
    if (planets.length === 0) return
    const exoplanets = planets.filter((p) => p.id >= 0)
    const sorted = [...exoplanets].sort((a, b) => b.habitability_score - a.habitability_score)
    const top10 = sorted.slice(0, 10)
    const random = top10[Math.floor(Math.random() * top10.length)]
    if (random) setSelectedPlanet(random)
  }, [planets, setSelectedPlanet])

  // Stats calculations
  const stats = useMemo(() => {
    const exoplanets = planets.filter((p) => p.id >= 0)
    const totalPlanets = exoplanets.length
    const habitableZone = exoplanets.filter((p) => p.in_habitable_zone).length

    const methods = new Set<string>()
    exoplanets.forEach((p) => {
      if (p.discoverymethod) methods.add(p.discoverymethod)
    })

    let closestPlanet = '---'
    const withDistance = exoplanets.filter((p) => p.sy_dist !== null && p.sy_dist > 0)
    if (withDistance.length > 0) {
      const closest = withDistance.reduce((a, b) => (a.sy_dist! < b.sy_dist! ? a : b))
      closestPlanet = closest.pl_name
    }

    return { totalPlanets, habitableZone, discoveryMethods: methods.size, closestPlanet }
  }, [planets])

  // Featured planets: top 6 by habitability_score (exclude solar system)
  const featuredPlanets = useMemo(() => {
    const exoplanets = planets.filter((p) => p.id >= 0)
    return [...exoplanets]
      .sort((a, b) => b.habitability_score - a.habitability_score)
      .slice(0, 6)
  }, [planets])

  // Discovery method counts
  const methodCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    const exoplanets = planets.filter((p) => p.id >= 0)
    exoplanets.forEach((p) => {
      if (p.discoverymethod) {
        counts[p.discoverymethod] = (counts[p.discoverymethod] || 0) + 1
      }
    })
    return counts
  }, [planets])

  const statItems = [
    {
      value: stats.totalPlanets > 0 ? stats.totalPlanets.toLocaleString() : '---',
      label: 'Confirmed Planets',
    },
    {
      value: stats.habitableZone > 0 ? stats.habitableZone.toLocaleString() : '---',
      label: 'In Habitable Zone',
    },
    {
      value: stats.discoveryMethods > 0 ? stats.discoveryMethods.toString() : '---',
      label: 'Discovery Methods',
    },
    {
      value: stats.closestPlanet,
      label: 'Nearest Exoplanet',
      small: true,
    },
  ]

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'transparent' }}>

      {/* ─── Hero Section (100vh) ─── */}
      <section style={{
        height: '100vh',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* 3D background - fills entire hero */}
        <div style={{
          position: 'absolute',
          inset: 0,
          zIndex: 0,
        }}>
          {isLoading ? (
            <div style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <div style={{
                width: 40,
                height: 40,
                border: '3px solid rgba(255,255,255,0.1)',
                borderTop: '3px solid #fff',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
              }} />
            </div>
          ) : (
            <PlanetScene autoRotate enableZoom={false} />
          )}
        </div>

        {/* Text overlay - centered */}
        <div style={{
          position: 'absolute',
          inset: 0,
          zIndex: 1,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          pointerEvents: 'none',
        }}>
          <div style={{
            textAlign: 'center',
            background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.6) 0%, transparent 70%)',
            padding: '80px 120px',
          }}>
            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, ease: 'easeOut' }}
              style={{
                fontSize: 80,
                fontWeight: 800,
                fontFamily: "'Outfit', sans-serif",
                color: '#fff',
                letterSpacing: '-3px',
                lineHeight: 1,
                margin: 0,
              }}
            >
              ExoTerra
            </motion.h1>

            <p style={{
              fontSize: 20,
              color: 'rgba(255,255,255,0.6)',
              lineHeight: 1.6,
              marginTop: 20,
              marginBottom: 0,
            }}>
              Explore {stats.totalPlanets > 0 ? stats.totalPlanets.toLocaleString() : '6,000'}+ confirmed exoplanets in interactive 3D
            </p>

            <div style={{ display: 'flex', gap: 16, marginTop: 40, justifyContent: 'center', pointerEvents: 'auto' }}>
              <Link
                to="/catalog"
                style={{
                  display: 'inline-block',
                  padding: '16px 40px',
                  backgroundColor: '#4ECDC4',
                  color: '#000',
                  borderRadius: 12,
                  fontSize: 15,
                  fontWeight: 600,
                  textDecoration: 'none',
                  border: 'none',
                  transition: 'opacity 300ms',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '0.85'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '1'
                }}
              >
                Explore Catalog
              </Link>
              <Link
                to="/explorer"
                style={{
                  display: 'inline-block',
                  padding: '16px 40px',
                  backgroundColor: 'transparent',
                  color: '#4ECDC4',
                  borderRadius: 12,
                  fontSize: 15,
                  fontWeight: 600,
                  textDecoration: 'none',
                  border: '2px solid rgba(78,205,196,0.5)',
                  transition: 'background-color 300ms',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(78,205,196,0.1)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }}
              >
                3D Explorer
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom gradient fade */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 200,
          background: 'linear-gradient(to top, rgba(0,0,0,0.95), transparent)',
          zIndex: 1,
          pointerEvents: 'none',
        }} />
      </section>

      {/* ─── 1. What is ExoTerra (text + numbers inline) ─── */}
      <section style={{ padding: '112px 24px 0', backgroundColor: 'transparent' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <h2 style={{ fontSize: 40, fontWeight: 700, color: '#fff', letterSpacing: '-1.5px', lineHeight: 1.1, fontFamily: "'Outfit', sans-serif" }}>
            A visual encyclopedia of worlds beyond our solar system
          </h2>
          <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.5)', lineHeight: 1.8, marginTop: 24 }}>
            ExoTerra transforms raw NASA data into interactive 3D visualizations. Every planet is procedurally generated from real scientific measurements — temperature, mass, radius, and orbital parameters shape its surface, atmosphere, and appearance. Built for scientists, educators, and space enthusiasts.
          </p>
          {/* Inline stats — not cards */}
          <div style={{ display: 'flex', gap: 48, marginTop: 40 }}>
            {[
              { value: '6,158', label: 'Confirmed exoplanets' },
              { value: '8', label: 'Classifications' },
              { value: '0–100', label: 'Habitability range' },
            ].map((item) => (
              <div key={item.label}>
                <span style={{ fontSize: 28, fontWeight: 700, color: '#fff', fontFamily: "'JetBrains Mono', monospace" }}>{item.value}</span>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', marginLeft: 8 }}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 2. How It Works (numbered timeline, not cards) ─── */}
      <section style={{ padding: '112px 24px', backgroundColor: 'transparent' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <h2 style={{ fontSize: 32, fontWeight: 700, color: '#fff', letterSpacing: '-0.5px', fontFamily: "'Outfit', sans-serif" }}>
            How it works
          </h2>
          <div style={{ marginTop: 48 }}>
            {[
              { step: '01', title: 'Data Ingestion', desc: 'Confirmed exoplanet data from the NASA Exoplanet Archive — mass, radius, temperature, orbital parameters, and host star properties.' },
              { step: '02', title: 'Classification', desc: 'Each planet classified into 8 types. A habitability score computed from temperature, radius, mass, stellar flux, and star type.' },
              { step: '03', title: 'Visual Generation', desc: 'Surface textures mapped and blended with procedural GLSL shaders. Atmosphere, rings, and moons inferred from data.' },
              { step: '04', title: 'Interactive 3D', desc: 'Real-time rendering with Three.js, custom shaders, and orbital controls. Rotate, zoom, and explore any planet.' },
            ].map((item, i) => (
              <div key={item.step} style={{
                display: 'flex', gap: 24, alignItems: 'baseline',
                padding: '24px 0',
                borderBottom: i < 3 ? '1px solid rgba(255,255,255,0.06)' : 'none',
              }}>
                <span style={{ fontSize: 14, fontFamily: "'JetBrains Mono', monospace", color: 'rgba(255,255,255,0.2)', minWidth: 32 }}>{item.step}</span>
                <span style={{ fontSize: 16, fontWeight: 600, color: '#fff', minWidth: 180 }}>{item.title}</span>
                <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>{item.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 3. Planet Types (cards grid) ─── */}
      <section style={{ padding: '112px 24px', backgroundColor: 'transparent' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <h2 style={{ fontSize: 32, fontWeight: 700, color: '#fff', letterSpacing: '-0.5px', fontFamily: "'Outfit', sans-serif" }}>
            Planet types
          </h2>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.4)', marginTop: 8 }}>
            Exoplanets classified by size, composition, and temperature.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginTop: 48 }}>
            {[
              { icon: Mountain, name: 'Rocky', desc: 'Small, dense worlds with solid surfaces. Similar to Earth, Mars, or Mercury.', count: planets.filter(p => p.planet_type === 'rocky').length },
              { icon: Globe, name: 'Super Earth', desc: 'Rocky planets larger than Earth but smaller than Neptune. Strong gravity and diverse conditions.', count: planets.filter(p => p.planet_type === 'super_earth').length },
              { icon: Wind, name: 'Gas Giant', desc: 'Massive hydrogen-helium worlds like Jupiter. No solid surface, powerful storm systems.', count: planets.filter(p => p.planet_type === 'gas_giant').length },
              { icon: Flame, name: 'Hot Jupiter', desc: 'Gas giants extremely close to their stars. Temperatures exceed 1000K with exotic atmospheres.', count: planets.filter(p => p.planet_type === 'hot_jupiter').length },
              { icon: Snowflake, name: 'Ice Giant', desc: 'Composed of water, ammonia, and methane ices. Blue-green atmospheres with extreme winds.', count: planets.filter(p => p.planet_type === 'ice_giant').length },
              { icon: Droplets, name: 'Mini Neptune', desc: 'Significant gaseous envelopes. A transitional class between super-Earths and gas giants.', count: planets.filter(p => p.planet_type === 'mini_neptune').length },
              { icon: Flame, name: 'Lava World', desc: 'Surfaces of molten rock. Magma oceans, volcanic eruptions, and mineral vapor atmospheres.', count: planets.filter(p => p.planet_type === 'lava_world').length },
              { icon: Snowflake, name: 'Frozen Rocky', desc: 'Cold terrestrial worlds locked in permanent ice. Possible subsurface oceans beneath the crust.', count: planets.filter(p => p.planet_type === 'frozen_rocky').length },
            ].map((item) => (
              <div key={item.name} style={{ backgroundColor: '#0f0f0f', borderRadius: 16, padding: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <item.icon size={18} style={{ color: 'rgba(255,255,255,0.5)' }} />
                  <h3 style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}>{item.name}</h3>
                </div>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6, marginBottom: 16 }}>{item.desc}</p>
                <div style={{ fontSize: 12, fontFamily: "'JetBrains Mono', monospace", color: 'rgba(255,255,255,0.25)' }}>
                  {item.count.toLocaleString()} planets
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 4. Habitability Score (split: text left, factors right as bars) ─── */}
      <section style={{ padding: '112px 24px', backgroundColor: 'transparent' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 80, alignItems: 'start' }}>
          <div>
            <h2 style={{ fontSize: 32, fontWeight: 700, color: '#fff', letterSpacing: '-0.5px', fontFamily: "'Outfit', sans-serif" }}>
              Habitability Score
            </h2>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.45)', lineHeight: 1.8, marginTop: 20 }}>
              Every planet receives a score from 0 to 100 measuring how similar its conditions are to Earth. Five weighted factors derived from real observational data.
            </p>
            <div style={{ display: 'flex', gap: 12, marginTop: 28 }}>
              <span style={{ padding: '6px 14px', borderRadius: 9999, backgroundColor: 'rgba(78,205,196,0.15)', color: '#4ECDC4', fontSize: 12, fontWeight: 600 }}>60+ Earth-like</span>
              <span style={{ padding: '6px 14px', borderRadius: 9999, backgroundColor: 'rgba(255,230,109,0.15)', color: '#FFE66D', fontSize: 12, fontWeight: 600 }}>30–59 Partial</span>
              <span style={{ padding: '6px 14px', borderRadius: 9999, backgroundColor: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 600 }}>&lt;30 Unlikely</span>
            </div>
          </div>
          <div>
            {[
              { factor: 'Temperature', weight: 25, ideal: '255–310 K' },
              { factor: 'Habitable Zone', weight: 25, ideal: '0.25–2.0 S⊕' },
              { factor: 'Radius', weight: 20, ideal: '0.5–1.5 R⊕' },
              { factor: 'Mass', weight: 15, ideal: '0.5–5 M⊕' },
              { factor: 'Star Type', weight: 15, ideal: 'G or K type' },
            ].map((item) => (
              <div key={item.factor} style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 14, color: '#fff', fontWeight: 500 }}>{item.factor}</span>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', fontFamily: "'JetBrains Mono', monospace" }}>{item.weight}% · {item.ideal}</span>
                </div>
                <div style={{ height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.06)' }}>
                  <div style={{ height: '100%', borderRadius: 2, width: `${item.weight * 4}%`, backgroundColor: 'rgba(255,255,255,0.2)' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 5. Stats Row ─── */}
      <section style={{ backgroundColor: 'transparent' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '112px 24px', display: 'flex', justifyContent: 'space-between' }}>
          {statItems.map((item, index) => (
            <div key={item.label} style={{ flex: 1, textAlign: 'center', borderLeft: index > 0 ? '1px solid rgba(255,255,255,0.08)' : 'none' }}>
              <div style={{ fontSize: item.small ? 18 : 36, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: '#fff', letterSpacing: item.small ? 0 : '-1px', padding: '0 16px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.value}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 6, textTransform: 'uppercase', letterSpacing: 1 }}>{item.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── 6. Featured Planets (cards grid) ─── */}
      <section style={{ padding: '112px 24px', backgroundColor: 'transparent' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <h2 style={{ fontSize: 32, fontWeight: 700, color: '#fff', letterSpacing: '-0.5px', fontFamily: "'Outfit', sans-serif" }}>Most habitable exoplanets</h2>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.4)', marginTop: 8, marginBottom: 48 }}>Top-scoring worlds ranked by our habitability model.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            {featuredPlanets.map((planet) => {
              const IconComp = PLANET_TYPE_ICON[planet.planet_type] ?? Globe
              const score = planet.habitability_score
              return (
                <Link key={planet.id} to={`/planet/${encodeURIComponent(planet.pl_name)}`} className="planet-card-link" style={{
                  display: 'block', backgroundColor: '#0f0f0f', borderRadius: 16, padding: 24,
                  textDecoration: 'none', color: 'inherit',
                  border: '1px solid transparent', transition: 'border-color 200ms',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <IconComp size={18} style={{ color: 'rgba(255,255,255,0.4)' }} />
                      {planet.in_habitable_zone && (
                        <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 9999, backgroundColor: 'rgba(78,205,196,0.15)', color: '#4ECDC4' }}>HZ</span>
                      )}
                    </div>
                    <span style={{ fontSize: 18, fontFamily: "'JetBrains Mono', monospace", color: getScoreColor(score), fontWeight: 700 }}>{score.toFixed(1)}</span>
                  </div>
                  <h3 style={{ fontSize: 17, fontWeight: 600, color: '#fff', margin: 0 }}>{planet.pl_name}</h3>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 6 }}>
                    {planet.planet_type.replace('_', ' ')} · {planet.hostname}
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* ─── 7. Discovery Methods (inline list) ─── */}
      <section style={{ padding: '112px 24px', backgroundColor: 'transparent' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <h2 style={{ fontSize: 32, fontWeight: 700, color: '#fff', letterSpacing: '-0.5px', fontFamily: "'Outfit', sans-serif" }}>Discovery methods</h2>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.4)', marginTop: 8, marginBottom: 40 }}>How astronomers detect worlds beyond our solar system.</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 48px' }}>
            {DISCOVERY_METHODS.map((method) => {
              const count = methodCounts[method.key] ?? 0
              return (
                <div key={method.key} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <method.Icon size={16} style={{ color: 'rgba(255,255,255,0.3)', flexShrink: 0 }} />
                  <span style={{ fontSize: 15, color: '#fff', fontWeight: 500, flex: 1 }}>{method.key}</span>
                  <span style={{ fontSize: 14, fontFamily: "'JetBrains Mono', monospace", color: 'rgba(255,255,255,0.4)' }}>{count > 0 ? count.toLocaleString() : '—'}</span>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ─── 8. Data Sources (inline, not cards) ─── */}
      <section style={{ padding: '112px 24px', backgroundColor: 'transparent' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <h2 style={{ fontSize: 32, fontWeight: 700, color: '#fff', letterSpacing: '-0.5px', fontFamily: "'Outfit', sans-serif" }}>Built on real science</h2>
          <div style={{ marginTop: 40 }}>
            {[
              { title: 'NASA Exoplanet Archive', desc: 'Primary data source. Maintained by Caltech/IPAC — every confirmed exoplanet with physical parameters, orbital data, and host star properties.', link: 'exoplanetarchive.ipac.caltech.edu' },
              { title: 'Three.js + GLSL', desc: 'Real-time 3D rendering with custom fragment shaders. Surface textures, atmospheric halos, and cloud layers generated procedurally.', link: 'threejs.org' },
              { title: 'Supabase', desc: '6,158 planets stored with computed fields — habitability scores, classification, and visual properties calculated via SQL triggers.', link: 'supabase.com' },
            ].map((item, i) => (
              <div key={item.title} style={{ display: 'flex', gap: 24, padding: '24px 0', borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.04)' : 'none', alignItems: 'baseline' }}>
                <span style={{ fontSize: 16, fontWeight: 600, color: '#fff', minWidth: 220 }}>{item.title}</span>
                <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', flex: 1, lineHeight: 1.6 }}>{item.desc}</span>
                <span style={{ fontSize: 12, fontFamily: "'JetBrains Mono', monospace", color: 'rgba(255,255,255,0.2)', whiteSpace: 'nowrap' }}>{item.link}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer style={{ padding: '48px 24px', textAlign: 'center', backgroundColor: 'transparent' }}>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.2)', margin: 0 }}>
          Data sourced from NASA Exoplanet Archive &middot; Built with React, Three.js & Supabase
        </p>
      </footer>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
