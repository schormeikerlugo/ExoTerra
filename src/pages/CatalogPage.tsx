import { useState, useMemo, useEffect, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Search, ArrowUpDown, X, Sliders, Info, ChevronRight } from 'lucide-react'
import { useStore } from '../store/useStore'
import { PlanetCard } from '../components/Controls/PlanetCard'
import { Barcode } from '../components/HUD/Barcode'
import { CornerBrackets } from '../components/HUD/CornerBrackets'
import { RegistrationField } from '../components/HUD/RegistrationField'
import { TrackingCode } from '../components/HUD/TrackingCode'
import { HatchFill } from '../components/HUD/HatchFill'
import { PageMeta } from '../components/seo/PageMeta'
import { useReveal } from '../hooks/useReveal'
import type { FilterState } from '../data/types'

const PLANET_TYPES: { value: string; label: string; description: string }[] = [
  { value: 'rocky',        label: 'Rocky',        description: 'Solid terrestrial planets, similar to Earth or Mars.' },
  { value: 'super_earth',  label: 'Super Earth',  description: 'Rocky worlds 1.5–2.5× Earth\'s radius. Strong gravity, diverse conditions.' },
  { value: 'mini_neptune', label: 'Mini Neptune', description: 'Small gas-rich planets — transitional class between super-Earths and gas giants.' },
  { value: 'gas_giant',    label: 'Gas Giant',    description: 'Massive hydrogen-helium worlds like Jupiter. No solid surface.' },
  { value: 'hot_jupiter',  label: 'Hot Jupiter',  description: 'Gas giants extremely close to their star. Temperatures above 1000 K.' },
  { value: 'ice_giant',    label: 'Ice Giant',    description: 'Composed of water, ammonia, and methane ices. Like Uranus and Neptune.' },
  { value: 'lava_world',   label: 'Lava World',   description: 'Surfaces of molten rock with magma oceans and mineral-vapour atmospheres.' },
  { value: 'frozen_rocky', label: 'Frozen',       description: 'Cold terrestrial worlds locked in permanent ice; possible subsurface oceans.' },
]

const DISCOVERY_METHODS: { value: string; label: string; description: string }[] = [
  { value: 'Transit',                     label: 'Transit',         description: 'Detected by the dip in starlight as the planet crosses its host star. Most common method.' },
  { value: 'Radial Velocity',             label: 'Radial Velocity', description: 'Detected by the tiny stellar wobble caused by the planet\'s gravity tugging the star.' },
  { value: 'Imaging',                     label: 'Imaging',         description: 'Direct photograph of the planet — only possible for distant, bright young worlds.' },
  { value: 'Microlensing',                label: 'Microlensing',    description: 'Light from a background star is bent by the gravity of the foreground planet system.' },
  { value: 'Transit Timing Variations',   label: 'TTV',             description: 'Transit Timing Variations — a known transiting planet\'s timing offsets reveal additional planets.' },
  { value: 'Pulsar Timing',               label: 'Pulsar',          description: 'Detected by tiny pulse-timing changes from a millisecond pulsar.' },
]

const SORT_OPTIONS: { value: FilterState['sortBy']; label: string }[] = [
  { value: 'habitability_score', label: 'Habitability Score' },
  { value: 'pl_eqt', label: 'Temperature' },
  { value: 'pl_rade', label: 'Radius' },
  { value: 'pl_masse', label: 'Mass' },
  { value: 'disc_year', label: 'Discovery Year' },
  { value: 'pl_name', label: 'Name' },
]

const PAGE_SIZE = 30

// Quick lookup tables for active-filter chip labels
const TYPE_LABEL_BY_VALUE = Object.fromEntries(PLANET_TYPES.map((t) => [t.value, t.label]))
const METHOD_LABEL_BY_VALUE = Object.fromEntries(DISCOVERY_METHODS.map((m) => [m.value, m.label]))

