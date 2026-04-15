import { Mountain, Globe, Wind, Flame, Snowflake, Droplets, HelpCircle } from 'lucide-react'
import { useStore } from '../../store/useStore'
import type { Exoplanet } from '../../data/types'
import { getScoreColor, getScoreBarColor } from '../../constants/colors'

const typeIcons: Record<string, React.ReactNode> = {
  rocky: <Mountain size={14} style={{ color: 'rgba(255,255,255,0.4)' }} />,
  super_earth: <Globe size={14} style={{ color: 'rgba(255,255,255,0.4)' }} />,
  gas_giant: <Wind size={14} style={{ color: 'rgba(255,255,255,0.4)' }} />,
  hot_jupiter: <Flame size={14} style={{ color: 'rgba(255,255,255,0.4)' }} />,
  ice_giant: <Snowflake size={14} style={{ color: 'rgba(255,255,255,0.4)' }} />,
  mini_neptune: <Droplets size={14} style={{ color: 'rgba(255,255,255,0.4)' }} />,
  lava_world: <Flame size={14} style={{ color: 'rgba(255,255,255,0.4)' }} />,
  frozen_rocky: <Snowflake size={14} style={{ color: 'rgba(255,255,255,0.4)' }} />,
  unknown: <HelpCircle size={14} style={{ color: 'rgba(255,255,255,0.4)' }} />,
}

function PlanetCard({ planet, isSelected, onClick }: {
  planet: Exoplanet; isSelected: boolean; onClick: () => void
}) {
  const score = planet.habitability_score

  return (
    <button
      onClick={onClick}
      style={{
        width: '100%', textAlign: 'left', padding: 12, borderRadius: 8,
        backgroundColor: isSelected ? 'rgba(255,255,255,0.06)' : 'transparent',
        border: isSelected ? '1px solid rgba(255,255,255,0.1)' : '1px solid transparent',
        cursor: 'pointer', transition: 'background-color 0.15s',
      }}
      onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)' }}
      onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {typeIcons[planet.planet_type] ?? typeIcons.unknown}
            <span style={{
              fontSize: 13, fontWeight: 500, color: '#fff',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {planet.pl_name}
            </span>
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
            {planet.hostname} · {planet.disc_year ?? '—'}
          </div>
        </div>

        {/* Score */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <div style={{ width: 48, height: 4, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.06)' }}>
            <div style={{
              height: '100%', borderRadius: 999, backgroundColor: getScoreBarColor(score),
              width: `${Math.min(score, 100)}%`,
            }} />
          </div>
          <span style={{ fontSize: 11, color: getScoreColor(score), width: 28, textAlign: 'right' }}>{score.toFixed(1)}</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginTop: 6, fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
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
        <div style={{ padding: 12, textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
          Showing 100 of {filteredPlanets.length.toLocaleString()} results
        </div>
      )}
      {filteredPlanets.length === 0 && (
        <div style={{ padding: 40, textAlign: 'center', fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>
          No planets match your filters
        </div>
      )}
    </div>
  )
}
