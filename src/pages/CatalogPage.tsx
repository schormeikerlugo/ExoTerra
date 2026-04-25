import { useState, useMemo } from 'react'
import { Search, Filter, ArrowUpDown } from 'lucide-react'
import { useStore } from '../store/useStore'
import { PlanetCard } from '../components/Controls/PlanetCard'
import { Barcode } from '../components/HUD/Barcode'
import { useReveal } from '../hooks/useReveal'
import type { FilterState } from '../data/types'

const PLANET_TYPES = [
  { value: 'rocky', label: 'Rocky' },
  { value: 'super_earth', label: 'Super Earth' },
  { value: 'mini_neptune', label: 'Mini Neptune' },
  { value: 'gas_giant', label: 'Gas Giant' },
  { value: 'hot_jupiter', label: 'Hot Jupiter' },
  { value: 'ice_giant', label: 'Ice Giant' },
  { value: 'lava_world', label: 'Lava World' },
  { value: 'frozen_rocky', label: 'Frozen' },
]

const DISCOVERY_METHODS = [
  { value: 'Transit', label: 'Transit' },
  { value: 'Radial Velocity', label: 'Radial Velocity' },
  { value: 'Imaging', label: 'Imaging' },
  { value: 'Microlensing', label: 'Microlensing' },
  { value: 'Transit Timing Variations', label: 'TTV' },
  { value: 'Pulsar Timing', label: 'Pulsar' },
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

export function CatalogPage() {
  const filteredPlanets = useStore((s) => s.filteredPlanets)
  const filters = useStore((s) => s.filters)
  const updateFilter = useStore((s) => s.updateFilter)
  const resetFilters = useStore((s) => s.resetFilters)
  const totalCount = useStore((s) => s.planets.length)
  const isLoading = useStore((s) => s.isLoading)

  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [showFilters, setShowFilters] = useState(false)

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

  const activeFilterCount =
    filters.planetTypes.length +
    filters.discoveryMethods.length +
    (filters.habitableZoneOnly ? 1 : 0) +
    (filters.searchQuery ? 1 : 0)

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'transparent', paddingTop: 56 }}>

      {/* ─── HEADER: Display title + live readout ─── */}
      <section style={{ padding: '72px var(--gutter) 48px' }}>
        <div style={{ maxWidth: 'var(--max-w)', margin: '0 auto' }}>
          <div data-reveal="up" style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)',
            gap: 72,
            alignItems: 'end',
          }}>
            <h1 style={{
              fontFamily: 'var(--font-astra)',
              fontSize: 'clamp(48px, 8vw, 120px)',
              fontWeight: 600,
              lineHeight: 0.95,
              letterSpacing: '0.02em',
              textTransform: 'uppercase',
              color: 'var(--text-primary)',
              margin: 0,
            }}>
              Databank
            </h1>

            <div>
              <div style={{
                fontFamily: 'var(--font-mono)', fontSize: 10,
                color: 'var(--text-dim)', letterSpacing: 2, textTransform: 'uppercase',
                marginBottom: 12,
              }}>
                Archive · Browse · Filter
              </div>
              <p style={{
                fontSize: 16, color: 'var(--text-muted)', lineHeight: 1.65,
                margin: 0, maxWidth: '44ch',
              }}>
                Every confirmed exoplanet in the NASA archive, searchable and filterable by size,
                composition, temperature, distance, and detection method. Click any target to open
                its full HUD profile.
              </p>
            </div>
          </div>

          {/* Live readout row */}
          <div data-reveal="up" data-d="1" style={{
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
            {/* Prompt line */}
            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: 11,
              color: 'var(--text-muted)', letterSpacing: 0.5,
              paddingBottom: 14, marginBottom: 14,
              borderBottom: '1px dashed var(--border-hud)',
              display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
            }}>
              <span>
                <span style={{ color: 'var(--text-dim)' }}>exoterra@databank:~$</span>{' '}
                <span style={{ color: 'var(--text-primary)' }}>query /archive</span>
                {activeFilterCount > 0 && (
                  <span style={{ color: 'var(--hud-cyan)' }}> --filters={activeFilterCount}</span>
                )}
              </span>
              <span style={{ color: 'var(--text-dim)', letterSpacing: 1.5, textTransform: 'uppercase' }}>
                {filteredPlanets.length.toLocaleString()} / {totalCount.toLocaleString()} results
              </span>
            </div>

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
              >
                {filters.sortOrder === 'asc' ? 'ASC' : 'DESC'}
              </HudButton>

              <HudButton
                onClick={() => {
                  updateFilter('habitableZoneOnly', !filters.habitableZoneOnly)
                  setVisibleCount(PAGE_SIZE)
                }}
                active={filters.habitableZoneOnly}
                accent
              >
                HZ ONLY
              </HudButton>

              <HudButton
                onClick={() => setShowFilters(!showFilters)}
                active={showFilters}
                icon={<Filter size={12} />}
              >
                {showFilters ? 'HIDE' : 'MORE'}
              </HudButton>

              <HudButton
                onClick={() => { resetFilters(); setVisibleCount(PAGE_SIZE) }}
                ghost
              >
                RESET
              </HudButton>
            </div>

            {/* Chip rows */}
            <div style={{ marginTop: 14 }}>
              <ChipRow
                label="TYPE"
                options={PLANET_TYPES}
                active={filters.planetTypes}
                onToggle={toggleType}
              />
            </div>
            <div style={{ marginTop: 10 }}>
              <ChipRow
                label="METHOD"
                options={DISCOVERY_METHODS}
                active={filters.discoveryMethods}
                onToggle={toggleDiscoveryMethod}
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
              className="hud-glass"
              style={{
                textAlign: 'center', padding: '64px 24px',
                border: '1px dashed var(--border-hud)',
                fontFamily: 'var(--font-mono)', fontSize: 12,
                color: 'var(--text-muted)', letterSpacing: 1,
              }}
            >
              <div style={{ color: 'var(--text-primary)', marginBottom: 8, letterSpacing: 2, textTransform: 'uppercase' }}>
                No matches
              </div>
              Query returned 0 results. Try widening the filters or reset.
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
        .catalog-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }
        @media (max-width: 960px) {
          .catalog-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 600px) {
          .catalog-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  )
}

