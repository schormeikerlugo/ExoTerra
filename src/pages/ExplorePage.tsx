import { useEffect, useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion, useScroll, useTransform } from 'motion/react'
import { ChevronRight, Search } from 'lucide-react'
import { useStore } from '../store/useStore'
import { PlanetScene } from '../components/Scene/PlanetScene'
import { PlanetCard } from '../components/Controls/PlanetCard'
import { CornerBrackets } from '../components/HUD/CornerBrackets'
import { Barcode } from '../components/HUD/Barcode'
import { ComparePin } from '../components/HUD/ComparePin'
import { StateScreen } from '../components/HUD/StateScreen'
import { MicroSection } from '../components/HUD/MicroSection'
import { PageMeta } from '../components/seo/PageMeta'
import { useReveal } from '../hooks/useReveal'
import { generatePlanetDescription } from '../utils/planetDescriptions'
import { formatNumber, formatTemperature, getPlanetScale } from '../utils/planetVisuals'
import type { Exoplanet } from '../data/types'

const TYPE_LABEL: Record<string, string> = {
  rocky: 'Rocky Planet',
  super_earth: 'Super Earth',
  gas_giant: 'Gas Giant',
  hot_jupiter: 'Hot Jupiter',
  ice_giant: 'Ice Giant',
  mini_neptune: 'Mini Neptune',
  lava_world: 'Lava World',
  frozen_rocky: 'Frozen Rocky',
  water: 'Water World',
  unknown: 'Unknown',
}

