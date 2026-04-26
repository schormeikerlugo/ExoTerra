import { useEffect, useMemo, type CSSProperties } from 'react'
import { useReveal } from '../hooks/useReveal'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { useStore } from '../store/useStore'
import { CornerBrackets } from '../components/HUD/CornerBrackets'
import { TelemetryRow, TelemetryLine } from '../components/HUD/Telemetry'
import { HUDPanel } from '../components/HUD/HUDPanel'
import { Barcode } from '../components/HUD/Barcode'
import { Sparkline } from '../components/HUD/Sparkline'
import { SectionIndicator } from '../components/HUD/SectionIndicator'
import { RegistrationField } from '../components/HUD/RegistrationField'
import { HatchFill } from '../components/HUD/HatchFill'
import { TrackingCode } from '../components/HUD/TrackingCode'
import { DiagonalAccent } from '../components/HUD/DiagonalAccent'
import { buildSystemTelemetry } from '../utils/planetTelemetry'
import { getExoplanetTexture } from '../utils/textureMap'
import { planetNameToSeed } from '../utils/planetSeed'
import type { Exoplanet } from '../data/types'
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
  ChevronRight,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

/* ── Planet orb using real surface textures (2D) ──
 * Picks a texture from /textures/exoplanets via visual_surface_type,
 * then composes sphere shading on top: a top-left specular highlight + edge
 * darkening vignette, with an inset box-shadow for terminator depth. */