export function CatalogPage() {
  const planets = useStore((s) => s.planets)
  const filteredPlanets = useStore((s) => s.filteredPlanets)
  const filters = useStore((s) => s.filters)
  const updateFilter = useStore((s) => s.updateFilter)
  const resetFilters = useStore((s) => s.resetFilters)
  const totalCount = planets.length
  const isLoading = useStore((s) => s.isLoading)

  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [showFilters, setShowFilters] = useState(false)

  // Apply ?type= URL param on mount (e.g. arriving from a Landing card click).
  // Replaces existing planetTypes filter and clears the param afterwards so
  // the user can freely toggle filters without the URL fighting them.
  const [searchParams, setSearchParams] = useSearchParams()
  const appliedParamRef = useRef(false)
  useEffect(() => {
    if (appliedParamRef.current) return
    const paramType = searchParams.get('type')
    if (paramType && PLANET_TYPES.some((t) => t.value === paramType)) {
      updateFilter('planetTypes', [paramType])
      setShowFilters(true)
      setVisibleCount(PAGE_SIZE)
      appliedParamRef.current = true
      const next = new URLSearchParams(searchParams)
      next.delete('type')
      setSearchParams(next, { replace: true })
    } else if (paramType) {
      // Unknown type — drop it
      const next = new URLSearchParams(searchParams)
      next.delete('type')
      setSearchParams(next, { replace: true })
    }
  }, [searchParams, setSearchParams, updateFilter])

  useReveal()

  const visiblePlanets = useMemo(
    () => filteredPlanets.slice(0, visibleCount),
    [filteredPlanets, visibleCount],
  )

  const toggleType = (type: string) => {
    const current = filters.planetTypes
    const next = current.includes(type)
      ? current.filter((t) => t !== type)
      : [...current, type]
    updateFilter('planetTypes', next)
    setVisibleCount(PAGE_SIZE)
  }

  const toggleDiscoveryMethod = (method: string) => {
    const current = filters.discoveryMethods
    const next = current.includes(method)
      ? current.filter((m) => m !== method)
      : [...current, method]
    updateFilter('discoveryMethods', next)
    setVisibleCount(PAGE_SIZE)
  }

  const stats = useMemo(() => {
    const hz = filteredPlanets.filter((p) => p.in_habitable_zone).length
    const avgScore =
      filteredPlanets.length > 0
        ? filteredPlanets.reduce((sum, p) => sum + p.habitability_score, 0) / filteredPlanets.length
        : 0
    return { hz, avgScore }
  }, [filteredPlanets])

  // Counts per filter option — computed against the FULL archive so users see
  // how populated each chip is regardless of currently active filters.
  // Helps users discover where the data is concentrated.
  const counts = useMemo(() => {
    const types: Record<string, number> = {}
    const methods: Record<string, number> = {}
    let hz = 0
    for (const p of planets) {
      types[p.planet_type] = (types[p.planet_type] || 0) + 1
      const m = p.discoverymethod ?? 'Unknown'
      methods[m] = (methods[m] || 0) + 1
      if (p.in_habitable_zone) hz++
    }
    return { types, methods, hz }
  }, [planets])

  const activeFilterCount =
    filters.planetTypes.length +
    filters.discoveryMethods.length +
    (filters.habitableZoneOnly ? 1 : 0) +
    (filters.searchQuery ? 1 : 0)

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'transparent', paddingTop: 56 }}>
      <PageMeta
        title="Catalog"
        description={`Browse and filter ${totalCount.toLocaleString() || '6,000+'} confirmed exoplanets by class, detection method, temperature, size and mass. Click any target to open its full HUD profile.`}
      />

      {/* ─── HEADER: Display title + live readout ─── */}
      <section style={{ padding: '72px var(--gutter) 48px', position: 'relative' }}>
        {/* Ambient registration marks */}
        <RegistrationField seed="catalog-hero" density="medium" opacity={0.4} hideMobile inset={32} />

        <div style={{ maxWidth: 'var(--max-w)', margin: '0 auto', position: 'relative' }}>
          {/* Eyebrow strip */}
          <div data-reveal="up" style={{
            display: 'flex', alignItems: 'center', gap: 14,
            paddingBottom: 24,
            borderBottom: '1px solid var(--border-hud)',
            marginBottom: 36,
            flexWrap: 'wrap', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-primary)', letterSpacing: 3 }}>
                CATALOG
              </span>
              <span style={{ width: 32, height: 1, background: 'var(--hud-line)' }} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', letterSpacing: 2.5, textTransform: 'uppercase' }}>
                Archive · Browse · Filter
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
            <div className="page-eyebrow-tail">
              <span data-tail-hatch><HatchFill style={{ width: 18, height: 8 }} opacity={0.4} /></span>
              <TrackingCode seed={`catalog-${totalCount}`} variant="hex" />
            </div>
          </div>

          <div data-reveal="up" data-d="2" style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)',
            gap: 72,
            alignItems: 'end',
          }} className="catalog-hero-grid">
            <h1 style={{
              fontFamily: 'var(--font-astra)',
              fontSize: 'clamp(48px, 8vw, 120px)',
              fontWeight: 600,
              lineHeight: 0.95,
              letterSpacing: '0.01em',
              color: 'var(--text-primary)',
              margin: 0,
            }}>
              Databank{' '}
              <span style={{
                fontFamily: 'var(--font-display)',
                fontStyle: 'italic',
                fontWeight: 300,
                letterSpacing: '-0.01em',
                color: 'var(--text-muted)',
              }}>
                index.
              </span>
            </h1>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 22, alignItems: 'flex-start' }}>
              <p style={{
                fontFamily: 'var(--font-body)', fontSize: 16,
                color: 'var(--text-muted)', lineHeight: 1.7,
                margin: 0, maxWidth: '44ch',
              }}>
                Every confirmed exoplanet in the NASA archive, searchable and filterable by size,
                composition, temperature, distance, and detection method. Click any target to open
                its full HUD profile.
              </p>

              {/* View mode switcher: grid (current) ↔ cockpit (interactive 3D) */}
              <div className="catalog-mode-switch" style={{
                display: 'inline-flex', alignItems: 'center', gap: 12,
                padding: '6px',
                border: '1px solid var(--border-hud)',
                background: 'rgba(255,255,255,0.025)',
              }}>
                <span style={{
                  fontFamily: 'var(--font-mono)', fontSize: 9,
                  color: 'var(--text-dim)', letterSpacing: 2,
                  textTransform: 'uppercase',
                  paddingInline: 8,
                }}>
                  View mode →
                </span>
                <span
                  aria-current="page"
                  className="catalog-mode-pill catalog-mode-pill--on"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '8px 14px',
                    background: 'var(--hud-cyan)',
                    color: 'var(--bg-void)',
                    fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600,
                    letterSpacing: 2, textTransform: 'uppercase',
                  }}
                >
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--bg-void)' }} />
                  Grid
                </span>
                <Link
                  to="/explorer"
                  className="catalog-mode-pill"
                  title="Open the 3D cockpit — full-screen interactive scan with HUD telemetry"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '8px 14px',
                    background: 'transparent',
                    color: 'var(--text-muted)',
                    fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 500,
                    letterSpacing: 2, textTransform: 'uppercase',
                    textDecoration: 'none',
                    transition: 'color 180ms, background 180ms',
                  }}
                >
                  Cockpit
                  <ChevronRight size={11} strokeWidth={2.5} />
                </Link>
              </div>
            </div>
          </div>

          {/* Live readout row */}
          <div data-reveal="up" data-d="1" className="catalog-readout" style={{
            marginTop: 48,
            display: 'grid',
            gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
            gap: 16,
            borderTop: '1px solid var(--border-hud)',
            borderBottom: '1px solid var(--border-hud)',
            padding: '18px 0',
          }}>
            {[
              { label: 'TOTAL', value: totalCount > 0 ? totalCount.toLocaleString() : '—' },
              { label: 'FILTERED', value: filteredPlanets.length.toLocaleString() },
              { label: 'IN HZ', value: stats.hz.toLocaleString() },
              { label: 'AVG SCORE', value: stats.avgScore.toFixed(1) },
            ].map((t, i) => (
              <div key={t.label} style={{
                display: 'flex', flexDirection: 'column', gap: 4,
                paddingLeft: i > 0 ? 16 : 0,
                borderLeft: i > 0 ? '1px solid var(--border-hud)' : 'none',
              }}>
                <span style={{
                  fontFamily: 'var(--font-mono)', fontSize: 9,
                  color: 'var(--text-dim)', letterSpacing: 2,
                }}>
                  {t.label}
                </span>
                <span style={{
                  fontFamily: 'var(--font-mono)', fontSize: 24, fontWeight: 500,
                  color: 'var(--text-primary)', letterSpacing: '-0.02em',
                }}>
                  {t.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── COMMAND BAR: search + sort + filters ─── */}
      <section style={{ padding: '0 var(--gutter) 32px' }}>
        <div style={{ maxWidth: 'var(--max-w)', margin: '0 auto' }}>
          <div
            data-reveal="up"
            className="hud-glass"
            style={{
              position: 'relative',
              border: '1px solid var(--border-hud)',
              padding: 20,
            }}
          >
            {/* Status line: friendly result count + active filter badge */}
            <div className="catalog-status" style={{
              paddingBottom: 14, marginBottom: 14,
              borderBottom: '1px dashed var(--border-hud)',
              display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap',
              gap: 12, alignItems: 'center',
            }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
                <span style={{
                  fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 600,
                  color: 'var(--text-primary)', letterSpacing: '-0.02em',
                }}>
                  {filteredPlanets.length.toLocaleString()}
                </span>
                <span style={{
                  fontFamily: 'var(--font-body)', fontSize: 14,
                  color: 'var(--text-muted)',
                }}>
                  of {totalCount.toLocaleString()} planet{totalCount !== 1 ? 's' : ''}
                </span>
                {activeFilterCount > 0 && (
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '3px 9px',
                    background: 'rgba(34, 211, 238, 0.08)',
                    border: '1px solid var(--hud-cyan-30, rgba(34,211,238,0.32))',
                    fontFamily: 'var(--font-mono)', fontSize: 10,
                    color: 'var(--hud-cyan)', letterSpacing: 1.5,
                    textTransform: 'uppercase',
                  }}>
                    <span style={{
                      width: 5, height: 5, borderRadius: '50%',
                      background: 'var(--hud-cyan)',
                      boxShadow: '0 0 5px var(--hud-cyan-glow)',
                    }} />
                    {activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''} active
                  </span>
                )}
              </div>
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: 10,
                color: 'var(--text-dim)', letterSpacing: 2, textTransform: 'uppercase',
              }}>
                {stats.hz.toLocaleString()} in habitable zone · avg score {stats.avgScore.toFixed(1)}
              </span>
            </div>

            {/* Active filters bar — chips with X to remove individually */}
            {activeFilterCount > 0 && (
              <div className="catalog-active-bar" style={{
                display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8,
                paddingBottom: 14, marginBottom: 14,
                borderBottom: '1px dashed var(--border-hud)',
              }}>
                <span style={{
                  fontFamily: 'var(--font-mono)', fontSize: 9,
                  color: 'var(--text-dim)', letterSpacing: 2,
                  textTransform: 'uppercase', marginRight: 4,
                }}>
                  Filtering by →
                </span>
                {filters.searchQuery && (
                  <ActiveChip onRemove={() => { updateFilter('searchQuery', ''); setVisibleCount(PAGE_SIZE) }}>
                    SEARCH · "{filters.searchQuery}"
                  </ActiveChip>
                )}
                {filters.planetTypes.map((t) => (
                  <ActiveChip key={t} onRemove={() => toggleType(t)}>
                    {TYPE_LABEL_BY_VALUE[t] ?? t}
                  </ActiveChip>
                ))}
                {filters.discoveryMethods.map((m) => (
                  <ActiveChip key={m} onRemove={() => toggleDiscoveryMethod(m)}>
                    {METHOD_LABEL_BY_VALUE[m] ?? m}
                  </ActiveChip>
                ))}
                {filters.habitableZoneOnly && (
                  <ActiveChip onRemove={() => updateFilter('habitableZoneOnly', false)}>
                    HABITABLE ZONE
                  </ActiveChip>
                )}
                <button
                  onClick={() => { resetFilters(); setVisibleCount(PAGE_SIZE) }}
                  style={{
                    marginLeft: 'auto',
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '4px 10px',
                    background: 'transparent',
                    border: '1px solid var(--hud-red, #FF5470)',
                    color: 'var(--hud-red, #FF5470)',
                    fontFamily: 'var(--font-mono)', fontSize: 10,
                    letterSpacing: 1.5, textTransform: 'uppercase',
                    cursor: 'pointer',
                  }}
                  title="Remove all active filters"
                >
                  <X size={11} /> Clear all
                </button>
              </div>
            )}

            {/* Controls row */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
              {/* Search */}
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
                    setVisibleCount(PAGE_SIZE)
                  }}
                  placeholder="Search planet or host star..."
                  className="catalog-search-input"
                  style={{
                    width: '100%',
                    padding: '10px 14px 10px 34px',
                    background: 'rgba(255,255,255,0.025)',
                    border: '1px solid var(--border-hud)',
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 12,
                    letterSpacing: 0.5,
                    outline: 'none',
                    transition: 'border-color 200ms ease, background 200ms ease',
                  }}
                />
              </div>

              <HudSelect
                value={filters.sortBy}
                onChange={(v) => updateFilter('sortBy', v as FilterState['sortBy'])}
                options={SORT_OPTIONS}
                prefix="SORT"
              />

              <HudButton
                onClick={() => updateFilter('sortOrder', filters.sortOrder === 'asc' ? 'desc' : 'asc')}
                icon={<ArrowUpDown size={12} />}
                title={`Sort direction: ${filters.sortOrder === 'asc' ? 'ascending (low → high)' : 'descending (high → low)'}. Click to flip.`}
              >
                {filters.sortOrder === 'asc' ? 'Low → High' : 'High → Low'}
              </HudButton>

              <HudButton
                onClick={() => {
                  updateFilter('habitableZoneOnly', !filters.habitableZoneOnly)
                  setVisibleCount(PAGE_SIZE)
                }}
                active={filters.habitableZoneOnly}
                accent
                title={`Show only planets in their star's habitable zone — the orbit range where liquid water could exist on the surface. ${counts.hz.toLocaleString()} planets qualify.`}
              >
                Habitable Zone {!filters.habitableZoneOnly && (
                  <span style={{ color: 'var(--text-dim)', marginLeft: 4 }}>({counts.hz.toLocaleString()})</span>
                )}
              </HudButton>

              <HudButton
                onClick={() => setShowFilters(!showFilters)}
                active={showFilters}
                icon={<Sliders size={12} />}
                title="Open advanced range filters: temperature, radius, minimum habitability score."
              >
                {showFilters ? 'Hide ranges' : 'Ranges'}
              </HudButton>
            </div>

            {/* Section headers + chip rows */}
            <div style={{ marginTop: 18 }}>
              <ChipSectionLabel
                title="Planet type"
                hint="Filter by physical class — rocky worlds, gas giants, icy bodies, etc."
                activeCount={filters.planetTypes.length}
              />
              <ChipRow
                options={PLANET_TYPES}
                active={filters.planetTypes}
                onToggle={toggleType}
                counts={counts.types}
              />
            </div>
            <div style={{ marginTop: 16 }}>
              <ChipSectionLabel
                title="Detection method"
                hint="Filter by how the planet was originally discovered. Hover any method for a brief explanation."
                activeCount={filters.discoveryMethods.length}
              />
              <ChipRow
                options={DISCOVERY_METHODS}
                active={filters.discoveryMethods}
                onToggle={toggleDiscoveryMethod}
                counts={counts.methods}
              />
            </div>

            {/* Expanded range filters */}
            {showFilters && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: 24,
                marginTop: 20,
                paddingTop: 20,
                borderTop: '1px dashed var(--border-hud)',
              }}>
                <RangeFilter
                  label="TEMPERATURE"
                  unit="K"
                  min={0} max={5000} step={50}
                  value={filters.temperatureRange}
                  onChange={(v) => { updateFilter('temperatureRange', v); setVisibleCount(PAGE_SIZE) }}
                />
                <RangeFilter
                  label="RADIUS"
                  unit="R⊕"
                  min={0} max={30} step={0.5}
                  value={filters.radiusRange}
                  onChange={(v) => { updateFilter('radiusRange', v); setVisibleCount(PAGE_SIZE) }}
                />
                <div>
                  <div style={{
                    display: 'flex', justifyContent: 'space-between',
                    fontFamily: 'var(--font-mono)', fontSize: 10,
                    color: 'var(--text-dim)', letterSpacing: 1.5,
                    marginBottom: 8, textTransform: 'uppercase',
                  }}>
                    <span>MIN HAB. SCORE</span>
                    <span style={{ color: 'var(--text-primary)' }}>{filters.minHabitabilityScore}</span>
                  </div>
                  <input
                    type="range"
                    min={0} max={100} step={1}
                    value={filters.minHabitabilityScore}
                    onChange={(e) => { updateFilter('minHabitabilityScore', +e.target.value); setVisibleCount(PAGE_SIZE) }}
                    style={{ width: '100%', accentColor: 'var(--hud-cyan)' }}
                  />
                </div>
              </div>
            )}

            {/* Decorative barcode bottom-right */}
            <div style={{
              position: 'absolute',
              bottom: 20, right: 20,
              pointerEvents: 'none',
              display: 'none',
            }}>
              <Barcode seed={`catalog-${filteredPlanets.length}`} bars={28} height={12} />
            </div>
          </div>
        </div>
      </section>

      {/* ─── GRID ─── */}
      <section style={{ padding: '0 var(--gutter) 96px' }}>
        <div style={{ maxWidth: 'var(--max-w)', margin: '0 auto' }}>
          {isLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
              <div style={{
                width: 28, height: 28,
                border: '2px solid var(--border-hud)',
                borderTop: '2px solid var(--hud-cyan)',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
              }} />
            </div>
          ) : visiblePlanets.length === 0 ? (
            <div
              data-reveal="up"
              className="hud-glass catalog-empty"
              style={{
                position: 'relative',
                border: '1px solid var(--border-hud)',
                padding: 'clamp(40px, 7vw, 72px) clamp(24px, 5vw, 48px)',
                textAlign: 'center',
              }}
            >
              <CornerBrackets size={10} inset={-1} color="var(--hud-amber)" thickness={1} />

              {/* Top strip */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
                marginBottom: 28, flexWrap: 'wrap',
              }}>
                <span style={{
                  fontFamily: 'var(--font-mono)', fontSize: 10,
                  color: 'var(--hud-amber)', letterSpacing: 2.5,
                }}>
                  ERR_EMPTY_SET
                </span>
                <span style={{ width: 24, height: 1, background: 'var(--hud-amber)', opacity: 0.5 }} />
                <span style={{
                  fontFamily: 'var(--font-mono)', fontSize: 10,
                  color: 'var(--text-dim)', letterSpacing: 2,
                }}>
                  Query · 0 results
                </span>
              </div>

              {/* Visual: empty radar */}
              <div style={{
                margin: '0 auto 28px', width: 'clamp(96px, 14vw, 132px)', height: 'clamp(96px, 14vw, 132px)',
              }}>
                <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                  <circle cx="50" cy="50" r="44" fill="none" stroke="var(--border-hud-strong)" strokeWidth="0.7" />
                  <circle cx="50" cy="50" r="32" fill="none" stroke="var(--border-hud)" strokeWidth="0.5" strokeDasharray="2 4" />
                  <circle cx="50" cy="50" r="20" fill="none" stroke="var(--border-hud)" strokeWidth="0.5" strokeDasharray="2 4" />
                  <line x1="6" y1="50" x2="94" y2="50" stroke="var(--border-hud)" strokeWidth="0.5" />
                  <line x1="50" y1="6" x2="50" y2="94" stroke="var(--border-hud)" strokeWidth="0.5" />
                  <g style={{ transformOrigin: '50px 50px', animation: 'catalog-empty-sweep 3.6s linear infinite' }}>
                    <line x1="50" y1="50" x2="50" y2="6" stroke="var(--hud-amber)" strokeWidth="1" opacity="0.55" />
                  </g>
                  <text
                    x="50" y="53"
                    textAnchor="middle"
                    fill="var(--hud-amber)"
                    fontFamily="var(--font-mono)"
                    fontSize="6"
                    letterSpacing="1.2"
                  >
                    NO SIGNAL
                  </text>
                </svg>
              </div>

              <h3 style={{
                fontFamily: 'var(--font-astra)', fontSize: 'clamp(28px, 4.5vw, 56px)',
                fontWeight: 600, color: 'var(--text-primary)',
                margin: 0, lineHeight: 1.05,
              }}>
                Empty result set.
              </h3>
              <p style={{
                fontFamily: 'var(--font-body)', fontSize: 15, lineHeight: 1.7,
                color: 'var(--text-muted)',
                margin: '18px auto 0', maxWidth: '52ch',
              }}>
                The current filter combination returned zero archive entries. Loosen the
                window, drop a constraint, or reset to the full catalog.
              </p>

              {/* Active filters summary */}
              {activeFilterCount > 0 && (
                <div style={{
                  margin: '24px auto 0',
                  display: 'inline-flex', flexWrap: 'wrap', gap: 8,
                  justifyContent: 'center',
                }}>
                  {filters.searchQuery && (
                    <span className="catalog-empty-chip">SEARCH · "{filters.searchQuery}"</span>
                  )}
                  {filters.planetTypes.map((t) => (
                    <span key={t} className="catalog-empty-chip">TYPE · {t.replace('_', ' ')}</span>
                  ))}
                  {filters.discoveryMethods.map((m) => (
                    <span key={m} className="catalog-empty-chip">METHOD · {m}</span>
                  ))}
                  {filters.habitableZoneOnly && (
                    <span className="catalog-empty-chip">HZ ONLY</span>
                  )}
                </div>
              )}

              <button
                onClick={() => { resetFilters(); setVisibleCount(PAGE_SIZE) }}
                style={{
                  marginTop: 32,
                  display: 'inline-flex', alignItems: 'center', gap: 10,
                  padding: '12px 24px',
                  background: 'var(--hud-cyan)',
                  color: 'var(--bg-void)',
                  border: '1px solid var(--hud-cyan)',
                  fontFamily: 'var(--font-mono)', fontSize: 11,
                  letterSpacing: 2, textTransform: 'uppercase',
                  cursor: 'pointer',
                  clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)',
                }}
              >
                Reset filters
              </button>

              <style>{`
                @keyframes catalog-empty-sweep {
                  to { transform: rotate(360deg); }
                }
                .catalog-empty-chip {
                  padding: 4px 10px;
                  border: 1px solid var(--border-hud);
                  background: rgba(255,255,255,0.02);
                  color: var(--text-muted);
                  font-family: var(--font-mono); font-size: 9px;
                  letter-spacing: 1.5px; text-transform: uppercase;
                }
              `}</style>
            </div>
          ) : (
            <>
              <div className="catalog-grid">
                {/* 3 cols desktop · 2 tablet · 1 mobile — set via <style> below */}
                {visiblePlanets.map((planet, i) => (
                  <div
                    key={planet.id}
                    data-reveal="up"
                    data-d={Math.min((i % 8) + 1, 8).toString()}
                  >
                    <PlanetCard planet={planet} />
                  </div>
                ))}
              </div>

              {visibleCount < filteredPlanets.length && (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0 0' }}>
                  <button
                    onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                    className="catalog-load-more hud-cta-secondary"
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 12,
                      padding: '14px 32px',
                      background: 'transparent',
                      border: '1px solid var(--border-hud-strong)',
                      color: 'var(--hud-cyan)',
                      fontFamily: 'var(--font-mono)',
                      fontSize: 11,
                      fontWeight: 500,
                      letterSpacing: 2,
                      textTransform: 'uppercase',
                      cursor: 'pointer',
                      clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)',
                      transition: 'background 200ms',
                    }}
                  >
                    Load More
                    <span style={{ color: 'var(--text-muted)' }}>
                      · {(filteredPlanets.length - visibleCount).toLocaleString()} remaining
                    </span>
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .catalog-search-input::placeholder { color: var(--text-dim); }
        .catalog-search-input:focus { border-color: var(--border-hud-strong); background: rgba(255,255,255,0.04); }
        .catalog-load-more:hover { background: var(--hud-cyan-glow) !important; }

        /* View mode switcher · inactive pill hover */
        .catalog-mode-pill:not(.catalog-mode-pill--on):hover {
          color: var(--hud-cyan) !important;
          background: rgba(34,211,238,0.06) !important;
        }

        /* ── Filter chips · clear active state ── */
        .filter-chip {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 7px 12px;
          background: rgba(255,255,255,0.025);
          border: 1px solid var(--border-hud);
          color: var(--text-muted);
          font-family: var(--font-mono);
          font-size: 11px;
          letter-spacing: 0.6px;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 160ms ease;
        }
        .filter-chip:hover:not(:disabled) {
          border-color: var(--border-hud-strong);
          color: var(--text-primary);
          background: rgba(255,255,255,0.05);
        }
        .filter-chip-mark {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 14px; height: 14px;
          font-size: 11px;
          line-height: 1;
          font-weight: 600;
          border: 1px solid var(--border-hud-strong);
          color: var(--text-dim);
          flex-shrink: 0;
          transition: all 160ms ease;
        }
        .filter-chip-count {
          font-size: 10px;
          color: var(--text-dim);
          letter-spacing: 0.4px;
          padding-left: 4px;
          margin-left: 2px;
          border-left: 1px solid var(--border-hud);
        }
        .filter-chip--on {
          background: var(--hud-cyan);
          border-color: var(--hud-cyan);
          color: var(--bg-void);
          box-shadow: 0 0 12px rgba(34,211,238,0.30);
        }
        .filter-chip--on:hover {
          background: var(--hud-cyan-soft);
          border-color: var(--hud-cyan-soft);
          color: var(--bg-void);
        }
        .filter-chip--on .filter-chip-mark {
          background: var(--bg-void);
          border-color: var(--bg-void);
          color: var(--hud-cyan);
        }
        .filter-chip--on .filter-chip-count {
          color: rgba(5,7,13,0.7);
          border-left-color: rgba(5,7,13,0.25);
        }
        .filter-chip--disabled {
          opacity: 0.35;
          cursor: not-allowed;
        }
        .filter-chip--disabled:hover {
          border-color: var(--border-hud);
          color: var(--text-muted);
          background: rgba(255,255,255,0.025);
        }
        .catalog-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 20px;
        }
        .catalog-grid > * { min-width: 0; }
        @media (max-width: 960px) {
          .catalog-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
        @media (max-width: 600px) {
          .catalog-grid { grid-template-columns: minmax(0, 1fr); gap: 14px; }
        }
        @media (max-width: 860px) {
          .catalog-hero-grid {
            grid-template-columns: 1fr !important;
            gap: 28px !important;
            align-items: start !important;
          }
        }
        @media (max-width: 600px) {
          .catalog-readout {
            grid-template-columns: 1fr 1fr !important;
            gap: 14px !important;
          }
          .catalog-readout > div:nth-child(3) {
            border-left: none !important;
            padding-left: 0 !important;
          }
          .catalog-readout > div {
            font-size: smaller;
          }
        }
      `}</style>
    </div>
  )
}

/* ── Small HUD controls ── */

function HudButton({
  children, onClick, active, icon, ghost, accent, title,
}: {
  children: React.ReactNode
  onClick: () => void
  active?: boolean
  icon?: React.ReactNode
  ghost?: boolean
  accent?: boolean
  title?: string
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '10px 14px',
        background: active
          ? (accent ? 'var(--hud-cyan-glow)' : 'rgba(255,255,255,0.06)')
          : (ghost ? 'transparent' : 'rgba(255,255,255,0.025)'),
        border: ghost ? '1px solid transparent' : '1px solid var(--border-hud)',
        color: active
          ? (accent ? 'var(--hud-cyan)' : 'var(--text-primary)')
          : 'var(--text-muted)',
        fontFamily: 'var(--font-mono)',
        fontSize: 10,
        fontWeight: 500,
        letterSpacing: 1.5,
        textTransform: 'uppercase',
        cursor: 'pointer',
        transition: 'all 180ms ease',
      }}
      onMouseEnter={(e) => {
        if (!active && !ghost) e.currentTarget.style.borderColor = 'var(--border-hud-strong)'
      }}
      onMouseLeave={(e) => {
        if (!active && !ghost) e.currentTarget.style.borderColor = 'var(--border-hud)'
      }}
    >
      {icon}
      {children}
    </button>
  )
}

function HudSelect({
  value, onChange, options, prefix,
}: {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
  prefix?: string
}) {
  return (
    <div style={{ position: 'relative' }}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          appearance: 'none',
          padding: '10px 34px 10px 14px',
          background: 'rgba(255,255,255,0.025)',
          border: '1px solid var(--border-hud)',
          color: 'var(--text-primary)',
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          fontWeight: 500,
          letterSpacing: 1.5,
          textTransform: 'uppercase',
          cursor: 'pointer',
          outline: 'none',
        }}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} style={{ background: '#000' }}>
            {prefix ? `${prefix} · ` : ''}{opt.label}
          </option>
        ))}
      </select>
      <span style={{
        position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
        color: 'var(--text-dim)', pointerEvents: 'none',
        fontFamily: 'var(--font-mono)', fontSize: 10,
      }}>▾</span>
    </div>
  )
}

function ChipRow({
  options, active, onToggle, counts,
}: {
  options: { value: string; label: string; description?: string }[]
  active: string[]
  onToggle: (v: string) => void
  counts?: Record<string, number>
}) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {options.map(({ value, label: l, description }) => {
        const on = active.includes(value)
        const count = counts?.[value] ?? 0
        const disabled = count === 0 && !on
        return (
          <button
            key={value}
            onClick={() => !disabled && onToggle(value)}
            title={description}
            disabled={disabled}
            aria-pressed={on}
            className={`filter-chip${on ? ' filter-chip--on' : ''}${disabled ? ' filter-chip--disabled' : ''}`}
          >
            <span aria-hidden className="filter-chip-mark">
              {on ? '✓' : '+'}
            </span>
            <span>{l}</span>
            {counts !== undefined && (
              <span className="filter-chip-count">
                {count.toLocaleString()}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

/* ─────────── ActiveChip · removable summary chip ─────────── */

function ActiveChip({ children, onRemove }: { children: React.ReactNode; onRemove: () => void }) {
  return (
    <span
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '4px 4px 4px 10px',
        background: 'rgba(34, 211, 238, 0.10)',
        border: '1px solid rgba(34, 211, 238, 0.45)',
        color: 'var(--hud-cyan)',
        fontFamily: 'var(--font-mono)', fontSize: 10,
        letterSpacing: 1.2, textTransform: 'uppercase',
      }}
    >
      {children}
      <button
        type="button"
        onClick={onRemove}
        aria-label="Remove filter"
        title="Remove this filter"
        style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 18, height: 18,
          background: 'transparent',
          border: 'none',
          color: 'var(--hud-cyan)',
          cursor: 'pointer',
          padding: 0,
          marginLeft: 2,
          opacity: 0.7,
          transition: 'opacity 150ms, background 150ms',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.opacity = '1'
          e.currentTarget.style.background = 'rgba(34,211,238,0.18)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = '0.7'
          e.currentTarget.style.background = 'transparent'
        }}
      >
        <X size={12} />
      </button>
    </span>
  )
}

/* ─────────── ChipSectionLabel · sticky header above each chip group ─────────── */

function ChipSectionLabel({ title, hint, activeCount }: {
  title: string; hint: string; activeCount: number
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'baseline', gap: 10,
      marginBottom: 8, flexWrap: 'wrap',
    }}>
      <span style={{
        fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 500,
        color: 'var(--text-primary)', letterSpacing: 1.5,
        textTransform: 'uppercase',
      }}>
        {title}
      </span>
      {activeCount > 0 && (
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: 9,
          color: 'var(--hud-cyan)', letterSpacing: 1.5,
          textTransform: 'uppercase',
        }}>
          · {activeCount} selected
        </span>
      )}
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        <Info size={10} style={{ color: 'var(--text-dim)' }} />
        <span style={{
          fontFamily: 'var(--font-body)', fontSize: 11,
          color: 'var(--text-dim)',
        }}>
          {hint}
        </span>
      </span>
    </div>
  )
}

function RangeFilter({
  label, unit, min, max, step, value, onChange,
}: {
  label: string
  unit: string
  min: number; max: number; step: number
  value: [number, number]
  onChange: (v: [number, number]) => void
}) {
  return (
    <div>
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        fontFamily: 'var(--font-mono)', fontSize: 10,
        color: 'var(--text-dim)', letterSpacing: 1.5,
        marginBottom: 8, textTransform: 'uppercase',
      }}>
        <span>{label}</span>
        <span style={{ color: 'var(--text-primary)' }}>
          {value[0]} – {value[1]} <span style={{ color: 'var(--text-dim)' }}>{unit}</span>
        </span>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          type="range" min={min} max={max} step={step} value={value[0]}
          onChange={(e) => onChange([+e.target.value, value[1]])}
          style={{ width: '100%', accentColor: 'var(--hud-cyan)' }}
        />
        <input
          type="range" min={min} max={max} step={step} value={value[1]}
          onChange={(e) => onChange([value[0], +e.target.value])}
          style={{ width: '100%', accentColor: 'var(--hud-cyan)' }}
        />
      </div>
    </div>
  )
}
