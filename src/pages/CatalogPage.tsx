import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Search, Filter, ArrowUpDown, CircleDot } from 'lucide-react'
import { useStore } from '../store/useStore'
import { PlanetCard } from '../components/Controls/PlanetCard'
import type { FilterState } from '../data/types'
import { ACCENT, ACCENT_15 } from '../constants/colors'

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

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'transparent' }}>
      {/* Header */}
      <header style={{
        maxWidth: 1280, margin: '0 auto',
        padding: '48px 24px 32px',
      }}>
        <h2 style={{
          fontSize: 48, fontWeight: 700, color: '#fff',
          letterSpacing: '-1.5px', fontFamily: "'Outfit', sans-serif",
        }}>
          Catalog
        </h2>
        <p style={{
          marginTop: 8, fontSize: 16,
          color: 'rgba(255,255,255,0.6)',
          maxWidth: 640, lineHeight: 1.6,
        }}>
          Discover and explore {totalCount.toLocaleString()} confirmed exoplanets from the NASA Exoplanet Archive.
        </p>

        {/* Stats - inline text */}
        <p style={{
          marginTop: 24, fontSize: 14,
          color: 'rgba(255,255,255,0.4)',
        }}>
          <span style={{ color: '#fff', fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>
            {filteredPlanets.length.toLocaleString()}
          </span>
          {' planets  ·  '}
          <span style={{ color: ACCENT, fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>
            {stats.hz}
          </span>
          {' in habitable zone  ·  Avg score '}
          <span style={{ color: '#fff', fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>
            {stats.avgScore.toFixed(1)}
          </span>
        </p>
      </header>

      {/* Filter Bar */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px 24px' }}>
        <div style={{
          backgroundColor: '#0f0f0f',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 16,
          padding: 24,
        }}>
          {/* Top row: search + controls */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
              <Search size={16} style={{
                position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                color: 'rgba(255,255,255,0.3)', pointerEvents: 'none',
              }} />
              <input
                type="text"
                value={filters.searchQuery}
                onChange={(e) => {
                  updateFilter('searchQuery', e.target.value)
                  setVisibleCount(PAGE_SIZE)
                }}
                placeholder="Search planet or star name..."
                className="catalog-search-input"
                style={{
                  width: '100%',
                  padding: '10px 16px 10px 40px',
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 12,
                  color: '#fff',
                  fontSize: 14,
                  outline: 'none',
                  transition: 'border-color 200ms ease',
                }}
              />
            </div>

            <select
              value={filters.sortBy}
              onChange={(e) => updateFilter('sortBy', e.target.value as FilterState['sortBy'])}
              style={{
                padding: '10px 14px',
                backgroundColor: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 12,
                color: 'rgba(255,255,255,0.6)',
                fontSize: 13,
                outline: 'none',
              }}
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>Sort: {opt.label}</option>
              ))}
            </select>

            <button
              onClick={() => updateFilter('sortOrder', filters.sortOrder === 'asc' ? 'desc' : 'asc')}
              className="catalog-btn-secondary"
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '10px 14px',
                backgroundColor: 'transparent',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 12,
                color: 'rgba(255,255,255,0.6)',
                fontSize: 13,
                cursor: 'pointer',
                transition: 'background 200ms ease',
              }}
            >
              <ArrowUpDown size={14} />
              {filters.sortOrder === 'asc' ? 'Asc' : 'Desc'}
            </button>

            <label
              className="catalog-btn-secondary"
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 14px',
                backgroundColor: filters.habitableZoneOnly ? ACCENT_15 : 'transparent',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 12,
                color: filters.habitableZoneOnly ? ACCENT : 'rgba(255,255,255,0.6)',
                fontSize: 13,
                cursor: 'pointer',
                transition: 'background 200ms ease',
              }}
            >
              <CircleDot size={14} />
              <input
                type="checkbox"
                checked={filters.habitableZoneOnly}
                onChange={(e) => {
                  updateFilter('habitableZoneOnly', e.target.checked)
                  setVisibleCount(PAGE_SIZE)
                }}
                style={{ display: 'none' }}
              />
              Habitable Zone
            </label>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="catalog-btn-secondary"
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '10px 14px',
                backgroundColor: showFilters ? 'rgba(255,255,255,0.1)' : 'transparent',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 12,
                color: showFilters ? '#fff' : 'rgba(255,255,255,0.6)',
                fontSize: 13,
                cursor: 'pointer',
                transition: 'background 200ms ease',
              }}
            >
              <Filter size={14} />
              {showFilters ? 'Hide Filters' : 'More Filters'}
            </button>

            <button
              onClick={() => { resetFilters(); setVisibleCount(PAGE_SIZE) }}
              className="catalog-btn-secondary"
              style={{
                padding: '10px 14px',
                color: 'rgba(255,255,255,0.4)',
                fontSize: 13,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                transition: 'background 200ms ease',
              }}
            >
              Reset
            </button>
          </div>

          {/* Planet type chips */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 16 }}>
            {PLANET_TYPES.map(({ value, label }) => {
              const active = filters.planetTypes.includes(value)
              return (
                <button
                  key={value}
                  onClick={() => toggleType(value)}
                  className="catalog-chip"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '6px 14px',
                    borderRadius: 9999,
                    fontSize: 12,
                    fontWeight: 500,
                    backgroundColor: active ? 'rgba(255,255,255,0.1)' : 'transparent',
                    border: '1px solid rgba(255,255,255,0.06)',
                    color: active ? '#fff' : 'rgba(255,255,255,0.4)',
                    cursor: 'pointer',
                    transition: 'background 200ms ease, color 200ms ease',
                  }}
                >
                  {label}
                </button>
              )
            })}
          </div>

          {/* Discovery method chips */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
            {DISCOVERY_METHODS.map(({ value, label }) => {
              const active = filters.discoveryMethods.includes(value)
              return (
                <button
                  key={value}
                  onClick={() => toggleDiscoveryMethod(value)}
                  className="catalog-chip"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '6px 14px',
                    borderRadius: 9999,
                    fontSize: 12,
                    fontWeight: 500,
                    backgroundColor: active ? 'rgba(255,255,255,0.1)' : 'transparent',
                    border: '1px solid rgba(255,255,255,0.06)',
                    color: active ? '#fff' : 'rgba(255,255,255,0.4)',
                    cursor: 'pointer',
                    transition: 'background 200ms ease, color 200ms ease',
                  }}
                >
                  {label}
                </button>
              )
            })}
          </div>

          {/* Expanded filters */}
          {showFilters && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: 20,
              marginTop: 20,
              paddingTop: 20,
              borderTop: '1px solid rgba(255,255,255,0.06)',
            }}>
              <RangeFilter
                label="Temperature (K)"
                min={0} max={5000} step={50}
                value={filters.temperatureRange}
                onChange={(v) => { updateFilter('temperatureRange', v); setVisibleCount(PAGE_SIZE) }}
              />
              <RangeFilter
                label="Radius (R Earth)"
                min={0} max={30} step={0.5}
                value={filters.radiusRange}
                onChange={(v) => { updateFilter('radiusRange', v); setVisibleCount(PAGE_SIZE) }}
              />
              <div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>
                  Min Habitability Score: <span style={{ color: 'rgba(255,255,255,0.7)' }}>{filters.minHabitabilityScore}</span>
                </div>
                <input
                  type="range"
                  min={0} max={100} step={1}
                  value={filters.minHabitabilityScore}
                  onChange={(e) => { updateFilter('minHabitabilityScore', +e.target.value); setVisibleCount(PAGE_SIZE) }}
                  style={{ width: '100%', accentColor: ACCENT }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Grid */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px 48px' }}>
        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
            <div style={{
              width: 32, height: 32,
              border: '3px solid rgba(255,255,255,0.06)',
              borderTop: '3px solid #fff',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }} />
          </div>
        ) : (
          <>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 20,
            }}>
              {visiblePlanets.map((planet) => (
                <div key={planet.id}>
                  <PlanetCard planet={planet} />
                </div>
              ))}
            </div>

            {visiblePlanets.length === 0 && (
              <div style={{
                textAlign: 'center', padding: '80px 0',
                color: 'rgba(255,255,255,0.4)',
              }}>
                No planets match your filters. Try adjusting the criteria.
              </div>
            )}

            {visibleCount < filteredPlanets.length && (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '32px 0' }}>
                <button
                  onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                  className="catalog-load-more"
                  style={{
                    padding: '12px 32px',
                    backgroundColor: 'transparent',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 12,
                    color: '#fff',
                    fontSize: 14,
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'background 200ms ease',
                  }}
                >
                  Load more ({(filteredPlanets.length - visibleCount).toLocaleString()} remaining)
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .catalog-nav-link:hover { background: rgba(255,255,255,0.04) !important; }
        .catalog-search-input:focus { border-color: rgba(255,255,255,0.3) !important; }
        .catalog-btn-secondary:hover { background: rgba(255,255,255,0.04) !important; }
        .catalog-chip:hover { background: rgba(255,255,255,0.04) !important; }
        .catalog-load-more:hover { background: rgba(255,255,255,0.04) !important; }
        *::-webkit-scrollbar { display: none; }
        * { scrollbar-width: none; }
      `}</style>
    </div>
  )
}

function RangeFilter({
  label, min, max, step, value, onChange,
}: {
  label: string; min: number; max: number; step: number
  value: [number, number]; onChange: (v: [number, number]) => void
}) {
  return (
    <div>
      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>
        {label}: <span style={{ color: 'rgba(255,255,255,0.7)' }}>{value[0]} - {value[1]}</span>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input type="range" min={min} max={max} step={step} value={value[0]}
          onChange={(e) => onChange([+e.target.value, value[1]])}
          style={{ width: '100%', accentColor: '#fff' }}
        />
        <input type="range" min={min} max={max} step={step} value={value[1]}
          onChange={(e) => onChange([value[0], +e.target.value])}
          style={{ width: '100%', accentColor: '#fff' }}
        />
      </div>
    </div>
  )
}