export function ExplorePage() {
  const { name } = useParams<{ name: string }>()
  const planets = useStore((s) => s.planets)
  const filteredPlanets = useStore((s) => s.filteredPlanets)
  const setSelectedPlanet = useStore((s) => s.setSelectedPlanet)

  const planet = useMemo<Exoplanet | null>(() => {
    if (planets.length === 0) return null
    if (name) {
      const found = planets.find((p) => p.pl_name === decodeURIComponent(name))
      if (found) return found
    }
    const sorted = [...planets].filter((p) => p.id >= 0).sort((a, b) => b.habitability_score - a.habitability_score)
    return sorted[0] ?? null
  }, [planets, name])

  useEffect(() => {
    if (planet) setSelectedPlanet(planet)
  }, [planet, setSelectedPlanet])

  // Reset scroll when target changes via /explore/:name
  useEffect(() => {
    if (!name) return
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [name])

  useReveal()

  // Per-planet camera framing — keeps the planet roughly half-cropped on the right
  // edge from the hero, with apparent angular size proportional to its physical radius.
  //   · cameraDistance closer (2.5×size) so the planet looks larger.
  //   · targetOffsetX ratio -0.55 places the planet center near the viewport right edge,
  //     leaving roughly half of its body off-screen.
  const planetSize3D = useMemo(() => (planet ? getPlanetScale(planet) : 1), [planet])
  const cameraDistance = Math.max(2.0, Math.min(7.0, 2.5 * planetSize3D))
  const targetOffsetX = -0.55 * cameraDistance

  // Scroll-driven 3D scale — already half-visible at hero, only nudges a little bigger.
  // Direct 1:1 mapping (no spring) so the scale tracks scroll exactly with zero lag,
  // zero overshoot and zero settling — no perceived "jumps to accommodate".
  const { scrollY } = useScroll()
  const planetScale = useTransform(scrollY, [0, 900], [1, 1.08])

  if (!planet) {
    if (planets.length === 0) {
      return (
        <StateScreen
          variant="loading"
          code="LINK_INIT"
          title="Linking archive."
          message="Streaming the latest catalog from the upstream mirror. Hold position — the readout will populate as soon as the first packet arrives."
        />
      )
    }
    const requested = name ? decodeURIComponent(name) : ''
    return (
      <StateScreen
        variant="not-found"
        code="ERR_404"
        title="Target not found."
        message={requested
          ? <>No archive entry matches <span style={{ color: 'var(--hud-cyan)' }}>"{requested}"</span>. The name may have been retired or the link mistyped.</>
          : 'No exoplanet matched that identifier.'}
        primaryAction={{ label: 'Browse catalog', to: '/catalog' }}
        secondaryAction={{ label: 'Return to base', to: '/' }}
      />
    )
  }

  // Tour position respects active filters when present, else full archive
  const tourSet = filteredPlanets.length > 0 ? filteredPlanets : planets
  const idx = tourSet.findIndex((p) => p.id === planet.id)
  const total = tourSet.length

  const score = planet.habitability_score
  // Tier + archive-relative percentile context for the score number.
  // Tier maps the absolute score to a human label; percentile shows where
  // this planet ranks against every confirmed entry (e.g. "top 12%").
  const scoreTier = score >= 60 ? 'Earth-like' : score >= 30 ? 'Partial match' : 'Unlikely'
  const tierColor = score >= 60 ? 'var(--hud-cyan)' : score >= 30 ? 'var(--hud-amber)' : 'var(--hud-red)'
  const better = planets.filter((p) => p.habitability_score > score).length
  const percentile = planets.length > 0 ? Math.max(1, Math.round((better / planets.length) * 100)) : null
  // Filled segments (10 total, each = 10 score pts)
  const filledSegments = Math.max(0, Math.min(10, Math.round(score / 10)))
  const description = generatePlanetDescription(planet)
  const systemPlanets = planets.filter((p) => p.hostname === planet.hostname && p.id !== planet.id)

  // Physical-property quick stats — descriptors for instant context.
  // Each stat returns null when the underlying value is missing so the
  // rail collapses gracefully rather than rendering "—".
  const physicalStats: { label: string; value: string; descriptor: string }[] = []
  if (planet.pl_eqt !== null) {
    const t = planet.pl_eqt
    const desc = t < 200 ? 'Frigid' : t < 280 ? 'Cool' : t < 330 ? 'Temperate' : t < 500 ? 'Warm' : t < 1000 ? 'Hot' : 'Scorching'
    physicalStats.push({ label: 'Temp', value: `${t.toFixed(0)} K`, descriptor: desc })
  }
  if (planet.pl_rade !== null) {
    const r = planet.pl_rade
    const desc = r < 0.8 ? 'Smaller than Earth' : r < 1.5 ? 'Earth-sized' : r < 2.5 ? 'Super-Earth' : r < 6 ? 'Neptune-sized' : 'Gas giant'
    physicalStats.push({ label: 'Radius', value: `${r.toFixed(2)} R⊕`, descriptor: desc })
  }
  if (planet.pl_masse !== null) {
    const m = planet.pl_masse
    const desc = m < 0.5 ? 'Light' : m < 2 ? 'Earth-mass' : m < 10 ? 'Super-Earth mass' : m < 50 ? 'Neptune-mass' : 'Jovian-mass'
    physicalStats.push({ label: 'Mass', value: `${m.toFixed(2)} M⊕`, descriptor: desc })
  }

  // Compact features line — drop "Habitable Zone" since the score tier
  // already encodes it; show only flags that aren't visible elsewhere.
  const features = [
    planet.has_atmosphere_likely && 'Atmosphere likely',
    planet.visual_has_clouds && 'Cloud cover',
    planet.visual_has_rings && 'Ring system',
    planet.visual_num_moons > 0 && `${planet.visual_num_moons} moon${planet.visual_num_moons > 1 ? 's' : ''}`,
  ].filter(Boolean) as string[]

  const tierShort = score >= 60 ? 'Earth-like candidate' : score >= 30 ? 'partial habitability match' : 'unlikely habitability match'
  const metaDesc = [
    `${planet.pl_name} — a ${TYPE_LABEL[planet.planet_type] ?? 'planet'} orbiting ${planet.hostname}`,
    planet.sy_dist ? `${planet.sy_dist.toFixed(1)} parsecs from Earth` : null,
    `habitability score ${score.toFixed(1)}/100 (${tierShort})`,
  ].filter(Boolean).join(' · ') + '.'

  return (
    <div className="explore-shell" style={{ position: 'relative', minHeight: '100vh', backgroundColor: 'transparent', paddingTop: 56 }}>
      <PageMeta title={planet.pl_name} description={metaDesc} />

      {/* ═══════════════════════════════════════════════════════════
          FIXED 3D STAGE — stays put across the entire page scroll;
          user can drag/zoom the planet at any time
      ═══════════════════════════════════════════════════════════ */}
      <div className="explore-3d-fixed">
        <motion.div
          style={{
            width: '100%',
            height: '100%',
            scale: planetScale,
            /* Anchor the small scroll-zoom at the right edge so the planet grows
               leftward into the viewport (the right side is already off-screen). */
            transformOrigin: 'right center',
          }}
        >
          <PlanetScene
            autoRotate={false}
            enableZoom={false}
            rotatePlanet
            cameraDistance={cameraDistance}
            targetOffsetX={targetOffsetX}
          />
        </motion.div>
      </div>
      {/* Left-side dark fade so the text column reads against the starfield */}
      <div className="explore-3d-fade" />

      {/* ═══════════════════════════════════════════════════════════
          HERO — text occupies left column over the fixed 3D
      ═══════════════════════════════════════════════════════════ */}
      <section
        className="explore-hero"
        style={{
          position: 'relative',
          minHeight: 'calc(100vh - 56px)',
          padding: '0 var(--gutter)',
          display: 'flex',
          alignItems: 'center',
          zIndex: 2,
          pointerEvents: 'none',
        }}
      >
        {/* Text content — left column, on top of 3D */}
        <div style={{
          position: 'relative',
          zIndex: 3,
          width: '100%',
          paddingBlock: 'clamp(40px, 8vh, 80px)',
          pointerEvents: 'auto',
        }}>
          <div style={{ maxWidth: 'min(880px, 68vw)' }}>
            {/* Eyebrow with index — Mercury reference style */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 14,
                marginBottom: 32,
              }}
            >
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: 12,
                color: 'var(--text-primary)', letterSpacing: 3,
              }}>
                {idx >= 0 ? String(idx + 1).padStart(3, '0') : '—'}
              </span>
              <span style={{ width: 36, height: 1, background: 'var(--hud-line)' }} />
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: 12,
                color: 'var(--text-muted)', letterSpacing: 3,
              }}>
                {String(total).padStart(3, '0')}
              </span>
              <span style={{ width: 1, height: 14, background: 'var(--border-hud)', marginInline: 4 }} />
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: 11,
                color: 'var(--text-muted)', letterSpacing: 2.5, textTransform: 'uppercase',
              }}>
                {TYPE_LABEL[planet.planet_type] ?? 'Planet'}
              </span>
            </motion.div>

            {/* Big name */}
            <motion.h1
              initial={{ opacity: 0, y: 24, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ duration: 1.1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              style={{
                fontFamily: 'var(--font-astra)',
                fontSize: 'clamp(48px, 8vw, 124px)',
                fontWeight: 600,
                lineHeight: 0.95,
                letterSpacing: '0.02em',
                color: 'var(--text-primary)',
                margin: 0,
                /* Default word-break: do not split inside words/hyphens (avoids "TOI-" breaks).
                   Long names will fall back to wrap on whitespace. */
                wordBreak: 'normal',
                overflowWrap: 'normal',
                textShadow: '0 0 60px rgba(0,0,0,0.85)',
              }}
            >
              {planet.pl_name}
            </motion.h1>

            {/* ─── Archive data section ─── */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
              style={{ marginTop: 32 }}
            >
              <MicroSection label="Archive data" align="left" style={{ marginBottom: 14 }} />
            </motion.div>

            {/* Metadata strip — host, distance, discovery year & method
                presented as labeled telemetry cells. The host name links to
                its system page (the "→" is a clickable affordance). */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.55, ease: [0.22, 1, 0.36, 1] }}
              className="explore-meta-strip"
              style={{
                display: 'grid',
                gridAutoFlow: 'column',
                gridAutoColumns: 'max-content',
                gap: 24,
                width: 'fit-content',
                maxWidth: '100%',
                overflowX: 'auto',
              }}
            >
              <MetaCell label="Host" first>
                <Link
                  to={`/system/${encodeURIComponent(planet.hostname)}`}
                  className="explore-meta-host"
                  title={`Open ${planet.hostname} system overview`}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    color: 'var(--text-primary)', textDecoration: 'none',
                    transition: 'color 180ms',
                  }}
                >
                  <span style={{ whiteSpace: 'nowrap' }}>{planet.hostname}</span>
                  <ChevronRight size={11} strokeWidth={2} style={{ color: 'var(--text-dim)', transition: 'color 180ms, transform 180ms' }} />
                </Link>
              </MetaCell>

              {planet.sy_dist !== null && (
                <MetaCell label="Distance">
                  <span style={{ whiteSpace: 'nowrap' }}>
                    <span style={{ color: 'var(--text-primary)' }}>{planet.sy_dist.toFixed(1)}</span>
                    <span style={{ color: 'var(--text-dim)', marginLeft: 4 }}>pc</span>
                    <span style={{ color: 'var(--text-dim)', marginInline: 6 }}>/</span>
                    <span style={{ color: 'var(--text-muted)' }}>{(planet.sy_dist * 3.26).toFixed(1)}</span>
                    <span style={{ color: 'var(--text-dim)', marginLeft: 4 }}>ly</span>
                  </span>
                </MetaCell>
              )}

              {planet.disc_year !== null && (
                <MetaCell label="Discovered">
                  <span style={{ color: 'var(--text-primary)' }}>{planet.disc_year}</span>
                </MetaCell>
              )}

              {planet.discoverymethod && (
                <MetaCell label="Method">
                  <span style={{ color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                    {planet.discoverymethod}
                  </span>
                </MetaCell>
              )}
            </motion.div>

            {/* ─── Habitability section ─── */}
            <MicroSection label="Habitability" align="left" style={{ marginTop: 36, marginBottom: 18 }} />

            {/* Score + CTAs (stacked vertically) */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.9, ease: [0.22, 1, 0.36, 1] }}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 24,
              }}
            >
              <div style={{ width: 'min(560px, 100%)' }}>
                <div style={{
                  display: 'flex', alignItems: 'baseline', gap: 8,
                  fontFamily: 'var(--font-astra)',
                  color: tierColor,
                  textShadow: score >= 30 ? `0 0 24px ${tierColor === 'var(--hud-cyan)' ? 'var(--hud-cyan-glow)' : 'rgba(255,181,71,0.28)'}` : 'none',
                }}>
                  <span style={{
                    fontSize: 'clamp(48px, 6vw, 80px)',
                    fontWeight: 600,
                    letterSpacing: '0.02em',
                    lineHeight: 1,
                  }}>
                    {score.toFixed(1)}
                  </span>
                  <span style={{
                    fontFamily: 'var(--font-mono)', fontSize: 12,
                    color: 'var(--text-dim)', letterSpacing: 2,
                  }}>
                    / 100
                  </span>
                </div>

                {/* Segmented progress bar — 10 segments, each = 10 score pts */}
                <div
                  aria-hidden
                  style={{
                    display: 'flex', gap: 3,
                    marginTop: 14,
                    width: '100%',
                  }}
                >
                  {Array.from({ length: 10 }).map((_, i) => {
                    const filled = i < filledSegments
                    return (
                      <span
                        key={i}
                        style={{
                          flex: 1,
                          height: 6,
                          background: filled ? tierColor : 'rgba(255,255,255,0.06)',
                          boxShadow: filled
                            ? `0 0 6px ${tierColor === 'var(--hud-cyan)' ? 'var(--hud-cyan-glow)' : 'rgba(255,181,71,0.28)'}`
                            : 'inset 0 0 0 1px var(--border-hud)',
                          transition: 'background 220ms, box-shadow 220ms',
                        }}
                      />
                    )
                  })}
                </div>

                {/* Tier label + percentile context */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  marginTop: 12, flexWrap: 'wrap',
                }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600,
                    color: tierColor, letterSpacing: 2, textTransform: 'uppercase',
                  }}>
                    <span style={{
                      width: 5, height: 5,
                      background: tierColor,
                      boxShadow: `0 0 5px ${tierColor === 'var(--hud-cyan)' ? 'var(--hud-cyan-glow)' : 'rgba(255,181,71,0.4)'}`,
                    }} />
                    {scoreTier}
                  </span>
                  {percentile !== null && (
                    <>
                      <span style={{ width: 18, height: 1, background: 'var(--border-hud)' }} />
                      <span style={{
                        fontFamily: 'var(--font-mono)', fontSize: 10,
                        color: 'var(--text-muted)', letterSpacing: 2,
                        textTransform: 'uppercase',
                      }}>
                        Top {percentile}% of archive
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* ─── Physical specs section ─── */}
              {(physicalStats.length > 0 || features.length > 0) && (
                <>
                  <MicroSection label="Physical" align="left" style={{ marginTop: 8, marginBottom: 14, width: 'min(560px, 100%)' }} />

                  <div className="explore-quick-stats" style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${physicalStats.length + (features.length > 0 ? 1 : 0)}, minmax(0, 1fr))`,
                    gap: 24,
                    width: 'min(560px, 100%)',
                  }}>
                    {physicalStats.map((stat, i) => (
                      <div key={stat.label} style={{
                        display: 'flex', flexDirection: 'column', gap: 5,
                        paddingLeft: i === 0 ? 0 : 14,
                        borderLeft: i === 0 ? 'none' : '1px solid var(--border-hud)',
                        minWidth: 0,
                      }}>
                        <span style={{
                          fontFamily: 'var(--font-mono)', fontSize: 9,
                          color: 'var(--text-dim)', letterSpacing: 2,
                          textTransform: 'uppercase',
                        }}>
                          {stat.label}
                        </span>
                        <span style={{
                          fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 500,
                          color: 'var(--text-primary)', letterSpacing: '-0.5px',
                          lineHeight: 1.1,
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        }}>
                          {stat.value}
                        </span>
                        <span style={{
                          fontFamily: 'var(--font-mono)', fontSize: 9,
                          color: 'var(--text-muted)', letterSpacing: 1.5,
                          textTransform: 'uppercase',
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        }}>
                          {stat.descriptor}
                        </span>
                      </div>
                    ))}
                    {features.length > 0 && (
                      <div style={{
                        display: 'flex', flexDirection: 'column', gap: 5,
                        paddingLeft: physicalStats.length > 0 ? 14 : 0,
                        borderLeft: physicalStats.length > 0 ? '1px solid var(--border-hud)' : 'none',
                        minWidth: 0,
                      }}>
                        <span style={{
                          fontFamily: 'var(--font-mono)', fontSize: 9,
                          color: 'var(--text-dim)', letterSpacing: 2,
                          textTransform: 'uppercase',
                        }}>
                          Features
                        </span>
                        <span style={{
                          fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 500,
                          color: 'var(--text-primary)',
                          letterSpacing: '0.4px',
                          lineHeight: 1.4,
                        }}>
                          {features.join(' · ')}
                        </span>
                      </div>
                    )}
                  </div>
                </>
              )}

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 8 }}>
                <a href="#briefing" className="hud-cta-primary" style={{
                  display: 'inline-flex', alignItems: 'center', gap: 10,
                  padding: '14px 26px',
                  background: 'var(--hud-cyan)', color: 'var(--bg-void)',
                  fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600,
                  letterSpacing: 2, textTransform: 'uppercase', textDecoration: 'none',
                  clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)',
                }}>
                  <ChevronRight size={13} strokeWidth={2.5} />
                  Read Profile
                </a>
                <Link
                  to={`/explorer/${encodeURIComponent(planet.pl_name)}`}
                  className="hud-cta-secondary"
                  title="Open the full-screen 3D cockpit — interactive scan with filter rail and HUD telemetry"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 10,
                    padding: '14px 26px',
                    background: 'transparent', color: 'var(--hud-cyan)',
                    fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 500,
                    letterSpacing: 2, textTransform: 'uppercase', textDecoration: 'none',
                    border: '1px solid var(--border-hud-strong)',
                    clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)',
                  }}
                >
                  Open in cockpit
                  <ChevronRight size={13} strokeWidth={2.5} />
                </Link>
                <ComparePin planet={planet} variant="label" />
              </div>
            </motion.div>
          </div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.6 }}
          style={{
            position: 'absolute',
            bottom: 32, left: '50%', transform: 'translateX(-50%)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
            fontFamily: 'var(--font-mono)', fontSize: 9,
            color: 'var(--text-dim)', letterSpacing: 2.5, textTransform: 'uppercase',
            zIndex: 4,
            pointerEvents: 'none',
          }}
        >
          Scroll
          <span style={{
            width: 1, height: 36,
            background: 'linear-gradient(to bottom, var(--hud-line), transparent)',
          }} />
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          BRIEFING — long-form description, landing display style
      ═══════════════════════════════════════════════════════════ */}
      <Section id="briefing" code="01" label="Briefing">
        <div data-reveal="up" style={{ marginBottom: 36 }}>
          <h2 style={{
            fontFamily: 'var(--font-hero)',
            fontSize: 'clamp(24px, 3.5vw, 44px)',
            fontWeight: 500, lineHeight: 1.05,
            letterSpacing: '0.02em', textTransform: 'uppercase',
            color: 'var(--text-primary)',
            margin: 0,
            wordBreak: 'normal',
            overflowWrap: 'normal',
          }}>
            What we{' '}
            <span style={{
              fontFamily: 'var(--font-display)',
              fontStyle: 'italic',
              fontWeight: 300,
              textTransform: 'none',
              letterSpacing: '-0.01em',
              color: 'var(--text-muted)',
            }}>
              know.
            </span>
          </h2>
        </div>
        {/* Long-form description, full container width */}
        <p data-reveal="up" data-d="2" style={{
          fontFamily: 'var(--font-body)',
          fontSize: 17, lineHeight: 1.75,
          color: 'var(--text-muted)',
          margin: 0,
        }}>
          {description}
        </p>

        {/* Key facts as glass cards below the paragraph */}
        <div data-reveal="up" data-d="3" style={{ marginTop: 36 }}>
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: 10,
            color: 'var(--text-dim)', letterSpacing: 2, textTransform: 'uppercase',
            marginBottom: 14,
            paddingBottom: 10,
            borderBottom: '1px dashed var(--border-hud)',
          }}>
            Key facts
          </div>
          <KeyFactCards
            items={[
              { label: 'Type',               value: TYPE_LABEL[planet.planet_type] ?? '—' },
              { label: 'Host Star',          value: planet.hostname },
              { label: 'Distance from Earth', value: planet.sy_dist ? `${planet.sy_dist.toFixed(1)} pc` : '—' },
              { label: 'Discovery Year',     value: planet.disc_year?.toString() ?? '—' },
              { label: 'Atmosphere',         value: planet.has_atmosphere_likely ? 'Likely' : 'Unlikely' },
              { label: 'Habitability',       value: `${score.toFixed(1)} / 100` },
            ]}
          />
        </div>
      </Section>

      {/* ═══════════════════════════════════════════════════════════
          PHYSICAL — properties as DataGrid
      ═══════════════════════════════════════════════════════════ */}
      <Section id="physical" code="02" label="Physical Properties">
        <DisplayHeading
          left="Size,"
          italic="density,"
          right="and heat."
          width="22ch"
        />
        <KeyFactCards
          items={[
            { label: 'Equilibrium Temperature', value: formatTemperature(planet.pl_eqt) },
            { label: 'Radius',                 value: formatNumber(planet.pl_rade), unit: 'R⊕' },
            { label: 'Mass',                   value: formatNumber(planet.pl_masse), unit: 'M⊕' },
            { label: 'Density',                value: formatNumber(planet.pl_dens), unit: 'g/cm³' },
            { label: 'Stellar Insolation',     value: formatNumber(planet.pl_insol), unit: 'S⊕' },
          ]}
        />
      </Section>

      {/* ═══════════════════════════════════════════════════════════
          ORBITAL — DataGrid
      ═══════════════════════════════════════════════════════════ */}
      <Section id="orbital" code="03" label="Orbital Parameters">
        <DisplayHeading
          left="One"
          italic="lap"
          right={`every ${planet.pl_orbper !== null ? `${planet.pl_orbper.toFixed(1)} days` : 'unknown'}.`}
          width="24ch"
        />
        <KeyFactCards
          items={[
            { label: 'Orbital Period',  value: formatNumber(planet.pl_orbper), unit: 'days' },
            { label: 'Semi-major Axis', value: formatNumber(planet.pl_orbsmax), unit: 'AU' },
            { label: 'Eccentricity',    value: formatNumber(planet.pl_orbeccen, 4) },
            { label: 'RA',              value: planet.ra !== null ? planet.ra.toFixed(4) : '—', unit: '°' },
            { label: 'Dec',             value: planet.dec !== null ? planet.dec.toFixed(4) : '—', unit: '°' },
          ]}
        />
      </Section>

      {/* ═══════════════════════════════════════════════════════════
          HOST STAR
      ═══════════════════════════════════════════════════════════ */}
      <Section id="host" code="04" label={`Host Star · ${planet.hostname}`}>
        <DisplayHeading
          left="The"
          italic="star"
          right="it orbits."
          width="22ch"
        />
        <KeyFactCards
          items={[
            { label: 'Spectral Type',     value: planet.st_spectype ?? '—' },
            { label: 'Effective Temp.',   value: planet.st_teff ? planet.st_teff.toFixed(0) : '—', unit: 'K' },
            { label: 'Mass',              value: formatNumber(planet.st_mass), unit: 'M☉' },
            { label: 'Radius',            value: formatNumber(planet.st_rad), unit: 'R☉' },
            { label: 'Luminosity',        value: planet.st_lum !== null ? `10^${planet.st_lum.toFixed(2)}` : '—', unit: 'L☉' },
            { label: 'Age',               value: planet.st_age ? planet.st_age.toFixed(1) : '—', unit: 'Gyr' },
            { label: 'Metallicity',       value: planet.st_met !== null ? planet.st_met.toFixed(3) : '—', unit: '[Fe/H]' },
          ]}
        />
      </Section>

      {/* ═══════════════════════════════════════════════════════════
          DISCOVERY
      ═══════════════════════════════════════════════════════════ */}
      <Section id="discovery" code="05" label="Discovery">
        <DisplayHeading
          left="How it was"
          italic="found."
          width="20ch"
        />
        <KeyFactCards
          items={[
            { label: 'Detection Method', value: planet.discoverymethod ?? '—' },
            { label: 'Discovery Year',   value: planet.disc_year?.toString() ?? '—' },
            { label: 'Facility',         value: planet.disc_facility ?? '—' },
            { label: 'Distance',         value: planet.sy_dist ? `${planet.sy_dist.toFixed(1)}` : '—', unit: 'pc' },
          ]}
        />
      </Section>

      {/* ═══════════════════════════════════════════════════════════
          SYSTEM CONTEXT
      ═══════════════════════════════════════════════════════════ */}
      {systemPlanets.length > 0 && (
        <Section id="system" code="06" label={`${planet.hostname} · System`}>
          <DisplayHeading
            left="It has"
            italic="company."
            width="20ch"
          />
          <p data-reveal="up" data-d="2" style={{
            fontFamily: 'var(--font-body)', fontSize: 16, lineHeight: 1.7,
            color: 'var(--text-muted)',
            margin: '0 0 32px',
            maxWidth: '60ch',
          }}>
            {planet.pl_name} is one of {systemPlanets.length + 1} known planets orbiting {planet.hostname}.
            {' '}Click any sibling to switch the observation target.
          </p>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: 12,
          }}>
            {systemPlanets.map((sp, i) => (
              <Link
                key={sp.id}
                to={`/explore/${encodeURIComponent(sp.pl_name)}`}
                data-reveal="up"
                data-d={Math.min(i + 1, 8).toString()}
                className="hud-card"
                style={{
                  position: 'relative',
                  display: 'flex', flexDirection: 'column', gap: 8,
                  padding: '16px 18px',
                  border: '1px solid var(--border-hud)',
                  textDecoration: 'none', color: 'inherit',
                }}
              >
                <span className="hud-card__march" />
                <CornerBrackets size={6} inset={-1} color="var(--hud-line)" thickness={1} />
                <div style={{
                  fontFamily: 'var(--font-mono)', fontSize: 9,
                  color: 'var(--text-dim)', letterSpacing: 1.5,
                }}>
                  {sp.planet_type.replace('_', ' ').toUpperCase().slice(0, 16)}
                </div>
                <div style={{
                  fontFamily: 'var(--font-hero)', fontSize: 14, fontWeight: 500,
                  letterSpacing: '0.04em', textTransform: 'uppercase',
                  color: 'var(--text-primary)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {sp.pl_name}
                </div>
                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  fontFamily: 'var(--font-mono)', fontSize: 10,
                  color: 'var(--text-muted)', letterSpacing: 1,
                }}>
                  <span>SCORE {sp.habitability_score.toFixed(0)}</span>
                  {sp.in_habitable_zone && <span style={{ color: 'var(--hud-cyan)' }}>HZ</span>}
                </div>
              </Link>
            ))}
          </div>
        </Section>
      )}

      {/* ═══════════════════════════════════════════════════════════
          CONTINUE EXPLORING — Browse
      ═══════════════════════════════════════════════════════════ */}
      <BrowseSection currentName={planet.pl_name} />

      <div style={{ height: 80 }} />
    </div>
  )
}

/* ─────────── Hero metadata cell ─────────── */
function MetaCell({ label, children, first }: {
  label: string
  children: React.ReactNode
  first?: boolean
}) {
  return (
    <div
      className="explore-meta-cell"
      style={{
        display: 'flex', flexDirection: 'column', gap: 4,
        paddingLeft: first ? 0 : 24,
        borderLeft: first ? 'none' : '1px solid var(--border-hud)',
        minWidth: 0,
      }}
    >
      <span style={{
        fontFamily: 'var(--font-mono)', fontSize: 9,
        color: 'var(--text-dim)', letterSpacing: 2,
        textTransform: 'uppercase',
      }}>
        {label}
      </span>
      <span style={{
        fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 500,
        letterSpacing: '0.4px', lineHeight: 1.2,
      }}>
        {children}
      </span>
    </div>
  )
}

/* ─────────── Section: landing-style scaffold ─────────── */
function Section({
  id, code, label, children,
}: {
  id: string
  code: string
  label: string
  children: React.ReactNode
}) {
  return (
    <section
      id={id}
      className="explore-section"
      style={{
        position: 'relative',
        padding: '140px var(--gutter) 60px',
        zIndex: 2,
      }}
    >
      <div style={{ maxWidth: 'var(--max-w)', margin: '0 auto' }}>
        <div data-reveal="up" style={{
          display: 'flex', alignItems: 'center', gap: 14,
          paddingBottom: 32,
          borderBottom: '1px solid var(--border-hud)',
          marginBottom: 56,
        }}>
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 11,
            color: 'var(--text-primary)', letterSpacing: 3,
          }}>
            {code}
          </span>
          <span style={{ width: 32, height: 1, background: 'var(--hud-line)' }} />
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 11,
            color: 'var(--text-muted)', letterSpacing: 2.5, textTransform: 'uppercase',
          }}>
            {label}
          </span>
        </div>
        {children}
      </div>
    </section>
  )
}

/* ─────────── DisplayHeading: Orbitron + Outfit italic mix ─────────── */
function DisplayHeading({ left, italic, right }: {
  left: string
  italic: string
  right?: string
  width?: string
}) {
  return (
    <h2 data-reveal="up" style={{
      fontFamily: 'var(--font-hero)',
      fontSize: 'clamp(24px, 3.5vw, 44px)',
      fontWeight: 500, lineHeight: 1.05,
      letterSpacing: '0.02em', textTransform: 'uppercase',
      color: 'var(--text-primary)',
      margin: '0 0 36px',
      wordBreak: 'normal',
      overflowWrap: 'normal',
    }}>
      {left}{' '}
      <span style={{
        fontFamily: 'var(--font-display)',
        fontStyle: 'italic',
        fontWeight: 300,
        textTransform: 'none',
        letterSpacing: '-0.01em',
        color: 'var(--text-muted)',
      }}>
        {italic}
      </span>
      {right && (<>{' '}{right}</>)}
    </h2>
  )
}

/* ─────────── KeyFactCards: full-width grid of glass mini-cards ─────────── */
function KeyFactCards({
  items,
  minMin = 180,
}: {
  items: { label: string; value: string; unit?: string }[]
  /** min size of each grid track in px */
  minMin?: number
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(auto-fill, minmax(${minMin}px, 1fr))`,
        gap: 10,
      }}
    >
      {items.map((it, i) => (
        <div
          key={it.label}
          data-reveal="up"
          data-d={Math.min(i + 1, 8).toString()}
          className="hud-glass"
          style={{
            position: 'relative',
            border: '1px solid var(--border-hud)',
            padding: '14px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            minHeight: 76,
          }}
        >
          <CornerBrackets size={6} inset={-1} color="var(--hud-line)" thickness={1} />
          <span
            style={{
              fontFamily: 'var(--font-mono)', fontSize: 9,
              color: 'var(--text-dim)', letterSpacing: 1.8, textTransform: 'uppercase',
            }}
          >
            {it.label}
          </span>
          <span
            style={{
              display: 'inline-flex', alignItems: 'baseline', gap: 5,
              fontFamily: 'var(--font-mono)', fontSize: 16,
              color: 'var(--text-primary)',
              letterSpacing: 0.5,
              wordBreak: 'normal',
              overflowWrap: 'break-word',
            }}
          >
            {it.value}
            {it.unit && (
              <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>{it.unit}</span>
            )}
          </span>
        </div>
      ))}
    </div>
  )
}

