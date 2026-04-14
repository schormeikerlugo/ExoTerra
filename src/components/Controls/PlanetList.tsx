import { useStore } from '../../store/useStore'
import type { Exoplanet } from '../../data/types'

const typeIcons: Record<string, string> = {
  rocky: '🪨', super_earth: '🌍', gas_giant: '🟠', hot_jupiter: '🔥',
  ice_giant: '🧊', mini_neptune: '💎', lava_world: '🌋', frozen_rocky: '❄️', unknown: '❓',
}

function PlanetCard({ planet, isSelected, onClick }: {
  planet: Exoplanet; isSelected: boolean; onClick: () => void
}) {
  const score = planet.habitability_score
  const scoreColor = score >= 70 ? '#4ade80' : score >= 40 ? '#facc15' : score >= 20 ? '#fb923c' : '#64748b'

  return (
    <button
      onClick={onClick}
      style={{
        width: '100%', textAlign: 'left', padding: 12, borderRadius: 8,
        backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.12)' : 'transparent',
        border: isSelected ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid transparent',
        cursor: 'pointer', transition: 'all 0.15s',
      }}
      onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = '#0f172a' }}
      onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 14 }}>{typeIcons[planet.planet_type] ?? '❓'}</span>
            <span style={{
              fontSize: 13, fontWeight: 500, color: '#f1f5f9',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {planet.pl_name}
            </span>
          </div>
          <div style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>
            {planet.hostname} · {planet.disc_year ?? '—'}
          </div>
        </div>

        {/* Score */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <div style={{ width: 48, height: 4, borderRadius: 999, backgroundColor: '#1e293b' }}>
            <div style={{
              height: '100%', borderRadius: 999, backgroundColor: scoreColor,
              width: `${Math.min(score, 100)}%`,
            }} />
          </div>
          <span style={{ fontSize: 11, color: '#64748b', width: 28, textAlign: 'right' }}>{score.toFixed(1)}</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginTop: 6, fontSize: 11, color: '#475569' }}>
        {planet.pl_eqt !== null && <span>{planet.pl_eqt.toFixed(0)} K</span>}
        {planet.pl_rade !== null && <span>{planet.pl_rade.toFixed(2)} R⊕</span>}
        {planet.pl_masse !== null && <span>{planet.pl_masse.toFixed(1)} M⊕</span>}
      </div>
    </button>
  )
}

export function PlanetList() {
  const filteredPlanets = useStore((s) => s.filteredPlanets)
  const selectedPlanet = useStore((s) => s.selectedPlanet)
  const setSelectedPlanet = useStore((s) => s.setSelectedPlanet)

  const visible = filteredPlanets.slice(0, 100)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: 8 }}>
      {visible.map((planet) => (
        <PlanetCard
          key={planet.id}
          planet={planet}
          isSelected={selectedPlanet?.id === planet.id}
          onClick={() => setSelectedPlanet(planet)}
        />
      ))}
      {filteredPlanets.length > 100 && (
        <div style={{ padding: 12, textAlign: 'center', fontSize: 12, color: '#475569' }}>
          Showing 100 of {filteredPlanets.length.toLocaleString()} results
        </div>
      )}
      {filteredPlanets.length === 0 && (
        <div style={{ padding: 40, textAlign: 'center', fontSize: 13, color: '#475569' }}>
          No planets match your filters
        </div>
      )}
    </div>
  )
}
