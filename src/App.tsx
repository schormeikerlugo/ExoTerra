import './space-bg.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useExoplanets } from './hooks/useExoplanets'
import { useStore } from './store/useStore'
import { Navbar } from './components/Layout/Navbar'
import { LandingPage } from './pages/LandingPage'
import { CatalogPage } from './pages/CatalogPage'
import { PlanetDetailPage } from './pages/PlanetDetailPage'
import { ExplorerPage } from './pages/ExplorerPage'
import { StatsPage } from './pages/StatsPage'
import { TimelinePage } from './pages/TimelinePage'
import { SystemPage } from './pages/SystemPage'
import { ComparePage } from './pages/ComparePage'

export default function App() {
  useExoplanets()
  const error = useStore((s) => s.error)

  if (error) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: '#000', color: '#f87171' }}>
        <p>Error: {error}</p>
      </div>
    )
  }

  return (
    <BrowserRouter>
      {/* Animated space background */}
      <div className="space-bg">
        <div className="stars" />
        <div className="stars2" />
        <div className="stars3" />
        <div className="shooting-star" />
        <div className="shooting-star" />
        <div className="shooting-star" />
        <div className="shooting-star" />
        <div className="shooting-star" />
      </div>

      {/* All content sits above the background */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <Navbar />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/catalog" element={<CatalogPage />} />
          <Route path="/planet/:name" element={<PlanetDetailPage />} />
          <Route path="/explorer" element={<ExplorerPage />} />
          <Route path="/explorer/:name" element={<ExplorerPage />} />
          <Route path="/stats" element={<StatsPage />} />
          <Route path="/timeline" element={<TimelinePage />} />
          <Route path="/system/:hostname" element={<SystemPage />} />
          <Route path="/compare" element={<ComparePage />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}
