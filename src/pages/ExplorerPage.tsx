import { useParams, Link } from 'react-router-dom'
import { useEffect, useMemo } from 'react'
import { useStore } from '../store/useStore'
import { PlanetScene } from '../components/Scene/PlanetScene'
import { FilterPanel } from '../components/Controls/FilterPanel'
import { PlanetList } from '../components/Controls/PlanetList'
import { PlanetHUD } from '../components/HUD/PlanetHUD'

export function ExplorerPage() {
  const { name } = useParams<{ name: string }>()
  const planets = useStore((s) => s.planets)
  const setSelectedPlanet = useStore((s) => s.setSelectedPlanet)
  const isLoading = useStore((s) => s.isLoading)

  const planet = useMemo(
    () => (name ? planets.find((p) => p.pl_name === decodeURIComponent(name)) : null),
    [planets, name],
  )

  useEffect(() => {
    if (planet) setSelectedPlanet(planet)
  }, [planet, setSelectedPlanet])

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#020617', color: '#e2e8f0', overflow: 'hidden' }}>
      {/* Left Sidebar */}
      <aside style={{
        width: 300, display: 'flex', flexDirection: 'column',
        borderRight: '1px solid #1e293b', flexShrink: 0,
      }}>
        <header style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: 16, borderBottom: '1px solid #1e293b',
        }}>
          <Link to="/" style={{ fontSize: 18, fontWeight: 700, textDecoration: 'none' }}>
            <span style={{ color: '#60a5fa' }}>Exo</span><span style={{ color: '#fff' }}>Terra</span>
          </Link>
          <Link to="/" style={{
            padding: '6px 12px', fontSize: 12, color: '#94a3b8', textDecoration: 'none',
            backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: 6,
          }}>
            ← Catalog
          </Link>
        </header>

        <div style={{ borderBottom: '1px solid #1e293b' }}>
          <FilterPanel />
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {isLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
              <div style={{
                width: 24, height: 24, border: '3px solid #1e293b', borderTop: '3px solid #3b82f6',
                borderRadius: '50%', animation: 'spin 0.8s linear infinite',
              }} />
            </div>
          ) : (
            <PlanetList />
          )}
        </div>
      </aside>

      {/* Center - 3D */}
      <main style={{ flex: 1 }}>
        <PlanetScene />
      </main>

      {/* Right Sidebar */}
      <aside style={{
        width: 280, overflowY: 'auto',
        borderLeft: '1px solid #1e293b', flexShrink: 0,
      }}>
        <PlanetHUD />
      </aside>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
