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
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#000', color: 'rgba(255,255,255,0.6)', overflow: 'hidden' }}>
      {/* Left Sidebar */}
      <aside style={{
        width: 300, display: 'flex', flexDirection: 'column',
        backgroundColor: '#0f0f0f',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        flexShrink: 0,
      }}>
        <header style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: 16,
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          backgroundColor: '#0f0f0f',
        }}>
          <Link to="/" style={{ fontSize: 18, fontWeight: 700, textDecoration: 'none' }}>
            <span style={{ color: '#fff' }}>Exo</span><span style={{ color: '#fff' }}>Terra</span>
          </Link>
          <Link to="/" style={{
            padding: '6px 12px', fontSize: 12, color: 'rgba(255,255,255,0.4)', textDecoration: 'none',
            backgroundColor: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8,
            transition: 'background-color 0.15s',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.04)' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent' }}
          >
            Catalog
          </Link>
        </header>

        <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <FilterPanel />
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {isLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
              <div style={{
                width: 24, height: 24, border: '3px solid rgba(255,255,255,0.1)', borderTop: '3px solid #fff',
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
        backgroundColor: '#0f0f0f',
        borderLeft: '1px solid rgba(255,255,255,0.06)',
        flexShrink: 0,
      }}>
        <PlanetHUD />
      </aside>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
