import { useEffect } from 'react'

/**
 * Single IntersectionObserver that flips `data-visible="true"` on any descendant
 * with `data-reveal`. A MutationObserver also watches the DOM so new elements
 * added after mount (e.g. cards that render once async data lands) get picked up.
 *
 * Cost: one intersection observer + one mutation observer for the whole page.
 * Each element is unobserved after its first reveal — no wasted callbacks.
 * CSS handles the visual transition via transform/opacity only — no per-frame JS.
 */
export function useReveal(rootSelector = '[data-reveal]') {
  useEffect(() => {
    // Reduced motion: reveal instantly and skip observers entirely.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const apply = () => {
        document
          .querySelectorAll<HTMLElement>(rootSelector)
          .forEach((el) => el.setAttribute('data-visible', 'true'))
      }
      apply()
      const mo = new MutationObserver(apply)
      mo.observe(document.body, { childList: true, subtree: true })
      return () => mo.disconnect()
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            ;(e.target as HTMLElement).setAttribute('data-visible', 'true')
            io.unobserve(e.target)
          }
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
    )

    const observed = new WeakSet<Element>()
    const observeAll = () => {
      document.querySelectorAll<HTMLElement>(rootSelector).forEach((el) => {
        if (observed.has(el)) return
        if (el.getAttribute('data-visible') === 'true') return
        io.observe(el)
        observed.add(el)
      })
    }

    observeAll()

    // Watch for dynamically-added [data-reveal] elements (async data loads, etc).
    const mo = new MutationObserver(observeAll)
    mo.observe(document.body, { childList: true, subtree: true })

    return () => {
      io.disconnect()
      mo.disconnect()
    }
  }, [rootSelector])
}