/* ── Small HUD controls ── */

function HudButton({
  children, onClick, active, icon, ghost, accent,
}: {
  children: React.ReactNode
  onClick: () => void
  active?: boolean
  icon?: React.ReactNode
  ghost?: boolean
  accent?: boolean
}) {
  return (
    <button
      onClick={onClick}
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
  label, options, active, onToggle,
}: {
  label: string
  options: { value: string; label: string }[]
  active: string[]
  onToggle: (v: string) => void
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
      <span style={{
        fontFamily: 'var(--font-mono)', fontSize: 9,
        color: 'var(--text-dim)', letterSpacing: 2,
        minWidth: 56,
      }}>
        {label} ⟶
      </span>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {options.map(({ value, label: l }) => {
          const on = active.includes(value)
          return (
            <button
              key={value}
              onClick={() => onToggle(value)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '5px 11px',
                background: on ? 'rgba(255,255,255,0.06)' : 'transparent',
                border: `1px solid ${on ? 'var(--border-hud-strong)' : 'var(--border-hud)'}`,
                color: on ? 'var(--text-primary)' : 'var(--text-muted)',
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                letterSpacing: 1.2,
                textTransform: 'uppercase',
                cursor: 'pointer',
                transition: 'all 160ms ease',
              }}
            >
              <span style={{
                width: 5, height: 5,
                background: on ? 'var(--hud-cyan)' : 'var(--border-hud-strong)',
                boxShadow: on ? '0 0 6px var(--hud-cyan)' : 'none',
              }} />
              {l}
            </button>
          )
        })}
      </div>
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
