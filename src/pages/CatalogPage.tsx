import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { PlanetCard } from '../components/Controls/PlanetCard'
import type { FilterState } from '../data/types'

const PLANET_TYPES = [
  { value: 'rocky', label: 'Rocky', icon: '🪨' },
  { value: 'super_earth', label: 'Super Earth', icon: '🌍' },
  { value: 'mini_neptune', label: 'Mini Neptune', icon: '💎' },
  { value: 'gas_giant', label: 'Gas Giant', icon: '🟠' },
  { value: 'hot_jupiter', label: 'Hot Jupiter', icon: '🔥' },
  { value: 'ice_giant', label: 'Ice Giant', icon: '🧊' },
  { value: 'lava_world', label: 'Lava World', icon: '🌋' },
  { value: 'frozen_rocky', label: 'Frozen', icon: '❄️' },
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

  const stats = useMemo(() => {
    const hz = filteredPlanets.filter((p) => p.in_habitable_zone).length
    const avgScore =
      filteredPlanets.length > 0
        ? filteredPlanets.reduce((sum, p) => sum + p.habitability_score, 0) / filteredPlanets.length
        : 0
    return { hz, avgScore }
  }, [filteredPlanets])

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#020617' }}>
      {/* ─── Navbar ─── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        borderBottom: '1px solid #1e293b',
        backgroundColor: 'rgba(2, 6, 23, 0.85)',
        backdropFilter: 'blur(12px)',
      }}>
        <div style={{
          maxWidth: 1280, margin: '0 auto',
          padding: '12px 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.5px' }}>
              <span style={{ color: '#60a5fa' }}>Exo</span>
              <span style={{ color: '#fff' }}>Terra</span>
            </h1>
            <span style={{ fontSize: 13, color: '#64748b' }}>
              {totalCount.toLocaleString()} exoplanets
            </span>
          </div>
          <Link
            to="/explorer"
            style={{
              padding: '8px 20px',
              backgroundColor: '#2563eb',
              color: '#fff',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            3D Explorer
          </Link>
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <header style={{
        maxWidth: 1280, margin: '0 auto',
        padding: '48px 24px 32px',
      }}>
        <h2 style={{ fontSize: 36, fontWeight: 700, color: '#fff', letterSpacing: '-1px' }}>
          Exoplanet Encyclopedia
        </h2>
        <p style={{ marginTop: 8, fontSize: 16, color: '#94a3b8', maxWidth: 640, lineHeight: 1.6 }}>
          Discover and explore {totalCount.toLocaleString()} confirmed exoplanets from the NASA Exoplanet Archive.
          Filter by habitability, temperature, composition, and more.
        </p>

        {/* Stats */}
        <div style={{
          marginTop: 24, display: 'flex', flexWrap: 'wrap', gap: 32,
        }}>
          <StatBlock label="Showing" value={filteredPlanets.length.toLocaleString()} />
          <StatBlock label="Habitable Zone" value={stats.hz.toString()} color="#4ade80" />
          <StatBlock label="Avg. Score" value={stats.avgScore.toFixed(1)} />
        </div>
      </header>

      {/* ─── Filter Bar ─── */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px 24px' }}>
        <div style={{
          backgroundColor: '#0f172a',
          border: '1px solid #1e293b',
          borderRadius: 12,
          padding: 20,
        }}>
          {/* Top row: search + controls */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
            <input
              type="text"
              value={filters.searchQuery}
              onChange={(e) => {
                updateFilter('searchQuery', e.target.value)
                setVisibleCount(PAGE_SIZE)
              }}
              placeholder="Search planet or star name..."
              style={{
                flex: 1, minWidth: 220,
                padding: '10px 16px',
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: 8,
                color: '#fff',
                fontSize: 14,
                outline: 'none',
              }}
            />

            <select
              value={filters.sortBy}
              onChange={(e) => updateFilter('sortBy', e.target.value as FilterState['sortBy'])}
              style={{
                padding: '10px 14px',
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: 8,
                color: '#fff',
                fontSize: 13,
              }}
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>Sort: {opt.label}</option>
              ))}
            </select>

            <button
              onClick={() => updateFilter('sortOrder', filters.sortOrder === 'asc' ? 'desc' : 'asc')}
              style={{
                padding: '10px 14px',
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: 8,
                color: '#fff',
                fontSize: 13,
              }}
            >
              {filters.sortOrder === 'asc' ? '↑ Asc' : '↓ Desc'}
            </button>

            <label style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 14px',
              backgroundColor: filters.habitableZoneOnly ? 'rgba(34, 197, 94, 0.15)' : '#1e293b',
              border: `1px solid ${filters.habitableZoneOnly ? 'rgba(34, 197, 94, 0.4)' : '#334155'}`,
              borderRadius: 8,
              color: filters.habitableZoneOnly ? '#4ade80' : '#fff',
              fontSize: 13,
              cursor: 'pointer',
            }}>
              <input
                type="checkbox"
                checked={filters.habitableZoneOnly}
                onChange={(e) => {
                  updateFilter('habitableZoneOnly', e.target.checked)
                  setVisibleCount(PAGE_SIZE)
                }}
                style={{ accentColor: '#22c55e' }}
              />
              Habitable Zone
            </label>

            <button
              onClick={() => setShowFilters(!showFilters)}
              style={{
                padding: '10px 14px',
                backgroundColor: showFilters ? '#1e3a5f' : '#1e293b',
                border: `1px solid ${showFilters ? '#3b82f6' : '#334155'}`,
                borderRadius: 8,
                color: '#fff',
                fontSize: 13,
              }}
            >
              {showFilters ? 'Hide Filters' : 'More Filters'}
            </button>

            <button
              onClick={() => { resetFilters(); setVisibleCount(PAGE_SIZE) }}
              style={{
                padding: '10px 14px',
                color: '#64748b',
                fontSize: 13,
                background: 'none',
                border: 'none',
              }}
            >
              Reset
            </button>
          </div>

          {/* Planet type chips */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 16 }}>
            {PLANET_TYPES.map(({ value, label, icon }) => {
              const active = filters.planetTypes.length === 0 || filters.planetTypes.includes(value)
              return (
                <button
                  key={value}
                  onClick={() => toggleType(value)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '6px 14px',
                    borderRadius: 999,
                    fontSize: 12,
                    fontWeight: 500,
                    backgroundColor: active ? '#1e293b' : 'transparent',
                    border: `1px solid ${active ? '#475569' : '#1e293b'}`,
                    color: active ? '#e2e8f0' : '#475569',
                    transition: 'all 0.15s',
                  }}
                >
                  <span>{icon}</span>
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
              borderTop: '1px solid #1e293b',
            }}>
              <RangeFilter
                label="Temperature (K)"
                min={0} max={5000} step={50}
                value={filters.temperatureRange}
                onChange={(v) => { updateFilter('temperatureRange', v); setVisibleCount(PAGE_SIZE) }}
              />
              <RangeFilter
                label="Radius (R⊕)"
                min={0} max={30} step={0.5}
                value={filters.radiusRange}
                onChange={(v) => { updateFilter('radiusRange', v); setVisibleCount(PAGE_SIZE) }}
              />
              <div>
                <div style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>
                  Min Habitability Score: <span style={{ color: '#e2e8f0' }}>{filters.minHabitabilityScore}</span>
                </div>
                <input
                  type="range"
                  min={0} max={100} step={1}
                  value={filters.minHabitabilityScore}
                  onChange={(e) => { updateFilter('minHabitabilityScore', +e.target.value); setVisibleCount(PAGE_SIZE) }}
                  style={{ width: '100%', accentColor: '#22c55e' }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── Grid ─── */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px 48px' }}>
        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
            <div style={{
              width: 32, height: 32,
              border: '3px solid #1e293b',
              borderTop: '3px solid #3b82f6',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }} />
          </div>
        ) : (
          <>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
              gap: 16,
            }}>
              {visiblePlanets.map((planet) => (
                <PlanetCard key={planet.id} planet={planet} />
              ))}
            </div>

            {visiblePlanets.length === 0 && (
              <div style={{ textAlign: 'center', padding: '80px 0', color: '#475569' }}>
                No planets match your filters. Try adjusting the criteria.
              </div>
            )}

            {visibleCount < filteredPlanets.length && (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '32px 0' }}>
                <button
                  onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                  style={{
                    padding: '12px 32px',
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: 10,
                    color: '#fff',
                    fontSize: 14,
                    fontWeight: 500,
                  }}
                >
                  Load more ({(filteredPlanets.length - visibleCount).toLocaleString()} remaining)
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

function StatBlock({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <div style={{ fontSize: 12, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 700, color: color ?? '#fff', marginTop: 2 }}>{value}</div>
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
      <div style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>
        {label}: <span style={{ color: '#e2e8f0' }}>{value[0]} – {value[1]}</span>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input type="range" min={min} max={max} step={step} value={value[0]}
          onChange={(e) => onChange([+e.target.value, value[1]])}
          style={{ width: '100%', accentColor: '#3b82f6' }}
        />
        <input type="range" min={min} max={max} step={step} value={value[1]}
          onChange={(e) => onChange([value[0], +e.target.value])}
          style={{ width: '100%', accentColor: '#3b82f6' }}
        />
      </div>
    </div>
  )
}
