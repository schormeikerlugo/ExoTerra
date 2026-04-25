import { Search } from 'lucide-react'
import { useStore } from '../../store/useStore'

const PLANET_TYPES = [
  { value: 'rocky', label: 'Rocky' },
  { value: 'super_earth', label: 'S.Earth' },
  { value: 'mini_neptune', label: 'Mini Nep' },
  { value: 'gas_giant', label: 'Gas Giant' },
  { value: 'hot_jupiter', label: 'Hot Jup' },
  { value: 'ice_giant', label: 'Ice Giant' },
  { value: 'lava_world', label: 'Lava' },
  { value: 'frozen_rocky', label: 'Frozen' },
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
    <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: 9,
          color: 'var(--text-dim)', letterSpacing: 2, textTransform: 'uppercase',
        }}>
          FILTERS · {filteredCount.toLocaleString()}/{totalCount.toLocaleString()}
        </span>
        <button
          onClick={resetFilters}
          className="filter-reset"
          style={{
            fontFamily: 'var(--font-mono)', fontSize: 9,
            color: 'var(--text-muted)', letterSpacing: 1.5, textTransform: 'uppercase',
            background: 'none', border: 'none',
            cursor: 'pointer',
          }}
        >
          Reset ⟲
        </button>
      </div>

      {/* Search */}
      <div style={{ position: 'relative' }}>
        <Search size={12} style={{
          position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
          color: 'var(--text-dim)', pointerEvents: 'none',
        }} />
        <input
          type="text"
          value={filters.searchQuery}
          onChange={(e) => updateFilter('searchQuery', e.target.value)}
          placeholder="Search planet / star..."
          className="hud-input"
          style={{
            width: '100%', boxSizing: 'border-box',
            padding: '7px 10px 7px 28px',
            background: 'rgba(255,255,255,0.025)',
            border: '1px solid var(--border-hud)',
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-mono)', fontSize: 11,
            letterSpacing: 0.5, outline: 'none',
            transition: 'border-color 180ms',
          }}
        />
      </div>

      <HudRange
        label="TEMP"
        unit="K"
        min={0} max={5000} step={50}
        value={filters.temperatureRange}
        onChange={(v) => updateFilter('temperatureRange', v)}
      />

      <HudRange
        label="RADIUS"
        unit="R⊕"
        min={0} max={30} step={0.5}
        value={filters.radiusRange}
        onChange={(v) => updateFilter('radiusRange', v)}
      />

      {/* Min habitability score */}
      <div>
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          fontFamily: 'var(--font-mono)', fontSize: 9,
          color: 'var(--text-dim)', letterSpacing: 1.5,
          marginBottom: 6, textTransform: 'uppercase',
        }}>
          <span>MIN SCORE</span>
          <span style={{ color: 'var(--text-primary)' }}>{filters.minHabitabilityScore}</span>
        </div>
        <input
          type="range" min={0} max={100} step={1}
          value={filters.minHabitabilityScore}
          onChange={(e) => updateFilter('minHabitabilityScore', +e.target.value)}
          style={{ width: '100%', accentColor: 'var(--hud-cyan)' }}
        />
      </div>

      {/* HZ toggle */}
      <button
        onClick={() => updateFilter('habitableZoneOnly', !filters.habitableZoneOnly)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 10px',
          background: filters.habitableZoneOnly ? 'var(--hud-cyan-glow)' : 'rgba(255,255,255,0.025)',
          border: `1px solid ${filters.habitableZoneOnly ? 'var(--hud-cyan)' : 'var(--border-hud)'}`,
          color: filters.habitableZoneOnly ? 'var(--hud-cyan)' : 'var(--text-muted)',
          fontFamily: 'var(--font-mono)', fontSize: 10,
          letterSpacing: 1.5, textTransform: 'uppercase',
          cursor: 'pointer',
          transition: 'all 180ms',
        }}
      >
        <span style={{
          width: 7, height: 7,
          background: filters.habitableZoneOnly ? 'var(--hud-cyan)' : 'var(--border-hud-strong)',
          boxShadow: filters.habitableZoneOnly ? '0 0 6px var(--hud-cyan)' : 'none',
        }} />
        Habitable zone only
      </button>

      {/* Planet type chips */}
      <div>
        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: 9,
          color: 'var(--text-dim)', letterSpacing: 2,
          marginBottom: 6, textTransform: 'uppercase',
        }}>
          TYPE ⟶
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
          {PLANET_TYPES.map(({ value, label }) => {
            const on = filters.planetTypes.includes(value)
            return (
              <button
                key={value}
                onClick={() => toggleType(value)}
                style={{
                  padding: '4px 8px',
                  background: on ? 'rgba(255,255,255,0.07)' : 'transparent',
                  border: `1px solid ${on ? 'var(--border-hud-strong)' : 'var(--border-hud)'}`,
                  color: on ? 'var(--text-primary)' : 'var(--text-muted)',
                  fontFamily: 'var(--font-mono)', fontSize: 9,
                  letterSpacing: 1.2, textTransform: 'uppercase',
                  cursor: 'pointer', transition: 'all 160ms',
                }}
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Sort */}
      <div>
        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: 9,
          color: 'var(--text-dim)', letterSpacing: 2,
          marginBottom: 6, textTransform: 'uppercase',
        }}>
          SORT ⟶
        </div>
        <select
          value={filters.sortBy}
          onChange={(e) => updateFilter('sortBy', e.target.value as typeof filters.sortBy)}
          style={{
            width: '100%', boxSizing: 'border-box',
            padding: '7px 10px',
            background: 'rgba(255,255,255,0.025)',
            border: '1px solid var(--border-hud)',
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-mono)', fontSize: 10,
            letterSpacing: 1.5, textTransform: 'uppercase',
            outline: 'none', appearance: 'none',
          }}
        >
          <option value="habitability_score" style={{ background: '#000' }}>Habitability Score</option>
          <option value="pl_eqt" style={{ background: '#000' }}>Temperature</option>
          <option value="pl_rade" style={{ background: '#000' }}>Radius</option>
          <option value="pl_masse" style={{ background: '#000' }}>Mass</option>
          <option value="disc_year" style={{ background: '#000' }}>Discovery Year</option>
          <option value="pl_name" style={{ background: '#000' }}>Name</option>
        </select>
      </div>

      <style>{`
        .hud-input:focus { border-color: var(--border-hud-strong); background: rgba(255,255,255,0.045); }
        .hud-input::placeholder { color: var(--text-dim); }
        .filter-reset:hover { color: var(--hud-cyan) !important; }
      `}</style>
    </div>
  )
}

function HudRange({
  label, unit, min, max, step, value, onChange,
}: {
  label: string; unit: string; min: number; max: number; step: number
  value: [number, number]; onChange: (v: [number, number]) => void
}) {
  return (
    <div>
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        fontFamily: 'var(--font-mono)', fontSize: 9,
        color: 'var(--text-dim)', letterSpacing: 1.5,
        marginBottom: 6, textTransform: 'uppercase',
      }}>
        <span>{label}</span>
        <span style={{ color: 'var(--text-primary)' }}>
          {value[0]} – {value[1]} <span style={{ color: 'var(--text-dim)' }}>{unit}</span>
        </span>
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <input type="range" min={min} max={max} step={step} value={value[0]}
          onChange={(e) => onChange([+e.target.value, value[1]])}
          style={{ width: '100%', accentColor: 'var(--hud-cyan)' }} />
        <input type="range" min={min} max={max} step={step} value={value[1]}
          onChange={(e) => onChange([value[0], +e.target.value])}
          style={{ width: '100%', accentColor: 'var(--hud-cyan)' }} />
      </div>
    </div>
  )
}