function planetOrbStyle(planet: Exoplanet): CSSProperties {
  const texture = getExoplanetTexture(planet)
  const seed = planetNameToSeed(planet.pl_name)
  // Pan the texture window per planet so each card looks unique
  const bgX = Math.floor(seed) % 100
  return {
    borderRadius: '50%',
    backgroundImage: [
      'radial-gradient(circle at 30% 25%, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0) 32%)',
      'radial-gradient(circle at 50% 50%, transparent 52%, rgba(0,0,0,0.7) 100%)',
      `url(${texture})`,
    ].join(', '),
    backgroundSize: 'cover, cover, 220% 180%',
    backgroundPosition: `center, center, ${bgX}% 50%`,
    backgroundRepeat: 'no-repeat, no-repeat, no-repeat',
    boxShadow:
      'inset -8px -12px 28px rgba(0,0,0,0.7), 0 0 24px rgba(255,255,255,0.04)',
  }
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
  const updateFilter = useStore((s) => s.updateFilter)
  const setSelectedPlanet = useStore((s) => s.setSelectedPlanet)

  // Pre-select a random top-10 habitable planet so downstream pages have a default
  useEffect(() => {
    if (planets.length === 0) return
    const exoplanets = planets.filter((p) => p.id >= 0)
    const sorted = [...exoplanets].sort((a, b) => b.habitability_score - a.habitability_score)
    const top10 = sorted.slice(0, 10)
    const random = top10[Math.floor(Math.random() * top10.length)]
    if (random) setSelectedPlanet(random)
  }, [planets, setSelectedPlanet])

  // Stats calculations — includes extreme records for hero telemetry
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

    // Hottest planet (max equilibrium temp)
    let hottestName = '—'
    const withTemp = exoplanets.filter((p) => p.pl_eqt !== null && p.pl_eqt > 0)
    if (withTemp.length > 0) {
      const hot = withTemp.reduce((a, b) => (a.pl_eqt! > b.pl_eqt! ? a : b))
      hottestName = hot.pl_name
    }

    // Largest planet (max radius)
    let largestName = '—'
    const withRadius = exoplanets.filter((p) => p.pl_rade !== null && p.pl_rade > 0)
    if (withRadius.length > 0) {
      const big = withRadius.reduce((a, b) => (a.pl_rade! > b.pl_rade! ? a : b))
      largestName = big.pl_name
    }

    // Top habitability scorer
    let topScorerName = '—'
    let topScore = 0
    if (exoplanets.length > 0) {
      const top = exoplanets.reduce((a, b) => (a.habitability_score > b.habitability_score ? a : b))
      topScorerName = top.pl_name
      topScore = top.habitability_score
    }

    // Most recent discovery year
    let latestYear: number | null = null
    const withYear = exoplanets.filter((p) => p.disc_year !== null)
    if (withYear.length > 0) {
      latestYear = Math.max(...withYear.map((p) => p.disc_year!))
    }

    // ─── Distributions for the new visualizations in System Overview ───

    // 1. By planet type (8 bars)
    const TYPE_LABELS: Record<string, string> = {
      rocky: 'Rocky',
      super_earth: 'Super Earth',
      gas_giant: 'Gas Giant',
      hot_jupiter: 'Hot Jupiter',
      ice_giant: 'Ice Giant',
      mini_neptune: 'Mini Neptune',
      lava_world: 'Lava World',
      frozen_rocky: 'Frozen Rocky',
    }
    const typeDistribution = Object.keys(TYPE_LABELS)
      .map((t) => {
        const count = exoplanets.filter((p) => p.planet_type === t).length
        return {
          type: t,
          label: TYPE_LABELS[t],
          count,
          percent: totalPlanets > 0 ? (count / totalPlanets) * 100 : 0,
        }
      })
      .sort((a, b) => b.count - a.count)

    // 2. Discoveries per year (timeline)
    const yearCounts: Record<number, number> = {}
    exoplanets.forEach((p) => {
      if (p.disc_year !== null) yearCounts[p.disc_year] = (yearCounts[p.disc_year] || 0) + 1
    })
    const allYears = Object.keys(yearCounts).map(Number).sort((a, b) => a - b)
    const minYearDist = allYears[0] ?? 1995
    const maxYearDist = allYears[allYears.length - 1] ?? new Date().getFullYear()
    const yearDistribution: { year: number; count: number }[] = []
    for (let y = minYearDist; y <= maxYearDist; y++) {
      yearDistribution.push({ year: y, count: yearCounts[y] || 0 })
    }
    const peakYear = yearDistribution.reduce(
      (best, item) => (item.count > best.count ? item : best),
      yearDistribution[0] ?? { year: 0, count: 0 },
    )

    // 3. Habitability score histogram (10 buckets, 0–100)
    const scoreHistogram = Array.from({ length: 10 }, (_, i) => ({
      label: i === 9 ? '90+' : `${i * 10}`,
      min: i * 10,
      max: i === 9 ? 100 : (i + 1) * 10,
      count: 0,
    }))
    exoplanets.forEach((p) => {
      const idx = Math.min(Math.floor(p.habitability_score / 10), 9)
      scoreHistogram[idx].count++
    })
    const earthLikeCount = scoreHistogram.slice(6).reduce((s, b) => s + b.count, 0) // ≥60

    return {
      totalPlanets, habitableZone, discoveryMethods: methods.size,
      closestPlanet, hottestName, largestName, topScorerName, topScore, latestYear,
      typeDistribution, yearDistribution, peakYear, scoreHistogram, earthLikeCount,
      minYearDist, maxYearDist,
    }
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

  const systemTelemetry = useMemo(
    () => buildSystemTelemetry(stats),
    [stats],
  )

  // Scroll-triggered reveals: one observer, CSS-only transitions
  useReveal()

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

      <SectionIndicator total={9} />

      {/* ─── Hero Section (100vh) ─── sci-fi HUD */}
      <section data-section="01" style={{
        height: '100vh',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Media layer: video with image poster fallback */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 0, overflow: 'hidden' }}>
          <video
            className="hero-video"
            autoPlay
            muted
            loop
            playsInline
            disablePictureInPicture
            preload="metadata"
            poster="/images/hero.jpg"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              filter: 'grayscale(0.15) contrast(1.05) saturate(0.85) brightness(0.85)',
              animation: 'hero-slow-zoom 14s ease-out both',
            }}
          >
            <source src="/videos/hero.webm" type="video/webm" />
            <source src="/videos/hero.mp4" type="video/mp4" />
          </video>
        </div>

        {/* Veils & vignette: layered gradients for depth + readability — pure black */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.6, ease: 'easeOut' }}
          style={{
            position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none',
            background:
              'linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.55) 55%, #000 100%)',
          }}
        />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.6, ease: 'easeOut', delay: 0.1 }}
          style={{
            position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none',
            background: 'radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,0.75) 100%)',
          }}
        />

        {/* Global frame: corner brackets (scale-in) */}
        <motion.div
          className="hero-frame"
          initial={{ opacity: 0, scale: 0.985 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.0 }}
          style={{ position: 'absolute', inset: 24, zIndex: 3, pointerEvents: 'none' }}
        >
          <CornerBrackets size={22} thickness={1} color="var(--hud-line)" />
        </motion.div>

        {/* Ambient registration marks — print-style alignment guides scattered */}
        <motion.div
          className="hero-decor hero-decor--ambient"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.4, delay: 0.5 }}
          style={{ position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none' }}
        >
          <RegistrationField seed="landing-hero" density="dense" opacity={0.55} hideMobile inset={48} />
        </motion.div>

        {/* Top-left — archive identity */}
        <motion.div
          className="hero-corner"
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.35 }}
          style={{
            position: 'absolute', top: 88, left: 48, zIndex: 4,
            display: 'flex', flexDirection: 'column', gap: 16,
            pointerEvents: 'none',
          }}
        >
          {systemTelemetry.topLeft.map((t) => (
            <TelemetryRow key={t.label} label={t.label} value={t.value} align="left" />
          ))}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
            <HatchFill style={{ width: 18, height: 8 }} opacity={0.4} />
            <TrackingCode seed="hero-tl" variant="hex" />
          </div>
        </motion.div>

        {/* Top-right — sync / status */}
        <motion.div
          className="hero-corner"
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.35 }}
          style={{
            position: 'absolute', top: 88, right: 48, zIndex: 4,
            display: 'flex', flexDirection: 'column', gap: 16,
            pointerEvents: 'none',
          }}
        >
          {systemTelemetry.topRight.map((t) => (
            <TelemetryRow key={t.label} label={t.label} value={t.value} align="right" />
          ))}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 4, alignSelf: 'flex-end' }}>
            <TrackingCode seed="hero-tr" variant="rec" />
            <HatchFill style={{ width: 18, height: 8 }} opacity={0.4} />
          </div>
        </motion.div>

        {/* Bottom-left — dataset counts (slide from below) */}
        <motion.div
          className="hero-corner"
          initial={{ opacity: 0, x: -16, y: 10 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.5 }}
          style={{
            position: 'absolute', bottom: 96, left: 48, zIndex: 4,
            display: 'flex', flexDirection: 'column', gap: 12,
            pointerEvents: 'none',
          }}
        >
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <TrackingCode seed="hero-bl" variant="channel" />
            <HatchFill style={{ width: 18, height: 8 }} opacity={0.4} />
          </div>
          {systemTelemetry.bottomLeft.map((t) => (
            <TelemetryRow key={t.label} label={t.label} value={t.value} align="left" />
          ))}
        </motion.div>

        {/* Bottom-right — nearest / uplink clock */}
        <motion.div
          className="hero-corner"
          initial={{ opacity: 0, x: 16, y: 10 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.5 }}
          style={{
            position: 'absolute', bottom: 96, right: 48, zIndex: 4,
            display: 'flex', flexDirection: 'column', gap: 12,
            pointerEvents: 'none',
          }}
        >
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 4, alignSelf: 'flex-end' }}>
            <HatchFill style={{ width: 18, height: 8 }} opacity={0.4} />
            <TrackingCode seed="hero-br" variant="lot" />
          </div>
          {systemTelemetry.bottomRight.map((t) => (
            <TelemetryRow key={t.label} label={t.label} value={t.value} align="right" />
          ))}
        </motion.div>

        {/* Central display title — big and bracketed */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 2,
          display: 'flex', flexDirection: 'column',
          justifyContent: 'center', alignItems: 'center',
          pointerEvents: 'none',
        }}>
          <motion.div
            initial={{ opacity: 0, letterSpacing: '-0.04em', filter: 'blur(10px)' }}
            animate={{ opacity: 1, letterSpacing: '0.04em', filter: 'blur(0px)' }}
            transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1], delay: 0.75 }}
            style={{
              position: 'relative',
              padding: '0 40px',
            }}
          >
            <h1 style={{
              fontSize: 'clamp(72px, 12vw, 180px)',
              fontWeight: 600,
              fontFamily: 'var(--font-astra)',
              color: 'var(--text-primary)',
              letterSpacing: '0.04em',
              lineHeight: 0.95,
              margin: 0,
              textShadow: '0 0 80px rgba(0,0,0,0.85)',
            }}>
              EXOTERRA
            </h1>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.5, ease: [0.22, 1, 0.36, 1] }}
            style={{
              marginTop: 32,
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              letterSpacing: '3px',
              color: 'var(--hud-line-soft)',
              textTransform: 'uppercase',
            }}
          >
            <motion.span
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.8, delay: 1.5, ease: [0.22, 1, 0.36, 1] }}
              style={{ width: 40, height: 1, background: 'var(--hud-line-dim)', transformOrigin: 'right' }}
            />
            <span>Interactive Exoplanet Archive</span>
            <motion.span
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.8, delay: 1.5, ease: [0.22, 1, 0.36, 1] }}
              style={{ width: 40, height: 1, background: 'var(--hud-line-dim)', transformOrigin: 'left' }}
            />
          </motion.div>

          <motion.div
            className="hero-cta-row"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 1.85, ease: [0.22, 1, 0.36, 1] }}
            style={{
              display: 'flex', gap: 14, marginTop: 36,
              pointerEvents: 'auto',
            }}
          >
            <Link to="/catalog" className="hud-cta-primary" style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              padding: '14px 28px',
              background: 'var(--hud-cyan)',
              color: 'var(--bg-void)',
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: '2px',
              textTransform: 'uppercase',
              textDecoration: 'none',
              position: 'relative',
              clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)',
              transition: 'background 200ms, box-shadow 200ms',
            }}>
              <ChevronRight size={14} strokeWidth={2.5} />
              Initiate Exploration
            </Link>
            <Link to="/explorer" className="hud-cta-secondary" style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              padding: '14px 28px',
              background: 'transparent',
              color: 'var(--hud-cyan)',
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              fontWeight: 500,
              letterSpacing: '2px',
              textTransform: 'uppercase',
              textDecoration: 'none',
              position: 'relative',
              border: '1px solid var(--border-hud-strong)',
              clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)',
              transition: 'background 200ms',
            }}>
              [ Enter 3D Mode ]
            </Link>
          </motion.div>
        </div>

        {/* ─── Mobile-only decorative stamps in the four hero corners ───
            Positioned INSIDE the corner-bracket frame (which sits at
            inset: 80px 16px 56px 16px on mobile, brackets size 22px).
            Each stamp sits just inside the bracket's L-shape so the bracket
            visually wraps around it. */}
        <div className="hero-decor-mobile" aria-hidden style={{
          display: 'none',
          position: 'absolute',
          inset: 0,
          zIndex: 4,
          pointerEvents: 'none',
        }}>
          <div style={{ position: 'absolute', top: 90, left: 26, display: 'flex', alignItems: 'center', gap: 8 }}>
            <HatchFill style={{ width: 16, height: 7 }} opacity={0.45} />
            <TrackingCode seed="hero-m-tl" variant="hex" />
          </div>
          <div style={{ position: 'absolute', top: 90, right: 26, display: 'flex', alignItems: 'center', gap: 8 }}>
            <TrackingCode seed="hero-m-tr" variant="rec" />
            <HatchFill style={{ width: 16, height: 7 }} opacity={0.45} />
          </div>
          <div style={{ position: 'absolute', bottom: 66, left: 26, display: 'flex', alignItems: 'center', gap: 8 }}>
            <TrackingCode seed="hero-m-bl" variant="channel" />
            <HatchFill style={{ width: 16, height: 7 }} opacity={0.45} />
          </div>
          <div style={{ position: 'absolute', bottom: 66, right: 26, display: 'flex', alignItems: 'center', gap: 8 }}>
            <HatchFill style={{ width: 16, height: 7 }} opacity={0.45} />
            <TrackingCode seed="hero-m-br" variant="lot" />
          </div>
        </div>

        {/* Full-hero vertical black gradient 0→100, fusing into page bg (#000) */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(to bottom,' +
            ' rgba(0,0,0,0) 0%,' +
            ' rgba(0,0,0,0) 35%,' +
            ' rgba(0,0,0,0.18) 55%,' +
            ' rgba(0,0,0,0.5) 75%,' +
            ' rgba(0,0,0,0.85) 92%,' +
            ' #000 100%)',
          zIndex: 2,
          pointerEvents: 'none',
        }} />
      </section>

      {/* ─── 1. SYSTEM OVERVIEW ─── */}
      <section data-section="02" style={{ padding: '200px var(--gutter) 160px', backgroundColor: 'transparent' }}>
        <div style={{ maxWidth: 'var(--max-w)', margin: '0 auto' }}>

          {/* Giant display heading */}
          <h2 data-reveal="up" data-d="2" style={{
            fontFamily: 'var(--font-hero)',
            fontSize: 'clamp(48px, 8.5vw, 128px)',
            fontWeight: 500,
            lineHeight: 0.95,
            letterSpacing: '0.01em',
            textTransform: 'uppercase',
            color: 'var(--text-primary)',
            margin: 0,
            maxWidth: '20ch',
          }}>
            A visual<br />
            encyclopedia of<br />
            <span style={{
              fontFamily: 'var(--font-display)',
              fontStyle: 'italic',
              fontWeight: 300,
              textTransform: 'none',
              letterSpacing: '-0.01em',
              color: 'var(--text-muted)',
            }}>
              worlds beyond
            </span>{' '}
            our solar system.
          </h2>

          {/* Below: copy + CTAs | telemetry rail */}
          <div className="sec01-grid" style={{
            marginTop: 80,
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.15fr) minmax(0, 1fr)',
            gap: 80,
            alignItems: 'start',
          }}>
            {/* Left: copy + CTAs */}
            <div className="sec01-copy">
              <p style={{
                fontSize: 17, color: 'var(--text-muted)', lineHeight: 1.7,
                margin: 0, maxWidth: '56ch',
              }}>
                ExoTerra transforms raw NASA data into interactive 3D visualizations. Every
                planet is procedurally generated from real scientific measurements — temperature,
                mass, radius, and orbital parameters shape its surface, atmosphere, and appearance.
                Built for scientists, educators, and space enthusiasts.
              </p>
            </div>

            {/* Right: telemetry rail with hex + leader lines */}
            <div className="sec01-rail" style={{
              display: 'flex', flexDirection: 'column', gap: 28,
              borderLeft: '1px solid var(--border-hud)',
              paddingLeft: 40,
            }}>
              {[
                { value: stats.totalPlanets > 0 ? stats.totalPlanets.toLocaleString() : '6,158', label: 'Confirmed Exoplanets', code: '01' },
                { value: '8', label: 'Classifications', code: '02' },
                { value: '0–100', label: 'Habitability Range', code: '03' },
              ].map((item) => (
                <div key={item.label} style={{
                  display: 'flex', alignItems: 'center', gap: 18,
                }}>
                  <div style={{
                    width: 48, height: 54,
                    clipPath: 'polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%)',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid var(--border-hud)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--font-mono)', fontSize: 10,
                    color: 'var(--text-primary)', letterSpacing: 1,
                    flexShrink: 0,
                  }}>
                    {item.code}
                  </div>
                  <div style={{
                    flex: 1, height: 1,
                    backgroundImage: 'repeating-linear-gradient(to right, var(--border-hud) 0 6px, transparent 6px 10px)',
                  }} />
                  <div style={{ textAlign: 'right', minWidth: 160 }}>
                    <div style={{
                      fontSize: 34, fontWeight: 700, color: 'var(--text-primary)',
                      fontFamily: 'var(--font-mono)', letterSpacing: '-0.5px',
                      lineHeight: 1,
                    }}>
                      {item.value}
                    </div>
                    <div style={{
                      fontSize: 10, color: 'var(--text-dim)',
                      fontFamily: 'var(--font-mono)',
                      textTransform: 'uppercase', letterSpacing: 1.5,
                      marginTop: 8,
                    }}>
                      {item.label}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════
              KEY INSIGHTS — 4 curated readings drawn from the live archive.
              Pure text + a single big number per row. Information-dense but
              never overwhelming: the eye scans 4 short paragraphs, not charts.
          ═══════════════════════════════════════════════════════════ */}
          <div data-reveal="up" style={{
            marginTop: 140,
            paddingTop: 36,
            borderTop: '1px solid var(--border-hud)',
          }}>
            <div style={{
              display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
              gap: 24, flexWrap: 'wrap', marginBottom: 28,
            }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-primary)', letterSpacing: 3 }}>A.01</span>
                <span style={{ width: 32, height: 1, background: 'var(--hud-line)' }} />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', letterSpacing: 2.5, textTransform: 'uppercase' }}>
                  Key Insights · What the Numbers Reveal
                </span>
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-dim)', letterSpacing: 2 }}>
                LIVE · COMPUTED FROM ARCHIVE
              </span>
            </div>

            {(() => {
              const dominant = stats.typeDistribution[0]
              const rockyClass = stats.typeDistribution.find((t) => t.type === 'rocky')
              const hzPct = stats.totalPlanets > 0 ? (stats.habitableZone / stats.totalPlanets) * 100 : 0
              const yearsSpan = stats.maxYearDist - stats.minYearDist + 1
              const avgPerYear = yearsSpan > 0 ? Math.round(stats.totalPlanets / yearsSpan) : 0

              const insights = [
                {
                  bigNumber: dominant ? `${dominant.percent.toFixed(0)}%` : '—',
                  title: 'Catalog skews to gas',
                  body: dominant
                    ? `${dominant.label} dominate the archive — ${dominant.count.toLocaleString()} of ${stats.totalPlanets.toLocaleString()} entries. Detection methods favor large, hot worlds; small rocky planets like ours are harder to spot, only ${rockyClass ? rockyClass.percent.toFixed(0) : '—'}% of the catalog.`
                    : '—',
                },
                {
                  bigNumber: `${stats.habitableZone.toLocaleString()}`,
                  bigSuffix: ` of ${stats.totalPlanets.toLocaleString()}`,
                  title: 'Sit inside the habitable zone',
                  body: `That's ${hzPct.toFixed(1)}% — roughly 1 in ${stats.habitableZone > 0 ? Math.round(stats.totalPlanets / stats.habitableZone) : '—'}. From those, only ${stats.earthLikeCount.toLocaleString()} cross the score-60 threshold where Earth-like surface chemistry is plausible.`,
                },
                {
                  bigNumber: `${avgPerYear}`,
                  bigSuffix: ' / yr',
                  title: 'Discovery cadence',
                  body: `From the first confirmed detection in ${stats.minYearDist} to today (${yearsSpan} yrs of observation), the average is ~${avgPerYear} new planets per year. The peak — ${stats.peakYear.year} — added ${stats.peakYear.count.toLocaleString()} alone, mostly from telescope data releases.`,
                },
                {
                  bigNumber: stats.topScorerName !== '—' ? `${stats.topScore.toFixed(1)}` : '—',
                  bigSuffix: ' / 100',
                  title: `Top score · ${stats.topScorerName}`,
                  body: `The most Earth-like world currently in the archive. The score combines temperature, stellar flux, radius, mass, and host-star spectral class — a higher number means closer to Earth's measured profile.`,
                },
              ]

              return (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '36px 64px',
                }} className="sec01-insights-grid">
                  {insights.map((ins, i) => (
                    <div
                      key={ins.title}
                      data-reveal="up"
                      data-d={Math.min(i + 1, 8).toString()}
                      style={{ display: 'flex', gap: 18, alignItems: 'flex-start' }}
                    >
                      <span style={{
                        fontFamily: 'var(--font-mono)', fontSize: 10,
                        color: 'var(--text-dim)', letterSpacing: 2,
                        paddingTop: 8, minWidth: 28,
                      }}>
                        {(i + 1).toString().padStart(2, '0')}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          display: 'inline-flex', alignItems: 'baseline', gap: 4,
                          marginBottom: 6,
                        }}>
                          <span style={{
                            fontFamily: 'var(--font-astra)',
                            fontSize: 'clamp(28px, 3.4vw, 44px)',
                            fontWeight: 600,
                            color: 'var(--hud-cyan)',
                            letterSpacing: '0.01em',
                            lineHeight: 1,
                            textShadow: '0 0 18px var(--hud-cyan-glow)',
                          }}>
                            {ins.bigNumber}
                          </span>
                          {ins.bigSuffix && (
                            <span style={{
                              fontFamily: 'var(--font-mono)', fontSize: 12,
                              color: 'var(--text-dim)', letterSpacing: 1,
                            }}>
                              {ins.bigSuffix}
                            </span>
                          )}
                        </div>
                        <div style={{
                          fontFamily: 'var(--font-hero)', fontSize: 14, fontWeight: 500,
                          color: 'var(--text-primary)', letterSpacing: '0.04em',
                          textTransform: 'uppercase',
                          marginBottom: 8,
                        }}>
                          {ins.title}
                        </div>
                        <p style={{
                          fontFamily: 'var(--font-body)', fontSize: 14,
                          color: 'var(--text-muted)', lineHeight: 1.65,
                          margin: 0, maxWidth: '50ch',
                        }}>
                          {ins.body}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )
            })()}
          </div>
        </div>
      </section>

      {/* ─── 2. MISSION SEQUENCE (full-width timeline, no container) ─── */}
      <section data-section="03" style={{ padding: '200px var(--gutter) 140px', backgroundColor: 'transparent' }}>
        <div style={{ maxWidth: 'var(--max-w)', margin: '0 auto' }}>

          {/* Big display heading */}
          <h2 data-reveal="up" data-d="2" style={{
            fontFamily: 'var(--font-hero)',
            fontSize: 'clamp(44px, 7vw, 104px)',
            fontWeight: 500,
            lineHeight: 0.95,
            letterSpacing: '0.01em',
            textTransform: 'uppercase',
            color: 'var(--text-primary)',
            margin: 0,
            maxWidth: '20ch',
          }}>
            From raw data{' '}
            <span style={{
              fontFamily: 'var(--font-display)',
              fontStyle: 'italic',
              fontWeight: 300,
              textTransform: 'none',
              letterSpacing: '-0.01em',
              color: 'var(--text-muted)',
            }}>
              to real-time
            </span>{' '}
            simulation.
          </h2>

          {/* Timeline — full width, enlarged */}
          <div className="timeline-wrap" style={{ marginTop: 96, position: 'relative' }}>
            {/* Continuous vertical spine under the diamond column (col 2 center = 160 + 24 + 40 = 224) */}
            <div className="timeline-spine" style={{
              position: 'absolute',
              left: 224, top: 30, bottom: 30,
              width: 1,
              background: 'linear-gradient(to bottom, transparent 0%, var(--border-hud-strong) 10%, var(--border-hud-strong) 90%, transparent 100%)',
              pointerEvents: 'none',
            }} />

            {[
              { step: '01', chip: 'DATA INGEST', title: 'Data Ingestion', desc: 'Confirmed exoplanet data from the NASA Exoplanet Archive — mass, radius, temperature, orbital parameters, and host star properties.' },
              { step: '02', chip: 'CLASSIFY',   title: 'Classification', desc: 'Each planet classified into 8 types. A habitability score computed from temperature, radius, mass, stellar flux, and star type.' },
              { step: '03', chip: 'RENDER',     title: 'Visual Generation', desc: 'Surface textures mapped and blended with procedural GLSL shaders. Atmosphere, rings, and moons inferred from data.' },
              { step: '04', chip: 'INTERACT',   title: 'Interactive 3D', desc: 'Real-time rendering with Three.js, custom shaders, and orbital controls. Rotate, zoom, and explore any planet.' },
            ].map((item, i, arr) => {
              const secs = i * 4
              const timestamp = `${i === 0 ? 'T-' : 'T+'}00:00:${secs.toString().padStart(2, '0')}`
              return (
                <div
                  key={item.step}
                  data-reveal="up"
                  data-d={Math.min(i + 1, 8).toString()}
                  className="timeline-row"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '160px 80px 200px 1fr',
                    gap: 24,
                    alignItems: 'start',
                    padding: '40px 0',
                    borderBottom: i < arr.length - 1
                      ? '1px dashed var(--border-hud)'
                      : 'none',
                  }}
                >
                  {/* Timestamp */}
                  <div className="timeline-cell timeline-cell-ts" style={{
                    fontFamily: 'var(--font-mono)', fontSize: 13,
                    color: 'var(--text-muted)', letterSpacing: '2px',
                    paddingTop: 10,
                  }}>
                    {timestamp}
                  </div>

                  {/* Diamond node — halo + rhombus concentric + continuous animation */}
                  <div className="timeline-cell timeline-cell-node" style={{
                    position: 'relative',
                    width: 40, height: 40,
                    marginInline: 'auto',
                    marginTop: 10,
                    zIndex: 1,
                  }}>
                    <div
                      className="timeline-halo"
                      style={{
                        position: 'absolute', inset: 0,
                        border: '1px dashed var(--border-hud)',
                        borderRadius: '50%',
                        animationDelay: `${i * -4}s`,
                      }}
                    />
                    <div
                      className="timeline-diamond"
                      style={{
                        position: 'absolute',
                        top: '50%', left: '50%',
                        width: 18, height: 18,
                        background: 'var(--bg-void)',
                        border: '1.5px solid var(--hud-line)',
                        animationDelay: `${i * 0.6}s`,
                      }}
                    />
                  </div>

                  {/* PHASE chip */}
                  <div className="timeline-cell timeline-cell-chip" style={{ paddingTop: 12 }}>
                    <span style={{
                      display: 'inline-block',
                      fontFamily: 'var(--font-mono)', fontSize: 10,
                      padding: '6px 12px',
                      border: '1px solid var(--border-hud-strong)',
                      color: 'var(--text-primary)',
                      letterSpacing: '2px',
                      textTransform: 'uppercase',
                      whiteSpace: 'nowrap',
                    }}>
                      PHASE {item.step} · {item.chip}
                    </span>
                  </div>

                  {/* Title + desc — bigger */}
                  <div className="timeline-cell timeline-cell-body">
                    <h3 style={{
                      fontFamily: 'var(--font-hero)', fontWeight: 500,
                      fontSize: 'clamp(22px, 2.4vw, 32px)',
                      color: 'var(--text-primary)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      margin: 0,
                      lineHeight: 1.05,
                    }}>
                      {item.title}
                    </h3>
                    <p style={{
                      fontSize: 16, color: 'var(--text-muted)',
                      lineHeight: 1.65,
                      marginTop: 14,
                      maxWidth: '68ch',
                    }}>
                      {item.desc}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ─── 3. Planet Types (cards grid) ─── */}
      <section data-section="04" style={{ padding: '140px var(--gutter)', backgroundColor: 'transparent' }}>
        <div style={{ maxWidth: 'var(--max-w)', margin: '0 auto' }}>

          {/* Asymmetric display: HUGE title left, explainer content right */}
          <div className="sec03-asym" style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1fr)',
            gap: 72,
            alignItems: 'end',
          }}>
            {/* Left: display heading, left-aligned */}
            <h2 data-reveal="up" data-d="2" className="sec03-heading" style={{
              fontFamily: 'var(--font-hero)',
              fontSize: 'clamp(48px, 8.5vw, 128px)',
              fontWeight: 500,
              lineHeight: 0.92,
              letterSpacing: '0.01em',
              textTransform: 'uppercase',
              color: 'var(--text-primary)',
              margin: 0,
              textAlign: 'left',
            }}>
              Eight{' '}
              <span style={{
                fontFamily: 'var(--font-display)',
                fontStyle: 'italic',
                fontWeight: 300,
                textTransform: 'none',
                letterSpacing: '-0.01em',
                color: 'var(--text-muted)',
              }}>
                classes
              </span><br />
              of world.
            </h2>

            {/* Right: explainer content */}
            <div className="sec03-copy">
              <div style={{
                fontFamily: 'var(--font-mono)', fontSize: 10,
                color: 'var(--text-dim)', letterSpacing: 2, textTransform: 'uppercase',
                marginBottom: 14,
              }}>
                Why classification matters
              </div>
              <p style={{
                fontSize: 16, color: 'var(--text-muted)', lineHeight: 1.7,
                margin: 0, maxWidth: '46ch',
              }}>
                Every confirmed exoplanet is sorted into one of eight classes based on
                mass, radius, equilibrium temperature, and stellar flux. Classification
                isn't decoration — it drives the visual generation pipeline, the
                habitability scoring, and how each world reads at a glance.
              </p>

              <div className="sec03-keyfacts" style={{
                marginTop: 28,
                display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 20px',
                paddingTop: 20,
                borderTop: '1px dashed var(--border-hud)',
              }}>
                {[
                  { label: 'Input Params', value: 'M · R · T · F' },
                  { label: 'Dataset Size', value: stats.totalPlanets > 0 ? stats.totalPlanets.toLocaleString() : '6,158' },
                  { label: 'Sort Method',  value: 'Hierarchical' },
                  { label: 'Update Cycle', value: 'Per sync' },
                ].map((t) => (
                  <div key={t.label} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <span className="hud-label">{t.label}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-primary)' }}>
                      {t.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 16,
            marginTop: 80,
          }}>
            {[
              { icon: Mountain,  key: 'rocky',         name: 'Rocky',         desc: 'Small, dense worlds with solid surfaces. Similar to Earth, Mars, or Mercury.',             radius: '0.5–1.5', mass: '0.1–2',   temp: '200–400' },
              { icon: Globe,     key: 'super_earth',   name: 'Super Earth',   desc: 'Rocky planets larger than Earth but smaller than Neptune. Strong gravity, diverse conditions.', radius: '1.5–2.5', mass: '2–10',    temp: '250–500' },
              { icon: Wind,      key: 'gas_giant',     name: 'Gas Giant',     desc: 'Massive hydrogen-helium worlds like Jupiter. No solid surface, powerful storm systems.',    radius: '8–15',    mass: '100–1000',temp: '100–300' },
              { icon: Flame,     key: 'hot_jupiter',   name: 'Hot Jupiter',   desc: 'Gas giants extremely close to their stars. Temperatures exceed 1000 K with exotic atmospheres.', radius: '10–20',   mass: '100–3000',temp: '1000–2500' },
              { icon: Snowflake, key: 'ice_giant',     name: 'Ice Giant',     desc: 'Composed of water, ammonia, and methane ices. Blue-green atmospheres with extreme winds.',  radius: '3–6',     mass: '10–50',   temp: '50–150' },
              { icon: Droplets,  key: 'mini_neptune',  name: 'Mini Neptune',  desc: 'Significant gaseous envelopes. Transitional class between super-Earths and gas giants.',    radius: '2–4',     mass: '5–15',    temp: '150–350' },
              { icon: Flame,     key: 'lava_world',    name: 'Lava World',    desc: 'Surfaces of molten rock. Magma oceans, volcanic eruptions, mineral vapor atmospheres.',     radius: '0.8–2',   mass: '1–5',     temp: '1200–3000' },
              { icon: Snowflake, key: 'frozen_rocky',  name: 'Frozen Rocky',  desc: 'Cold terrestrial worlds locked in permanent ice. Possible subsurface oceans beneath the crust.', radius: '0.3–1.2', mass: '0.05–1',  temp: '30–180' },
            ].map((item, i) => {
              const count = planets.filter(p => p.planet_type === item.key).length
              const code = `TYPE_${(i + 1).toString().padStart(2, '0')}`
              const Icon = item.icon
              return (
                <div
                  key={item.key}
                  data-reveal="up"
                  data-d={Math.min(i + 1, 8).toString()}
                  className="hud-card"
                  style={{
                    position: 'relative',
                    border: '1px solid var(--border-hud)',
                    padding: '20px 20px 18px',
                  }}
                >
                  <CornerBrackets size={8} inset={-1} color="var(--hud-line)" thickness={1} />

                  {/* Header: TYPE_0X + barcode */}
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    gap: 8, marginBottom: 18,
                  }}>
                    <span style={{
                      fontFamily: 'var(--font-mono)', fontSize: 9,
                      color: 'var(--text-dim)', letterSpacing: 1.5,
                    }}>
                      {code}
                    </span>
                    <Barcode seed={`type-${item.key}`} bars={22} height={12} />
                  </div>

                  {/* Icon + title */}
                  <div style={{
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', gap: 14,
                    paddingBlock: '8px 14px',
                  }}>
                    <div style={{
                      width: 64, height: 64,
                      border: '1px solid var(--border-hud)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      clipPath: 'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)',
                    }}>
                      <Icon size={26} strokeWidth={1.2} style={{ color: 'var(--text-primary)' }} />
                    </div>
                    <h3 style={{
                      fontFamily: 'var(--font-hero)', fontSize: 14, fontWeight: 500,
                      color: 'var(--text-primary)', letterSpacing: '0.08em',
                      textTransform: 'uppercase', margin: 0, textAlign: 'center',
                    }}>
                      {item.name}
                    </h3>
                  </div>

                  {/* Description */}
                  <p style={{
                    fontSize: 12, color: 'var(--text-muted)',
                    lineHeight: 1.6, marginTop: 10, marginBottom: 16,
                    minHeight: '4.8em',
                  }}>
                    {item.desc}
                  </p>

                  {/* Telemetry block */}
                  <div style={{
                    borderTop: '1px dashed var(--border-hud)',
                    paddingTop: 12,
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '8px 12px',
                  }}>
                    {[
                      { label: 'RADIUS',  value: item.radius, unit: 'R⊕' },
                      { label: 'MASS',    value: item.mass,   unit: 'M⊕' },
                      { label: 'TEMP',    value: item.temp,   unit: 'K' },
                      { label: 'INDEXED', value: count > 0 ? count.toLocaleString() : '—' },
                    ].map((t) => (
                      <div key={t.label} style={{
                        display: 'flex', flexDirection: 'column', gap: 2,
                      }}>
                        <span className="hud-label">{t.label}</span>
                        <span style={{
                          fontFamily: 'var(--font-mono)', fontSize: 11,
                          color: 'var(--text-primary)', letterSpacing: '0.5px',
                        }}>
                          {t.value}
                          {t.unit && <span style={{ marginLeft: 3, fontSize: 9, color: 'var(--text-dim)' }}>{t.unit}</span>}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ─── 4. HABITABILITY SCORE (full-width, stacked, no containers) ─── */}
      <section data-section="05" style={{ padding: '140px var(--gutter)', backgroundColor: 'transparent' }}>
        <div style={{ maxWidth: 'var(--max-w)', margin: '0 auto' }}>

          {/* Centered huge display heading + copy flanking */}
          <div style={{ marginTop: 72, textAlign: 'center' }}>
            <h2 data-reveal="up" data-d="2" style={{
              fontFamily: 'var(--font-hero)',
              fontSize: 'clamp(52px, 9vw, 140px)',
              fontWeight: 500,
              lineHeight: 0.92,
              letterSpacing: '0.01em',
              textTransform: 'uppercase',
              color: 'var(--text-primary)',
              margin: 0,
            }}>
              Scoring{' '}
              <span style={{
                fontFamily: 'var(--font-display)',
                fontStyle: 'italic',
                fontWeight: 300,
                textTransform: 'none',
                letterSpacing: '-0.01em',
                color: 'var(--text-muted)',
              }}>
                the likelihood
              </span>{' '}
              of life.
            </h2>
            <p style={{
              fontSize: 17, color: 'var(--text-muted)', lineHeight: 1.7,
              margin: '36px auto 0',
              maxWidth: '62ch',
            }}>
              Every planet in the archive receives a score from 0 to 100 measuring how
              closely its conditions resemble Earth. Five factors — derived from direct
              observation — are weighted and summed. Scores above 60 mark candidate
              worlds where liquid water and a temperate atmosphere are plausible.
            </p>
          </div>

          {/* ── Scoring scale section ── */}
          <div style={{
            marginTop: 96,
            display: 'grid',
            gridTemplateColumns: 'minmax(220px, 280px) 1fr',
            gap: 64,
            alignItems: 'start',
          }}>
            <div>
              <div style={{
                fontFamily: 'var(--font-mono)', fontSize: 10,
                color: 'var(--text-dim)', letterSpacing: 2, textTransform: 'uppercase',
                marginBottom: 10,
              }}>
                Read · The Scale
              </div>
              <h3 style={{
                fontFamily: 'var(--font-hero)', fontSize: 22, fontWeight: 500,
                color: 'var(--text-primary)', letterSpacing: '0.04em',
                textTransform: 'uppercase', margin: 0, lineHeight: 1.2,
              }}>
                Three Tiers,<br />One Axis.
              </h3>
              <p style={{
                fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.7,
                marginTop: 14, maxWidth: '34ch',
              }}>
                The scale breaks at 30 and 60. Below 30, a surface environment is
                unlikely to support liquid water. Above 60, the world sits inside the
                canonical habitable zone.
              </p>
            </div>

            {/* Big scale */}
            <div data-reveal="up" data-d="2" style={{ paddingTop: 8 }}>
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                fontFamily: 'var(--font-mono)', fontSize: 10,
                color: 'var(--text-dim)', letterSpacing: 1.5,
                marginBottom: 8,
              }}>
                <span>0</span>
                <span style={{ position: 'relative', left: '-6%' }}>30</span>
                <span style={{ position: 'relative', left: '-3%' }}>60</span>
                <span>100</span>
              </div>

              {/* Bar + ticks */}
              <div style={{ position: 'relative', height: 26 }}>
                {/* Base line */}
                <div style={{
                  position: 'absolute', left: 0, right: 0, top: '50%',
                  height: 1, background: 'var(--border-hud)',
                }} />
                {/* Segments as overlay bars — scaleX grow on reveal */}
                <div
                  className="scale-segment"
                  style={{
                    position: 'absolute', left: 0, top: '50%',
                    width: '30%', height: 3,
                    background: 'rgba(255,255,255,0.12)',
                    marginTop: -1.5,
                    ['--d' as string]: '300ms',
                  }}
                />
                <div
                  className="scale-segment"
                  style={{
                    position: 'absolute', left: '30%', top: '50%',
                    width: '30%', height: 3,
                    background: 'rgba(255,255,255,0.32)',
                    marginTop: -1.5,
                    ['--d' as string]: '500ms',
                  }}
                />
                <div
                  className="scale-segment"
                  style={{
                    position: 'absolute', left: '60%', top: '50%',
                    width: '40%', height: 3,
                    background: 'var(--text-primary)',
                    marginTop: -1.5,
                    ['--d' as string]: '700ms',
                  }}
                />
                {/* Breakpoint ticks */}
                {[0, 30, 60, 100].map((p) => (
                  <div key={p} style={{
                    position: 'absolute',
                    left: `${p}%`,
                    top: 0, bottom: 0,
                    width: 1,
                    background: 'var(--hud-line)',
                    transform: 'translateX(-0.5px)',
                  }} />
                ))}
                {/* Minor ticks every 10 */}
                {[10, 20, 40, 50, 70, 80, 90].map((p) => (
                  <div key={p} style={{
                    position: 'absolute',
                    left: `${p}%`,
                    top: '35%', bottom: '35%',
                    width: 1,
                    background: 'var(--border-hud)',
                    transform: 'translateX(-0.5px)',
                  }} />
                ))}
              </div>

              {/* Segment labels */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '30% 30% 40%',
                marginTop: 14,
                fontFamily: 'var(--font-mono)', fontSize: 10,
                letterSpacing: 1.5, textTransform: 'uppercase',
              }}>
                <div>
                  <div style={{ color: 'var(--text-dim)' }}>&lt; 30</div>
                  <div style={{ color: 'var(--text-muted)', marginTop: 3 }}>Unlikely</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)' }}>30 – 59</div>
                  <div style={{ color: 'var(--text-muted)', marginTop: 3 }}>Partial</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-primary)' }}>60 +</div>
                  <div style={{ color: 'var(--text-primary)', marginTop: 3 }}>Earth-like</div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Weighting Matrix — full-width stacked factor gauges ── */}
          <div style={{
            marginTop: 96,
            display: 'grid',
            gridTemplateColumns: '1fr minmax(220px, 280px)',
            gap: 64,
            alignItems: 'start',
          }}>
            {/* Big factor gauges */}
            <div>
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
                marginBottom: 28,
                paddingBottom: 14,
                borderBottom: '1px solid var(--border-hud)',
                fontFamily: 'var(--font-mono)', fontSize: 10,
                color: 'var(--text-dim)', letterSpacing: 1.5, textTransform: 'uppercase',
              }}>
                <span>5 factors · normalised to 100%</span>
                <span>Σ = 100.0</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                {[
                  { factor: 'Temperature',    weight: 25, ideal: '255–310',   unit: 'K',    why: 'Liquid water requires 255–373 K surface range; equilibrium temp is the closest proxy.' },
                  { factor: 'Habitable Zone', weight: 25, ideal: '0.25–2.0',  unit: 'S⊕',   why: 'Stellar flux relative to Earth. Outside this band, surface water freezes or boils.' },
                  { factor: 'Radius',         weight: 20, ideal: '0.5–1.5',   unit: 'R⊕',   why: 'Too small loses atmosphere; too large becomes a mini-Neptune with thick H/He envelope.' },
                  { factor: 'Mass',           weight: 15, ideal: '0.5–5',     unit: 'M⊕',   why: 'Gravity must hold an atmosphere and drive plate tectonics without crushing surface life.' },
                  { factor: 'Star Type',      weight: 15, ideal: 'G / K',     unit: 'SPEC', why: 'Sun-like stars offer long, stable main-sequence lifetimes without lethal flare rates.' },
                ].map((item, i) => {
                  const fillPct = item.weight * 4
                  const code = `F_${(i + 1).toString().padStart(2, '0')}`
                  return (
                    <div key={item.factor} data-reveal="up" data-d={Math.min(i + 1, 8).toString()}>
                      {/* Top row: label + value */}
                      <div style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
                        marginBottom: 10,
                      }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
                          <span style={{
                            fontFamily: 'var(--font-mono)', fontSize: 10,
                            color: 'var(--text-dim)', letterSpacing: 1.5,
                          }}>
                            {code}
                          </span>
                          <span style={{
                            fontFamily: 'var(--font-hero)', fontSize: 'clamp(18px, 2vw, 24px)', fontWeight: 500,
                            color: 'var(--text-primary)', letterSpacing: '0.06em',
                            textTransform: 'uppercase',
                          }}>
                            {item.factor}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
                          <span style={{
                            fontFamily: 'var(--font-mono)', fontSize: 12,
                            color: 'var(--text-muted)', letterSpacing: 0.5,
                          }}>
                            {item.ideal}
                            <span style={{ marginLeft: 4, fontSize: 10, color: 'var(--text-dim)' }}>{item.unit}</span>
                          </span>
                          <span style={{
                            fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 500,
                            color: 'var(--text-primary)', letterSpacing: '-0.5px',
                            minWidth: 54, textAlign: 'right',
                          }}>
                            {item.weight}%
                          </span>
                        </div>
                      </div>

                      {/* Gauge bar — animated on reveal */}
                      <div
                        style={{
                          position: 'relative', height: 28,
                          ['--fill-target' as string]: `${fillPct}%`,
                          ['--marker-pos' as string]: `${fillPct}%`,
                        }}
                      >
                        <div style={{
                          position: 'absolute', inset: 0,
                          border: '1px solid var(--border-hud)',
                        }} />
                        <div
                          className="gauge-fill"
                          style={{
                            position: 'absolute', left: 0, top: 0, bottom: 0,
                            width: `${fillPct}%`,
                            background:
                              'linear-gradient(to right, rgba(255,255,255,0.18), rgba(255,255,255,0.45))',
                          }}
                        />
                        {Array.from({ length: 11 }).map((_, k) => {
                          const isMajor = k % 5 === 0
                          return (
                            <div key={k} style={{
                              position: 'absolute',
                              left: `${k * 10}%`,
                              top: isMajor ? 0 : '35%',
                              bottom: isMajor ? 0 : '35%',
                              width: 1,
                              background: isMajor ? 'var(--hud-line)' : 'var(--border-hud)',
                              transform: 'translateX(-0.5px)',
                            }} />
                          )
                        })}
                        <div
                          className="gauge-marker"
                          style={{
                            position: 'absolute',
                            left: `${fillPct}%`,
                            top: -6, bottom: -6,
                            width: 1,
                            background: 'var(--hud-line)',
                            transform: 'translateX(-0.5px)',
                          }}
                        />
                        <div
                          className="gauge-marker"
                          style={{
                            position: 'absolute',
                            left: `${fillPct}%`,
                            top: -8,
                            width: 8, height: 8,
                            background: 'var(--hud-line)',
                            transform: 'translate(-50%, 0) rotate(45deg)',
                          }}
                        />
                      </div>

                      {/* Rationale below each gauge */}
                      <p style={{
                        fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6,
                        marginTop: 10, maxWidth: '78ch',
                      }}>
                        {item.why}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Right sidebar: methodology note */}
            <aside>
              <div style={{
                fontFamily: 'var(--font-mono)', fontSize: 10,
                color: 'var(--text-dim)', letterSpacing: 2, textTransform: 'uppercase',
                marginBottom: 10,
              }}>
                Read · The Matrix
              </div>
              <h3 style={{
                fontFamily: 'var(--font-hero)', fontSize: 22, fontWeight: 500,
                color: 'var(--text-primary)', letterSpacing: '0.04em',
                textTransform: 'uppercase', margin: 0, lineHeight: 1.2,
              }}>
                Five Factors,<br />One Signal.
              </h3>
              <p style={{
                fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.7,
                marginTop: 14, maxWidth: '34ch',
              }}>
                Weights are chosen to reflect what observational astronomy can
                currently measure with high confidence. Temperature and stellar flux
                dominate because they most directly predict liquid water. Mass and
                host-star spectral class are secondary but still matter for long-term
                stability.
              </p>
              <div style={{
                marginTop: 20,
                paddingTop: 16,
                borderTop: '1px dashed var(--border-hud)',
                fontFamily: 'var(--font-mono)', fontSize: 10,
                color: 'var(--text-dim)', letterSpacing: 1.5, textTransform: 'uppercase',
                lineHeight: 1.8,
              }}>
                <div>Model · Weighted Linear</div>
                <div>Range · 0 → 100</div>
                <div>Updated · Per sync cycle</div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* ─── 5. MISSION READOUT (4 unit panels) ─── */}
      <section data-section="06" style={{ padding: '140px var(--gutter)', backgroundColor: 'transparent' }}>
        <div style={{ maxWidth: 'var(--max-w)', margin: '0 auto' }}>

          {/* Asymmetric: HUGE title left, copy right (mobile stacks title-first) */}
          <div className="sec05-asym" style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.6fr) minmax(0, 1fr)',
            gap: 72,
            alignItems: 'end',
          }}>
            <h2 data-reveal="up" data-d="2" className="sec05-heading" style={{
              fontFamily: 'var(--font-hero)',
              fontSize: 'clamp(48px, 8vw, 120px)',
              fontWeight: 500,
              lineHeight: 0.92,
              letterSpacing: '0.01em',
              textTransform: 'uppercase',
              color: 'var(--text-primary)',
              margin: 0,
              textAlign: 'left',
            }}>
              A catalogue{' '}
              <span style={{
                fontFamily: 'var(--font-display)',
                fontStyle: 'italic',
                fontWeight: 300,
                textTransform: 'none',
                letterSpacing: '-0.01em',
                color: 'var(--text-muted)',
              }}>
                that breathes
              </span>.
            </h2>

            <div className="sec05-copy">
              <div style={{
                fontFamily: 'var(--font-mono)', fontSize: 10,
                color: 'var(--text-dim)', letterSpacing: 2, textTransform: 'uppercase',
                marginBottom: 14,
              }}>
                What these numbers mean
              </div>
              <p style={{
                fontSize: 16, color: 'var(--text-muted)', lineHeight: 1.7,
                margin: 0, maxWidth: '46ch',
              }}>
                Every figure below is pulled from the live Supabase mirror of the NASA
                Exoplanet Archive — not cached constants. Units refresh on each page
                load and reflect the exact state of the catalogue right now, including
                pending additions from current observation campaigns.
              </p>
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 16,
            marginTop: 96,
            alignItems: 'stretch',
          }}>
            {statItems.map((item, i) => {
              const code = `UNIT_${(i + 1).toString().padStart(2, '0')}`
              const status: 'live' | 'idle' = i < 2 ? 'live' : 'idle'
              return (
                <div
                  key={item.label}
                  data-reveal="up"
                  data-d={Math.min(i + 1, 8).toString()}
                  style={{ display: 'flex', flexDirection: 'column' }}
                >
                <HUDPanel
                  id={code}
                  status={status}
                  padding="22px 22px 18px"
                  compact
                  style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
                >
                  <div style={{
                    display: 'flex', flexDirection: 'column',
                    gap: 16,
                    flex: 1,
                  }}>
                    {/* Big value */}
                    <div style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: item.small ? 20 : 44,
                      fontWeight: item.small ? 500 : 600,
                      color: 'var(--text-primary)',
                      letterSpacing: item.small ? 0 : '-0.02em',
                      lineHeight: 1,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}>
                      {item.value}
                    </div>

                    {/* Label */}
                    <div style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 10,
                      color: 'var(--text-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: 1.5,
                    }}>
                      {item.label}
                    </div>

                    {/* Sparkline footer */}
                    <div style={{ marginTop: 'auto', paddingTop: 4 }}>
                      <Sparkline
                        seed={`unit-${i}-${item.value}`}
                        points={28}
                        height={22}
                      />
                      <div style={{
                        display: 'flex', justifyContent: 'space-between',
                        marginTop: 6,
                        fontFamily: 'var(--font-mono)', fontSize: 9,
                        color: 'var(--text-dim)', letterSpacing: 1.5,
                      }}>
                        <span>T-30D</span>
                        <span>NOW</span>
                      </div>
                    </div>
                  </div>
                </HUDPanel>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ─── 6. FEATURED TARGETS (planet mini-HUD cards) ─── */}
      <section data-section="07" style={{ padding: '140px var(--gutter)', backgroundColor: 'transparent' }}>
        <div style={{ maxWidth: 'var(--max-w)', margin: '0 auto' }}>

          {/* Centered display heading + methodology */}
          <div style={{ marginTop: 72, textAlign: 'center' }}>
            <h2 data-reveal="up" data-d="2" style={{
              fontFamily: 'var(--font-hero)',
              fontSize: 'clamp(48px, 8.5vw, 128px)',
              fontWeight: 500,
              lineHeight: 0.92,
              letterSpacing: '0.01em',
              textTransform: 'uppercase',
              color: 'var(--text-primary)',
              margin: 0,
            }}>
              Six worlds{' '}
              <span style={{
                fontFamily: 'var(--font-display)',
                fontStyle: 'italic',
                fontWeight: 300,
                textTransform: 'none',
                letterSpacing: '-0.01em',
                color: 'var(--text-muted)',
              }}>
                closest to
              </span><br />
              home.
            </h2>
            <p style={{
              fontSize: 17, color: 'var(--text-muted)', lineHeight: 1.7,
              margin: '32px auto 0',
              maxWidth: '64ch',
            }}>
              The six highest-scoring exoplanets in the archive, selected live from all
              confirmed targets sorted by habitability index. Each card shows the real
              surface texture and a full telemetry readout — click any to open its
              complete HUD profile with 3D reconstruction.
            </p>

            {/* Small legend row */}
            <div style={{
              display: 'inline-flex', gap: 32, flexWrap: 'wrap',
              marginTop: 36, paddingTop: 20,
              borderTop: '1px dashed var(--border-hud)',
              fontFamily: 'var(--font-mono)', fontSize: 10,
              color: 'var(--text-dim)', letterSpacing: 1.5, textTransform: 'uppercase',
            }}>
              <span>Gauge · Habitability 0–100</span>
              <span>HZ · In Habitable Zone</span>
              <span>Orb · Real NASA surface texture</span>
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 16, marginTop: 72,
          }}>
            {featuredPlanets.map((planet, i) => {
              const score = planet.habitability_score
              const code = `TGT_${(i + 1).toString().padStart(3, '0')}`
              const C = 2 * Math.PI * 26 // circumference of gauge r=26
              const dash = (score / 100) * C
              return (
                <Link
                  key={planet.id}
                  to={`/explore/${encodeURIComponent(planet.pl_name)}`}
                  className="hud-card"
                  data-reveal="up"
                  data-d={Math.min(i + 1, 8).toString()}
                  style={{
                    position: 'relative',
                    display: 'block',
                    border: '1px solid var(--border-hud)',
                    padding: '20px 22px 18px',
                    textDecoration: 'none',
                    color: 'inherit',
                  }}
                >
                  <span className="hud-card__march" />
                  <CornerBrackets size={8} inset={-1} color="var(--hud-line)" thickness={1} />

                  {/* Header: code + HZ + barcode */}
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    gap: 8, marginBottom: 16,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-dim)', letterSpacing: 1.5 }}>
                        {code}
                      </span>
                      {planet.in_habitable_zone && (
                        <span style={{
                          fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 600,
                          padding: '2px 7px',
                          border: '1px solid var(--border-hud-strong)',
                          color: 'var(--text-primary)',
                          letterSpacing: 1.5,
                        }}>
                          HZ · CONFIRMED
                        </span>
                      )}
                    </div>
                    <Barcode seed={`tgt-${planet.pl_name}`} bars={18} height={10} />
                  </div>

                  {/* Body: orb + info */}
                  <div style={{ display: 'flex', gap: 18, alignItems: 'center' }}>
                    {/* Planet orb + HUD markers */}
                    <div style={{ position: 'relative', width: 112, height: 112, flexShrink: 0 }}>
                      <div style={{
                        position: 'absolute', inset: 6,
                        ...planetOrbStyle(planet),
                      }} />
                      {/* Orbit ring */}
                      <svg
                        viewBox="-60 -60 120 120"
                        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
                        aria-hidden
                      >
                        <circle cx="0" cy="0" r="54" fill="none"
                          stroke="var(--border-hud)" strokeWidth="0.5"
                          strokeDasharray="2 3" />
                        {/* 4 ticks */}
                        {[0, 90, 180, 270].map((a) => (
                          <line key={a}
                            x1="48" y1="0" x2="56" y2="0" stroke="var(--hud-line)" strokeWidth="0.8"
                            transform={`rotate(${a})`}
                          />
                        ))}
                        {/* anchor dot for marker */}
                        <circle cx="38" cy="-38" r="1.2" fill="var(--hud-line)" />
                      </svg>
                      {/* Mini tag */}
                      <span style={{
                        position: 'absolute',
                        top: -2, right: -8,
                        fontFamily: 'var(--font-mono)', fontSize: 8,
                        color: 'var(--text-dim)', letterSpacing: 1,
                      }}>
                        {planet.planet_type.replace('_', ' ').toUpperCase().slice(0, 10)}
                      </span>
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3 style={{
                        fontFamily: 'var(--font-hero)', fontSize: 16, fontWeight: 500,
                        letterSpacing: '0.04em', textTransform: 'uppercase',
                        color: 'var(--text-primary)',
                        margin: 0,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {planet.pl_name}
                      </h3>
                      <div style={{
                        fontFamily: 'var(--font-mono)', fontSize: 10,
                        color: 'var(--text-muted)', letterSpacing: 1,
                        marginTop: 4, textTransform: 'uppercase',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        HOST · {planet.hostname}
                      </div>

                      {/* Mini telemetry */}
                      <div style={{
                        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 8px',
                        marginTop: 14,
                        paddingTop: 10,
                        borderTop: '1px dashed var(--border-hud)',
                      }}>
                        {[
                          { label: 'RADIUS', value: planet.pl_rade !== null ? planet.pl_rade.toFixed(2) : '—', unit: 'R⊕' },
                          { label: 'TEMP',   value: planet.pl_eqt !== null ? planet.pl_eqt.toFixed(0) : '—',   unit: 'K' },
                          { label: 'DIST',   value: planet.sy_dist !== null ? planet.sy_dist.toFixed(1) : '—', unit: 'PC' },
                          { label: 'DISC',   value: planet.disc_year?.toString() ?? '—' },
                        ].map((t) => (
                          <div key={t.label} style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            <span className="hud-label" style={{ fontSize: 8 }}>{t.label}</span>
                            <span style={{
                              fontFamily: 'var(--font-mono)', fontSize: 11,
                              color: 'var(--text-primary)',
                            }}>
                              {t.value}
                              {t.unit && <span style={{ marginLeft: 3, fontSize: 9, color: 'var(--text-dim)' }}>{t.unit}</span>}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Footer: circular score gauge */}
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    marginTop: 18, paddingTop: 14,
                    borderTop: '1px dashed var(--border-hud)',
                  }}>
                    <svg width={64} height={64} viewBox="-32 -32 64 64" aria-hidden>
                      {/* Outer ticks */}
                      {Array.from({ length: 24 }).map((_, k) => (
                        <line key={k}
                          x1="30" y1="0" x2={k % 6 === 0 ? '27' : '28.5'} y2="0"
                          stroke="var(--border-hud)" strokeWidth="0.6"
                          transform={`rotate(${k * 15})`}
                        />
                      ))}
                      {/* Track */}
                      <circle cx="0" cy="0" r="26" fill="none"
                        stroke="var(--border-hud)" strokeWidth="1.5" />
                      {/* Progress arc — draws on reveal */}
                      <circle cx="0" cy="0" r="26" fill="none"
                        className="score-arc"
                        stroke="var(--text-primary)" strokeWidth="1.5"
                        strokeDasharray={`${dash.toFixed(2)} ${C.toFixed(2)}`}
                        strokeLinecap="round"
                        transform="rotate(-90)"
                        style={{ ['--arc-dash' as string]: `${dash.toFixed(2)}px` }}
                      />
                      <text
                        x="0" y="1"
                        textAnchor="middle" dominantBaseline="middle"
                        fill="var(--text-primary)"
                        style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 600 }}
                      >
                        {score.toFixed(0)}
                      </text>
                      <text
                        x="0" y="12"
                        textAnchor="middle"
                        fill="var(--text-dim)"
                        style={{ fontFamily: 'var(--font-mono)', fontSize: 5, letterSpacing: 1 }}
                      >
                        / 100
                      </text>
                    </svg>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontFamily: 'var(--font-mono)', fontSize: 9,
                        color: 'var(--text-dim)', letterSpacing: 1.5, textTransform: 'uppercase',
                      }}>
                        Habitability Score
                      </div>
                      <div style={{
                        fontFamily: 'var(--font-hero)', fontSize: 13, fontWeight: 500,
                        color: 'var(--text-primary)', letterSpacing: '0.06em',
                        textTransform: 'uppercase', marginTop: 2,
                      }}>
                        {score >= 60 ? 'Earth-like' : score >= 30 ? 'Partial Match' : 'Unlikely'}
                      </div>
                    </div>
                    <span style={{
                      fontFamily: 'var(--font-mono)', fontSize: 9,
                      color: 'var(--text-primary)', letterSpacing: 2,
                      padding: '4px 8px',
                      border: '1px solid var(--border-hud-strong)',
                    }}>
                      OPEN →
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* ─── 7. DETECTION RADAR ─── */}
      <section data-section="08" style={{ padding: '140px var(--gutter)', backgroundColor: 'transparent' }}>
        <div style={{ maxWidth: 'var(--max-w)', margin: '0 auto' }}>

          {/* Big display heading, left-aligned with right-aligned copy */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)',
            gap: 72,
            alignItems: 'end',
          }}>
            <h2 data-reveal="up" data-d="2" style={{
              fontFamily: 'var(--font-hero)',
              fontSize: 'clamp(48px, 8.5vw, 128px)',
              fontWeight: 500,
              lineHeight: 0.92,
              letterSpacing: '0.01em',
              textTransform: 'uppercase',
              color: 'var(--text-primary)',
              margin: 0,
            }}>
              How we{' '}
              <span style={{
                fontFamily: 'var(--font-display)',
                fontStyle: 'italic',
                fontWeight: 300,
                textTransform: 'none',
                letterSpacing: '-0.01em',
                color: 'var(--text-muted)',
              }}>
                find
              </span>{' '}
              new worlds.
            </h2>

            <div>
              <div style={{
                fontFamily: 'var(--font-mono)', fontSize: 10,
                color: 'var(--text-dim)', letterSpacing: 2, textTransform: 'uppercase',
                marginBottom: 12,
              }}>
                Six Methods · One Radar
              </div>
              <p style={{
                fontSize: 16, color: 'var(--text-muted)', lineHeight: 1.7,
                margin: 0, maxWidth: '44ch',
              }}>
                No telescope sees an exoplanet directly most of the time. Instead,
                astronomers infer planets from the tiny fingerprints they leave on
                starlight. Transit dips, stellar wobbles, gravitational lensing —
                each technique is a separate needle, threading a different kind of signal.
              </p>
            </div>
          </div>

          {/* Radar + detailed list below */}
          <div style={{
            marginTop: 96,
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
            gap: 72,
            alignItems: 'start',
          }}>
            {/* Left: radar SVG, no container.
                viewBox includes extra ±40u of padding outside the outer ring (r=275)
                so labels at radius 305+ never clip against the SVG edge. */}
            <div style={{ position: 'relative', width: '100%', aspectRatio: '1 / 1', maxWidth: 640, margin: '0 auto' }}>
              <svg viewBox="-360 -360 720 720" width="100%" height="100%" aria-hidden style={{ overflow: 'visible' }}>
                {/* Concentric rings */}
                {[80, 150, 220, 275].map((r, i) => (
                  <circle key={r} cx="0" cy="0" r={r}
                    fill="none"
                    stroke={i === 3 ? 'var(--hud-line)' : 'var(--border-hud)'}
                    strokeWidth={i === 3 ? 1 : 0.6}
                    strokeDasharray={i === 3 ? '0' : '2 3'}
                  />
                ))}
                {/* Crosshairs */}
                {[0, 45, 90, 135].map((a) => (
                  <line key={a}
                    x1="-280" y1="0" x2="280" y2="0"
                    stroke="var(--border-hud)" strokeWidth="0.5"
                    strokeDasharray="1 4"
                    transform={`rotate(${a})`}
                  />
                ))}
                {/* Degree ticks around outer ring */}
                {Array.from({ length: 36 }).map((_, k) => {
                  const isMajor = k % 9 === 0
                  return (
                    <line key={k}
                      x1={isMajor ? 268 : 272} y1="0" x2="275" y2="0"
                      stroke={isMajor ? 'var(--hud-line)' : 'var(--border-hud)'}
                      strokeWidth={isMajor ? 1 : 0.6}
                      transform={`rotate(${k * 10})`}
                    />
                  )
                })}
                {/* Center crosshair */}
                <circle cx="0" cy="0" r="3" fill="var(--hud-line)" />
                <circle cx="0" cy="0" r="10" fill="none" stroke="var(--hud-line)" strokeWidth="0.6" />

                {/* Method points */}
                {DISCOVERY_METHODS.map((method, i) => {
                  const count = methodCounts[method.key] ?? 0
                  const maxCount = Math.max(
                    ...DISCOVERY_METHODS.map((m) => methodCounts[m.key] ?? 0),
                    1,
                  )
                  const ratio = Math.max(0.18, count / maxCount)
                  const r = 60 + ratio * 200 // 60 → 260
                  const angleDeg = -90 + i * 60 // start at top, 60° steps
                  const rad = (angleDeg * Math.PI) / 180
                  const x = Math.cos(rad) * r
                  const y = Math.sin(rad) * r
                  // Labels sit OUTSIDE the outer ring (r=275) with 30u of padding
                  const labelRadius = 305
                  const lx = Math.cos(rad) * labelRadius
                  const ly = Math.sin(rad) * labelRadius
                  const anchor: 'start' | 'middle' | 'end' =
                    Math.abs(lx) < 40 ? 'middle' : lx > 0 ? 'start' : 'end'
                  // Short labels for tight spacing — original key kept for store/filters
                  const shortLabel =
                    method.key === 'Radial Velocity' ? 'RADIAL VEL'
                    : method.key === 'Transit Timing Variations' ? 'TTV'
                    : method.key === 'Pulsar Timing' ? 'PULSAR'
                    : method.key.toUpperCase()
                  return (
                    <g key={method.key}>
                      {/* Leader line from center to point */}
                      <line x1="0" y1="0" x2={x} y2={y}
                        stroke="var(--border-hud-strong)" strokeWidth="0.8"
                        strokeDasharray="2 2"
                      />
                      {/* Point marker: outer ring + inner dot */}
                      <circle cx={x} cy={y} r="8" fill="none" stroke="var(--hud-line)" strokeWidth="1" />
                      <circle cx={x} cy={y} r="3" fill="var(--text-primary)" />
                      {/* Connector tick from data point out to the label, stops at the
                          outer ring (r=275) so the line doesn't cross the label text. */}
                      <line
                        x1={x} y1={y}
                        x2={Math.cos(rad) * 275}
                        y2={Math.sin(rad) * 275}
                        stroke="var(--hud-line)" strokeWidth="0.6"
                      />
                      {/* Label */}
                      <text
                        x={lx + (anchor === 'end' ? -8 : anchor === 'start' ? 8 : 0)}
                        y={ly - 2}
                        textAnchor={anchor}
                        fill="var(--text-primary)"
                        style={{ fontFamily: 'var(--font-hero)', fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 500 }}
                      >
                        {shortLabel}
                      </text>
                      <text
                        x={lx + (anchor === 'end' ? -8 : anchor === 'start' ? 8 : 0)}
                        y={ly + 14}
                        textAnchor={anchor}
                        fill="var(--text-dim)"
                        style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 1 }}
                      >
                        {count > 0 ? `${count.toLocaleString()} OBJ` : '— OBJ'}
                      </text>
                    </g>
                  )
                })}
              </svg>
            </div>

            {/* Right: ranked list with per-method explanations */}
            <div>
              <div style={{
                fontFamily: 'var(--font-mono)', fontSize: 10,
                color: 'var(--text-dim)', letterSpacing: 2, textTransform: 'uppercase',
                marginBottom: 14,
                paddingBottom: 14,
                borderBottom: '1px solid var(--border-hud)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                gap: 8,
              }}>
                <span>Protocols · Ranked by Yield</span>
                <span>OBJ COUNT</span>
              </div>

              {DISCOVERY_METHODS
                .map((m) => ({
                  ...m,
                  count: methodCounts[m.key] ?? 0,
                  desc:
                    m.key === 'Transit' ? 'A planet crosses its star\'s face, briefly dimming the light. Kepler & TESS flagship technique.' :
                    m.key === 'Radial Velocity' ? 'The star wobbles as a planet orbits it. Spectral lines shift in a tell-tale Doppler pattern.' :
                    m.key === 'Imaging' ? 'A direct photograph after coronagraphs block the host star. Only works for young, distant giants.' :
                    m.key === 'Microlensing' ? 'A foreground planet\'s gravity briefly magnifies light from a background star.' :
                    m.key === 'Transit Timing Variations' ? 'A known transit arrives early or late — a hidden second planet is tugging on the first.' :
                    m.key === 'Pulsar Timing' ? 'Radio pulses from a neutron star arrive with orbital-period anomalies. First method ever confirmed.' :
                    '',
                }))
                .sort((a, b) => b.count - a.count)
                .map((method, i) => (
                  <div key={method.key}
                    data-reveal="up"
                    data-d={Math.min(i + 1, 8).toString()}
                    style={{
                    display: 'grid',
                    gridTemplateColumns: '32px 24px 1fr auto',
                    gap: 14,
                    alignItems: 'start',
                    padding: '20px 0',
                    borderBottom: '1px dashed var(--border-hud)',
                  }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)', letterSpacing: 1.5, paddingTop: 4 }}>
                      {(i + 1).toString().padStart(2, '0')}
                    </span>
                    <method.Icon size={16} strokeWidth={1.2} style={{ color: 'var(--hud-line)', marginTop: 2 }} />
                    <div>
                      <div style={{
                        fontFamily: 'var(--font-hero)', fontSize: 15, fontWeight: 500,
                        color: 'var(--text-primary)', letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                      }}>
                        {method.key}
                      </div>
                      <p style={{
                        fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6,
                        marginTop: 6, maxWidth: '58ch',
                      }}>
                        {method.desc}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right', paddingTop: 2 }}>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 500, color: 'var(--text-primary)' }}>
                        {method.count > 0 ? method.count.toLocaleString() : '—'}
                      </div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-dim)', letterSpacing: 1.5, marginTop: 2 }}>
                        OBJ
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── 8. SYSTEM MANIFEST (terminal-style data sources) ─── */}
      <section data-section="09" style={{ padding: '140px var(--gutter)', backgroundColor: 'transparent' }}>
        <div style={{ maxWidth: 'var(--max-w)', margin: '0 auto' }}>

          {/* Left-aligned display heading with trailing copy on the right */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.3fr) minmax(0, 1fr)',
            gap: 72,
            alignItems: 'end',
            marginBottom: 64,
          }}>
            <h2 data-reveal="up" data-d="2" style={{
              fontFamily: 'var(--font-hero)',
              fontSize: 'clamp(48px, 8.5vw, 128px)',
              fontWeight: 500,
              lineHeight: 0.92,
              letterSpacing: '0.01em',
              textTransform: 'uppercase',
              color: 'var(--text-primary)',
              margin: 0,
            }}>
              Built on{' '}
              <span style={{
                fontFamily: 'var(--font-display)',
                fontStyle: 'italic',
                fontWeight: 300,
                textTransform: 'none',
                letterSpacing: '-0.01em',
                color: 'var(--text-muted)',
              }}>
                real
              </span><br />
              science.
            </h2>

            <div>
              <div style={{
                fontFamily: 'var(--font-mono)', fontSize: 10,
                color: 'var(--text-dim)', letterSpacing: 2, textTransform: 'uppercase',
                marginBottom: 12,
              }}>
                No fabricated data
              </div>
              <p style={{
                fontSize: 16, color: 'var(--text-muted)', lineHeight: 1.7,
                margin: 0, maxWidth: '44ch',
              }}>
                Every planet, every number, every classification in this site traces back
                to a peer-reviewed observational record. The stack is transparent: one
                archive for data, one engine for rendering, one database for computed
                fields. Here's the manifest.
              </p>
            </div>
          </div>

          <HUDPanel id="DATASOURCES" status="live" padding="24px 28px">
            {/* Terminal prompt */}
            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: 12,
              color: 'var(--text-muted)', letterSpacing: 0.5,
              paddingBottom: 14, marginBottom: 14,
              borderBottom: '1px dashed var(--border-hud)',
            }}>
              <span style={{ color: 'var(--text-dim)' }}>exoterra@mission-control:~$</span>{' '}
              <span style={{ color: 'var(--text-primary)' }}>ls -la /var/datasources --verbose</span>
              <span className="hud-cursor" />
            </div>

            {/* Table header */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '32px minmax(220px, 1.1fr) 120px 120px 1fr 140px',
              gap: 16,
              fontFamily: 'var(--font-mono)', fontSize: 10,
              color: 'var(--text-dim)', letterSpacing: 1.5,
              textTransform: 'uppercase',
              paddingBottom: 10,
              borderBottom: '1px solid var(--border-hud)',
            }}>
              <span>#</span>
              <span>SOURCE</span>
              <span>PROTOCOL</span>
              <span>STATUS</span>
              <span>DESCRIPTION</span>
              <span style={{ textAlign: 'right' }}>ENDPOINT</span>
            </div>

            {/* Rows */}
            {[
              {
                src: 'NASA EXOPLANET ARCHIVE',
                proto: 'HTTPS · TAP',
                status: 'SYNCED',
                led: 'var(--hud-green)',
                desc: 'Primary data source. Maintained by Caltech/IPAC — every confirmed exoplanet with physical parameters, orbital data, and host star properties.',
                endpoint: 'exoplanetarchive.ipac.caltech.edu',
              },
              {
                src: 'THREE.JS + GLSL',
                proto: 'LOCAL · RT',
                status: 'RUNTIME',
                led: 'var(--hud-line)',
                desc: 'Real-time 3D rendering with custom fragment shaders. Surface textures, atmospheric halos, and cloud layers generated procedurally.',
                endpoint: 'threejs.org',
              },
              {
                src: 'SUPABASE',
                proto: 'WSS · PGSQL',
                status: 'ONLINE',
                led: 'var(--hud-green)',
                desc: '6,158 planets stored with computed fields — habitability scores, classification, and visual properties via SQL triggers.',
                endpoint: 'supabase.com',
              },
            ].map((row, i) => (
              <div key={row.src}
                data-reveal="up"
                data-d={Math.min(i + 1, 8).toString()}
                style={{
                display: 'grid',
                gridTemplateColumns: '32px minmax(220px, 1.1fr) 120px 120px 1fr 140px',
                gap: 16,
                alignItems: 'start',
                padding: '14px 0',
                borderBottom: i < 2 ? '1px dashed var(--border-hud)' : 'none',
                fontFamily: 'var(--font-mono)', fontSize: 12,
              }}>
                <span style={{ color: 'var(--text-dim)' }}>{(i + 1).toString().padStart(2, '0')}</span>
                <span style={{ color: 'var(--text-primary)', letterSpacing: 0.5 }}>{row.src}</span>
                <span style={{ color: 'var(--text-muted)' }}>{row.proto}</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: 'var(--text-primary)' }}>
                  <span style={{
                    width: 6, height: 6, borderRadius: '50%',
                    background: row.led,
                    boxShadow: `0 0 6px ${row.led}`,
                    animation: row.status !== 'RUNTIME' ? 'hud-pulse 1.8s ease-in-out infinite' : undefined,
                    display: 'inline-block',
                  }} />
                  {row.status}
                </span>
                <span style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 13,
                  color: 'var(--text-muted)',
                  lineHeight: 1.55,
                }}>
                  {row.desc}
                </span>
                <span style={{
                  color: 'var(--text-dim)',
                  textAlign: 'right',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  {row.endpoint}
                </span>
              </div>
            ))}

            {/* Exit prompt */}
            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: 11,
              color: 'var(--text-dim)', letterSpacing: 1,
              paddingTop: 14, marginTop: 10,
              borderTop: '1px dashed var(--border-hud)',
            }}>
              <span style={{ color: 'var(--text-dim)' }}>→ 3 sources · {stats.totalPlanets > 0 ? stats.totalPlanets.toLocaleString() : '6,158'} records · last sync {new Date().toISOString().slice(0, 10).replace(/-/g, '.')}</span>
            </div>
          </HUDPanel>
        </div>
      </section>

      {/* ─── Footer (telemetry line) ─── */}
      <footer style={{ padding: '48px var(--gutter) 40px', backgroundColor: 'transparent' }}>
        <div style={{ maxWidth: 'var(--max-w)', margin: '0 auto' }}>
          <div style={{
            borderTop: '1px solid var(--border-hud)',
            paddingTop: 24,
            display: 'flex',
            flexWrap: 'wrap',
            gap: 20,
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 1.5, color: 'var(--text-primary)', textTransform: 'uppercase' }}>
                <span style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: 'var(--hud-green)',
                  boxShadow: '0 0 6px var(--hud-green)',
                  animation: 'hud-pulse 1.8s ease-in-out infinite',
                }} />
                LIVE
              </span>
              <span style={{ width: 1, height: 14, background: 'var(--border-hud)' }} />
              <span style={{ fontFamily: 'var(--font-hero)', fontSize: 12, letterSpacing: '0.14em', color: 'var(--text-primary)' }}>
                EXOTERRA
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-dim)', letterSpacing: 1.5 }}>
                v2.1.0
              </span>
            </div>

            <TelemetryLine
              items={[
                { label: 'BUILD', value: '4A1C2F3' },
                { label: 'UTC',   value: new Date().toISOString().slice(0, 10).replace(/-/g, '.') + ' · ' + new Date().toISOString().slice(11, 19) },
                { label: 'NODE',  value: 'EXOTERRA-01' },
                { label: 'COORD', value: '42.36°N · 71.06°W' },
              ]}
            />
          </div>

          <div style={{
            marginTop: 20,
            fontFamily: 'var(--font-mono)', fontSize: 10,
            color: 'var(--text-dim)', letterSpacing: 1.5,
            textTransform: 'uppercase',
            display: 'flex',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
          }}>
            <span>Data sourced from NASA Exoplanet Archive · Built with React · Three.js · Supabase</span>
            <span>EOF · END OF TRANSMISSION</span>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes hero-slow-zoom {
          from { transform: scale(1.08); }
          to   { transform: scale(1.0); }
        }

        /* (animated bottom rail removed — see PROPOSAL section below) */

        @media (prefers-reduced-motion: reduce) {
          .hero-video { animation: none !important; }
        }

        /* ───────────────────────────────────
           Mobile breakpoints — comprehensive
           ─────────────────────────────────── */

        /* Mobile hero decoration:
           · 4 telemetry clusters → still hidden (too dense for phones)
           · RegistrationField → visible but masked so marks only appear in the top
             ~22% and bottom ~22% bands (the central 56% where the title lives stays clean)
           · Bottom decorative rail → visible
           · Mobile-only corner stamps → enabled */
        @media (max-width: 768px) {
          .hero-corner { display: none !important; }
          .hero-decor-mobile { display: block !important; }

          /* Constrain ambient registration marks to safe top + bottom bands */
          .hero-decor--ambient {
            -webkit-mask-image: linear-gradient(
              to bottom,
              #000 0,
              #000 22%,
              transparent 22%,
              transparent 78%,
              #000 78%,
              #000 100%
            );
            mask-image: linear-gradient(
              to bottom,
              #000 0,
              #000 22%,
              transparent 22%,
              transparent 78%,
              #000 78%,
              #000 100%
            );
          }
        }

        /* Hero title — reduced 15% from previous floor (was 36, now ≈31) */
        @media (max-width: 768px) {
          [data-section="01"] h1 {
            font-size: clamp(31px, 12vw, 68px) !important;
            letter-spacing: 0.02em !important;
          }
          [data-section="01"] {
            padding: 0 !important;
          }
          /* Push the global hero frame brackets down so they clear the navbar */
          .hero-frame {
            inset: 80px 16px 56px 16px !important;
          }
          /* Stack hero CTAs vertically on phones */
          .hero-cta-row {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 10px !important;
            width: min(280px, 80vw);
          }
          .hero-cta-row > a {
            justify-content: center !important;
          }
        }

        /* Tighten section vertical padding on phones */
        @media (max-width: 768px) {
          [data-section]:not([data-section="01"]) {
            padding-top: 64px !important;
            padding-bottom: 32px !important;
            padding-left: var(--gutter) !important;
            padding-right: var(--gutter) !important;
          }
          [data-section] > div { max-width: 100% !important; }

          /* Display headings — center + bring the floor way down so they fit one phone width */
          [data-section] h2 {
            font-size: clamp(26px, 8.5vw, 44px) !important;
            line-height: 1.05 !important;
            letter-spacing: 0.02em !important;
            max-width: 100% !important;
            text-align: center !important;
            margin-left: auto !important;
            margin-right: auto !important;
          }
          /* Center all body text and h3 sub-titles within sections */
          [data-section] p,
          [data-section] h3 {
            text-align: center !important;
            margin-left: auto !important;
            margin-right: auto !important;
          }
          /* Center small mono eyebrows (not part of the structural eyebrow row) */
          [data-section] [style*="letterSpacing: 2"][style*="textTransform"]:not(span) {
            text-align: center !important;
          }
          /* Eyebrow rows that sit above each section title also center */
          [data-section] [style*="display: flex"][style*="paddingBottom: 40"],
          [data-section] [style*="display: flex"][style*="padding-bottom: 40"] {
            justify-content: center !important;
          }

          /* All multi-column inner grids stack to 1 col */
          [data-section] [style*="grid-template-columns"]:not([data-section="01"] *),
          [data-section] [style*="gridTemplateColumns"]:not([data-section="01"] *) {
            /* Selector above is a no-op for inline styles in React; relying on classed rules below */
          }

          /* Sec 1 — System Overview: hide right rail, center copy + CTAs */
          .sec01-grid {
            grid-template-columns: 1fr !important;
            gap: 32px !important;
            margin-top: 48px !important;
          }
          .sec01-rail { display: none !important; }
          .sec01-copy {
            text-align: center;
          }
          .sec01-copy p {
            margin: 0 auto !important;
          }
          .sec01-cta-row {
            justify-content: center !important;
            flex-direction: column !important;
            align-items: center !important;
            gap: 10px !important;
          }
          .sec01-cta-row > a {
            width: min(280px, 80vw);
            justify-content: center !important;
          }

          /* Sec 2 — Mission Sequence timeline rebuilt for mobile:
             · spine hidden (it was anchored at left:224px in the desktop grid)
             · row collapses from 4-col grid to centered vertical stack
             · order: timestamp · diamond · PHASE chip · title + description, all centered
          */
          .timeline-spine { display: none !important; }
          .timeline-row {
            grid-template-columns: 1fr !important;
            gap: 14px !important;
            padding: 28px 0 !important;
            justify-items: center !important;
            text-align: center !important;
          }
          .timeline-cell-ts {
            padding-top: 0 !important;
          }
          .timeline-cell-node {
            margin-top: 0 !important;
          }
          .timeline-cell-chip {
            padding-top: 0 !important;
          }
          .timeline-cell-body {
            margin-top: 4px;
          }
          .timeline-cell-body h3 {
            font-size: clamp(22px, 7vw, 32px) !important;
            text-align: center !important;
          }
          .timeline-cell-body p {
            text-align: center !important;
            margin-left: auto !important;
            margin-right: auto !important;
            max-width: 36ch !important;
          }

          /* Sec 3 — Planet Types: 4-col → 1-col cards */
          [data-section="04"] [style*="repeat(4, 1fr)"] {
            grid-template-columns: 1fr !important;
            gap: 12px !important;
          }
          /* Sec 3 — Asymmetric heading/copy block: stack title on top, copy below */
          .sec03-asym,
          .sec05-asym {
            grid-template-columns: 1fr !important;
            gap: 32px !important;
            align-items: start !important;
          }
          .sec03-heading,
          .sec05-heading {
            text-align: center !important;
            order: -1;
          }
          .sec03-copy,
          .sec05-copy {
            text-align: center !important;
          }
          .sec03-copy p,
          .sec05-copy p {
            margin: 0 auto !important;
          }
          .sec03-keyfacts {
            text-align: left !important;
          }

          /* Sec 4 — Habitability split layout & weighting matrix → stack */
          [data-section="05"] > div > div[style*="grid"] {
            grid-template-columns: 1fr !important;
            gap: 32px !important;
          }

          /* Sec 5 — Mission Readout 4 unit panels → 1-col */
          [data-section="06"] [style*="repeat(4, 1fr)"] {
            grid-template-columns: 1fr !important;
            gap: 12px !important;
          }

          /* Sec 6 — Featured Targets 3-col → 1-col */
          [data-section="07"] [style*="repeat(3, 1fr)"] {
            grid-template-columns: 1fr !important;
            gap: 12px !important;
          }

          /* Sec 7 — Detection Radar split → stack */
          [data-section="08"] > div > div[style*="grid"] {
            grid-template-columns: 1fr !important;
            gap: 32px !important;
          }

          /* Sec 8 — System Manifest table rows → stack */
          [data-section="09"] [style*="grid-template-columns"] {
            grid-template-columns: 1fr !important;
            gap: 8px !important;
          }

          /* DataGrid leader-line rows in Explore-style sections */
          [data-section] [style*="auto-fill"] {
            grid-template-columns: 1fr !important;
          }
        }

        /* Even narrower phones — squeeze a bit more (also -15%) */
        @media (max-width: 420px) {
          [data-section="01"] h1 {
            font-size: clamp(26px, 11vw, 41px) !important;
          }
          [data-section] h2 {
            font-size: clamp(22px, 8vw, 36px) !important;
          }
        }

        /* Force every section to never cause horizontal scroll */
        [data-section] {
          overflow-x: hidden;
        }
      `}</style>
    </div>
  )
}
