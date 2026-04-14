import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useExoplanets } from './hooks/useExoplanets'
import { useStore } from './store/useStore'
import { CatalogPage } from './pages/CatalogPage'
import { PlanetDetailPage } from './pages/PlanetDetailPage'
import { ExplorerPage } from './pages/ExplorerPage'

export default function App() {
  useExoplanets()
  const error = useStore((s) => s.error)

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950 text-red-400">
        <p>Error: {error}</p>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<CatalogPage />} />
        <Route path="/planet/:name" element={<PlanetDetailPage />} />
        <Route path="/explorer" element={<ExplorerPage />} />
        <Route path="/explorer/:name" element={<ExplorerPage />} />
      </Routes>
    </BrowserRouter>
  )
}
