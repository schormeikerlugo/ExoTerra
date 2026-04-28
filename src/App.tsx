import './space-bg.css'
import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom'
import { useExoplanets } from './hooks/useExoplanets'
import { useStore } from './store/useStore'
import { Navbar } from './components/Layout/Navbar'
import { Footer } from './components/Layout/Footer'
import { ScrollToTop } from './components/Layout/ScrollToTop'
import { CompareTray } from './components/HUD/CompareTray'
import { StateScreen } from './components/HUD/StateScreen'
import { LandingPage } from './pages/LandingPage'

// Lazy routes — code-split per page so visitors who never open Explore/Compare
// don't download Three.js and the heavier sub-components on first paint.
const CatalogPage  = lazy(() => import('./pages/CatalogPage').then(m => ({ default: m.CatalogPage })))
const ExplorePage  = lazy(() => import('./pages/ExplorePage').then(m => ({ default: m.ExplorePage })))
const ExplorerPage = lazy(() => import('./pages/ExplorerPage').then(m => ({ default: m.ExplorerPage })))
const StatsPage    = lazy(() => import('./pages/StatsPage').then(m => ({ default: m.StatsPage })))
const TimelinePage = lazy(() => import('./pages/TimelinePage').then(m => ({ default: m.TimelinePage })))
const SystemPage   = lazy(() => import('./pages/SystemPage').then(m => ({ default: m.SystemPage })))
const ComparePage  = lazy(() => import('./pages/ComparePage').then(m => ({ default: m.ComparePage })))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage').then(m => ({ default: m.NotFoundPage })))

function RouteFallback() {
  return (
    <StateScreen
      variant="loading"
      code="LINK_INIT"
      title="Loading module."
      message="Streaming the route bundle. The page will populate as soon as the asset arrives."
    />
  )
}

// Forward old /planet/:name routes to the unified /explore/:name page.
function PlanetRedirect() {
  const { name } = useParams<{ name: string }>()
  return <Navigate to={`/explore/${encodeURIComponent(name ?? '')}`} replace />
}

export default function App() {
  useExoplanets()
  const error = useStore((s) => s.error)

  if (error) {
    return (
      <BrowserRouter>
        <div className="space-bg">
          <div className="stars" />
          <div className="stars2" />
          <div className="stars3" />
          <div className="nebula" />
          <div className="scanlines" />
        </div>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <Navbar />
          <StateScreen
            variant="error"
            code="ERR_500"
            title="Archive uplink failed."
            message="The catalog stream returned an error before any planets could be loaded. Try a reload — if the fault persists, the upstream service is the likely culprit."
            detail={error}
            primaryAction={{ label: 'Retry uplink', onClick: () => window.location.reload() }}
            secondaryAction={{ label: 'Return to base', to: '/' }}
          />
        </div>
      </BrowserRouter>
    )
  }

  return (
    <BrowserRouter>
      <ScrollToTop />
      {/* Animated space background */}
      <div className="space-bg">
        <div className="stars" />
        <div className="stars2" />
        <div className="stars3" />
        <div className="nebula" />
        <div className="shooting-star" />
        <div className="shooting-star" />
        <div className="shooting-star" />
        <div className="shooting-star" />
        <div className="shooting-star" />
        <div className="scanlines" />
      </div>

      {/* All content sits above the background */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <Navbar />
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/catalog" element={<CatalogPage />} />
            {/* Unified planet experience — replaces /planet/:name + ExplorerPage hero. */}
            <Route path="/explore" element={<ExplorePage />} />
            <Route path="/explore/:name" element={<ExplorePage />} />
            {/* Legacy /planet/:name → /explore/:name */}
            <Route path="/planet/:name" element={<PlanetRedirect />} />
            {/* Cockpit mode (full-screen 3D explorer, kept as launchable mode) */}
            <Route path="/explorer" element={<ExplorerPage />} />
            <Route path="/explorer/:name" element={<ExplorerPage />} />
            <Route path="/stats" element={<StatsPage />} />
            <Route path="/timeline" element={<TimelinePage />} />
            <Route path="/system/:hostname" element={<SystemPage />} />
            <Route path="/compare" element={<ComparePage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>

        <Footer />

        {/* Floating compare tray — persists across pages */}
        <CompareTray />
      </div>
    </BrowserRouter>
  )
}
