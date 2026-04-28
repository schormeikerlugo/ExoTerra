import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Resets the document scroll to the top whenever the route's pathname
 * changes. React Router doesn't do this by default — without it, navigating
 * from the bottom of one page to another leaves you at the same scroll
 * offset on the new page, hiding the hero.
 *
 * Hash navigations (e.g. `#briefing` anchors inside Explore) are ignored so
 * in-page jumps still work normally.
 */
export function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    // `auto` instead of `smooth` — the page content is being swapped, a
    // smooth animation between two unrelated layouts feels janky.
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [pathname])

  return null
}