/* ─────────── BrowseSection: pick the next target ─────────── */
function BrowseSection({ currentName }: { currentName: string }) {
  const filteredPlanets = useStore((s) => s.filteredPlanets)
  const filters = useStore((s) => s.filters)
  const updateFilter = useStore((s) => s.updateFilter)
  const totalCount = useStore((s) => s.planets.length)

  const [visibleCount, setVisibleCount] = useState(12)

  const visible = useMemo(
    () => filteredPlanets.filter((p) => p.pl_name !== currentName).slice(0, visibleCount),
    [filteredPlanets, currentName, visibleCount],
  )

  return (
    <section
      id="browse"
      className="explore-section explore-browse-section"
      style={{
        position: 'relative',
        padding: '140px var(--gutter) 100px',
        zIndex: 2,
      }}
    >
      <div style={{ maxWidth: 'var(--max-w)', margin: '0 auto' }}>
        <div data-reveal="up" style={{
          display: 'flex', alignItems: 'center', gap: 14,
          paddingBottom: 32,
          borderBottom: '1px solid var(--border-hud)',
          marginBottom: 56,
          flexWrap: 'wrap', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: 11,
              color: 'var(--text-primary)', letterSpacing: 3,
            }}>
              07
            </span>
            <span style={{ width: 32, height: 1, background: 'var(--hud-line)' }} />
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: 11,
              color: 'var(--text-muted)', letterSpacing: 2.5, textTransform: 'uppercase',
            }}>
              Continue Exploring
            </span>
          </div>
          <Barcode seed={`browse-${filteredPlanets.length}`} bars={42} height={18} />
        </div>

        <DisplayHeading
          left="Pick the"
          italic="next"
          right="target."
          width="20ch"
        />

        <div data-reveal="up" data-d="2" style={{
          marginBottom: 32,
          display: 'flex', flexWrap: 'wrap', gap: 12,
          alignItems: 'center',
        }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 240 }}>
            <Search size={14} style={{
              position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
              color: 'var(--text-dim)', pointerEvents: 'none',
            }} />
            <input
              type="text"
              value={filters.searchQuery}
              onChange={(e) => {
                updateFilter('searchQuery', e.target.value)
                setVisibleCount(12)
              }}
              placeholder="Search by planet or host star..."
              className="explore-search"
              style={{
                width: '100%',
                padding: '12px 14px 12px 36px',
                background: 'rgba(255,255,255,0.025)',
                border: '1px solid var(--border-hud)',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-mono)', fontSize: 12,
                outline: 'none',
                transition: 'border-color 200ms',
              }}
            />
          </div>

          <button
            onClick={() => {
              updateFilter('habitableZoneOnly', !filters.habitableZoneOnly)
              setVisibleCount(12)
            }}
            style={{
              padding: '12px 18px',
              background: filters.habitableZoneOnly ? 'var(--hud-cyan-glow)' : 'rgba(255,255,255,0.025)',
              border: `1px solid ${filters.habitableZoneOnly ? 'var(--hud-cyan)' : 'var(--border-hud)'}`,
              color: filters.habitableZoneOnly ? 'var(--hud-cyan)' : 'var(--text-muted)',
              fontFamily: 'var(--font-mono)', fontSize: 11,
              letterSpacing: 1.8, textTransform: 'uppercase',
              cursor: 'pointer',
              transition: 'all 180ms',
            }}
          >
            HZ Only
          </button>

          <Link
            to="/catalog"
            style={{
              padding: '12px 18px',
              border: '1px solid var(--border-hud-strong)',
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-mono)', fontSize: 11,
              letterSpacing: 1.8, textTransform: 'uppercase',
              textDecoration: 'none',
              transition: 'all 180ms',
            }}
          >
            Full Databank →
          </Link>

          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 10,
            color: 'var(--text-dim)', letterSpacing: 1.5, textTransform: 'uppercase',
          }}>
            {filteredPlanets.length.toLocaleString()} / {totalCount.toLocaleString()} matches
          </span>
        </div>

        <div className="explore-browse-grid">
          {visible.map((p, i) => (
            <div key={p.id} data-reveal="up" data-d={Math.min((i % 8) + 1, 8).toString()}>
              <PlanetCard planet={p} />
            </div>
          ))}
        </div>

        {visible.length < filteredPlanets.length - 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 40 }}>
            <button
              onClick={() => setVisibleCount((c) => c + 12)}
              style={{
                padding: '12px 28px',
                background: 'transparent',
                border: '1px solid var(--border-hud-strong)',
                color: 'var(--hud-cyan)',
                fontFamily: 'var(--font-mono)', fontSize: 11,
                letterSpacing: 2, textTransform: 'uppercase',
                cursor: 'pointer',
                clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)',
                transition: 'background 200ms',
              }}
            >
              Load More
            </button>
          </div>
        )}
      </div>

      <style>{`
        /* ─── Shell layout: 3D fixed on right, content scrolls on left ─── */
        .explore-3d-fixed {
          position: fixed;
          top: 56px;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 0;
          /* No background — global .space-bg starfield shows behind the transparent
             planet canvas so CSS scale on this wrapper doesn't enlarge the stars. */
          background: transparent;
          pointer-events: auto;
        }
        .explore-3d-fade {
          position: fixed;
          top: 56px;
          left: 0;
          bottom: 0;
          width: 70vw;
          z-index: 1;
          pointer-events: none;
          background:
            linear-gradient(to right,
              #000 0%,
              rgba(0,0,0,0.86) 28%,
              rgba(0,0,0,0.55) 55%,
              rgba(0,0,0,0.18) 78%,
              transparent 100%);
        }
        /* All content sections constrained to the left half so the planet stays visible right */
        .explore-section > div {
          margin-left: 0 !important;
          margin-right: auto !important;
          max-width: min(880px, 68vw) !important;
        }
        /* Hero text container also pulls left; the existing maxWidth handles legibility */
        /* Browse adapts to 2-col grid since column is narrower */
        .explore-browse-section .explore-browse-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr) !important;
          gap: 14px;
        }
        /* Search row in browse can wrap tighter */
        .explore-search:focus { border-color: var(--border-hud-strong); background: rgba(255,255,255,0.045); }
        .explore-search::placeholder { color: var(--text-dim); }
        .explore-browse-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 14px;
        }

        @media (max-width: 1100px) {
          .explore-3d-fixed {
            position: absolute;
            top: 56px;
            left: 0; right: 0;
            height: 50vh;
            bottom: auto;
          }
          .explore-3d-fade {
            position: absolute;
            top: 56px;
            width: 100%;
            height: 50vh;
            background: linear-gradient(to top, #000 0%, rgba(0,0,0,0.5) 60%, transparent 100%);
          }
          /* Hero: stop centering vertically — push text below the 3D banner */
          .explore-hero {
            min-height: auto !important;
            align-items: flex-start !important;
            padding-top: calc(50vh - 32px) !important;
            padding-bottom: 64px !important;
          }
          .explore-hero > div > div {
            max-width: 100% !important;
          }
          .explore-section > div {
            max-width: 100% !important;
          }
          .explore-browse-section .explore-browse-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (max-width: 700px) {
          .explore-browse-section .explore-browse-grid {
            grid-template-columns: 1fr !important;
          }
          .explore-quick-stats {
            grid-template-columns: 1fr 1fr !important;
            gap: 14px !important;
          }
        }
        @media (max-width: 420px) {
          .explore-quick-stats {
            grid-template-columns: 1fr !important;
          }
        }

        /* Hero metadata strip */
        .explore-meta-host:hover { color: var(--hud-cyan) !important; }
        .explore-meta-host:hover svg { color: var(--hud-cyan) !important; transform: translateX(2px); }
        .explore-meta-strip::-webkit-scrollbar { height: 0; }

        @media (max-width: 700px) {
          .explore-meta-strip {
            grid-auto-flow: row !important;
            grid-auto-columns: auto !important;
            grid-template-columns: 1fr 1fr !important;
            gap: 14px 18px !important;
            width: 100% !important;
          }
          .explore-meta-strip .explore-meta-cell:nth-child(odd) {
            border-left: none !important;
            padding-left: 0 !important;
          }
          .explore-meta-strip .explore-meta-cell:nth-child(even) {
            padding-left: 14px !important;
          }
        }
        @media (max-width: 380px) {
          .explore-meta-strip {
            grid-template-columns: 1fr !important;
          }
          .explore-meta-strip .explore-meta-cell {
            border-left: none !important;
            padding-left: 0 !important;
          }
        }
      `}</style>
    </section>
  )
}
