import { useStore } from '../../store/useStore'

const PLANET_TYPES = [
  { value: 'rocky', label: 'Rocky' },
  { value: 'super_earth', label: 'Super Earth' },
  { value: 'mini_neptune', label: 'Mini Neptune' },
  { value: 'gas_giant', label: 'Gas Giant' },
  { value: 'hot_jupiter', label: 'Hot Jupiter' },
  { value: 'ice_giant', label: 'Ice Giant' },
  { value: 'lava_world', label: 'Lava World' },
  { value: 'frozen_rocky', label: 'Frozen Rocky' },
]

export function FilterPanel() {
  const filters = useStore((s) => s.filters)
  const updateFilter = useStore((s) => s.updateFilter)
  const resetFilters = useStore((s) => s.resetFilters)
  const filteredCount = useStore((s) => s.filteredPlanets.length)
  const totalCount = useStore((s) => s.planets.length)

  const toggleType = (type: string) => {
    const current = filters.planetTypes
    const next = current.includes(type) ? current.filter((t) => t !== type) : [...current, type]
    updateFilter('planetTypes', next)
  }

  return (
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16, fontSize: 13 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: 14, fontWeight: 600, color: '#f1f5f9' }}>Filters</h2>
        <button onClick={resetFilters} style={{ fontSize: 12, color: '#64748b', background: 'none', border: 'none' }}>Reset</button>
      </div>

      <div style={{ fontSize: 12, color: '#64748b' }}>
        {filteredCount.toLocaleString()} / {totalCount.toLocaleString()} planets
      </div>

      {/* Search */}
      <div>
        <label style={{ display: 'block', fontSize: 11, color: '#64748b', marginBottom: 6 }}>Search</label>
        <input
          type="text"
          value={filters.searchQuery}
          onChange={(e) => updateFilter('searchQuery', e.target.value)}
          placeholder="Planet or star name..."
          style={{
            width: '100%', padding: '8px 12px',
            backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 6,
            color: '#fff', fontSize: 13, outline: 'none',
          }}
        />
      </div>

      {/* Temperature */}
      <div>
        <label style={{ display: 'block', fontSize: 11, color: '#64748b', marginBottom: 6 }}>
          Temperature: {filters.temperatureRange[0]}K – {filters.temperatureRange[1]}K
        </label>
        <div style={{ display: 'flex', gap: 8 }}>
          <input type="range" min={0} max={5000} step={50} value={filters.temperatureRange[0]}
            onChange={(e) => updateFilter('temperatureRange', [+e.target.value, filters.temperatureRange[1]])}
            style={{ width: '100%', accentColor: '#3b82f6' }} />
          <input type="range" min={0} max={5000} step={50} value={filters.temperatureRange[1]}
            onChange={(e) => updateFilter('temperatureRange', [filters.temperatureRange[0], +e.target.value])}
            style={{ width: '100%', accentColor: '#3b82f6' }} />
        </div>
      </div>

      {/* Radius */}
      <div>
        <label style={{ display: 'block', fontSize: 11, color: '#64748b', marginBottom: 6 }}>
          Radius: {filters.radiusRange[0]} – {filters.radiusRange[1]} R⊕
        </label>
        <div style={{ display: 'flex', gap: 8 }}>
          <input type="range" min={0} max={30} step={0.5} value={filters.radiusRange[0]}
            onChange={(e) => updateFilter('radiusRange', [+e.target.value, filters.radiusRange[1]])}
            style={{ width: '100%', accentColor: '#06b6d4' }} />
          <input type="range" min={0} max={30} step={0.5} value={filters.radiusRange[1]}
            onChange={(e) => updateFilter('radiusRange', [filters.radiusRange[0], +e.target.value])}
            style={{ width: '100%', accentColor: '#06b6d4' }} />
        </div>
      </div>

      {/* Min Habitability */}
      <div>
        <label style={{ display: 'block', fontSize: 11, color: '#64748b', marginBottom: 6 }}>
          Min Habitability Score: {filters.minHabitabilityScore}
        </label>
        <input type="range" min={0} max={100} step={1} value={filters.minHabitabilityScore}
          onChange={(e) => updateFilter('minHabitabilityScore', +e.target.value)}
          style={{ width: '100%', accentColor: '#22c55e' }} />
      </div>

      {/* Habitable Zone */}
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
        <input type="checkbox" checked={filters.habitableZoneOnly}
          onChange={(e) => updateFilter('habitableZoneOnly', e.target.checked)}
          style={{ accentColor: '#22c55e' }} />
        <span style={{ color: '#cbd5e1' }}>Habitable zone only</span>
      </label>

      {/* Planet Types */}
      <div>
        <label style={{ display: 'block', fontSize: 11, color: '#64748b', marginBottom: 8 }}>Planet Type</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {PLANET_TYPES.map(({ value, label }) => {
            const active = filters.planetTypes.includes(value)
            return (
              <button key={value} onClick={() => toggleType(value)} style={{
                padding: '4px 10px', borderRadius: 999, fontSize: 11, fontWeight: 500,
                backgroundColor: active ? '#1e293b' : 'transparent',
                border: `1px solid ${active ? '#475569' : '#1e293b'}`,
                color: active ? '#e2e8f0' : '#475569',
              }}>
                {label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Sort */}
      <div>
        <label style={{ display: 'block', fontSize: 11, color: '#64748b', marginBottom: 6 }}>Sort by</label>
        <select value={filters.sortBy}
          onChange={(e) => updateFilter('sortBy', e.target.value as typeof filters.sortBy)}
          style={{
            width: '100%', padding: '8px 12px',
            backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 6,
            color: '#fff', fontSize: 13,
          }}>
          <option value="habitability_score">Habitability Score</option>
          <option value="pl_eqt">Temperature</option>
          <option value="pl_rade">Radius</option>
          <option value="pl_masse">Mass</option>
          <option value="disc_year">Discovery Year</option>
          <option value="pl_name">Name</option>
        </select>
      </div>
    </div>
  )
}
