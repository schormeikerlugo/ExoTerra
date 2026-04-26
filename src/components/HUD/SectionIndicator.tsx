import { useEffect, useState } from 'react'

interface Props {
  /** Total section count (the denominator, e.g. 8). */
  total: number
  /** CSS selector for observable sections. Each matching element must have data-section="NN". */
  selector?: string
}

/**
 * Fixed right-rail indicator "0N / NN" that follows scroll via IntersectionObserver.
 * Each section under watch must carry `data-section="01".."NN"`.
 */
export function SectionIndicator({ total, selector = '[data-section]' }: Props) {
  const [active, setActive] = useState(1)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>(selector))
    if (els.length === 0) return

    const obs = new IntersectionObserver(
      (entries) => {
        // Pick the top-most section whose center is in the top half of the viewport
        let best: { n: number; ratio: number } | null = null
        for (const e of entries) {
          if (!e.isIntersecting) continue
          const n = parseInt((e.target as HTMLElement).dataset.section ?? '0', 10)
          if (!n) continue
          if (!best || e.intersectionRatio > best.ratio) {
            best = { n, ratio: e.intersectionRatio }
          }
        }
        if (best) setActive(best.n)
      },
      { rootMargin: '-30% 0px -55% 0px', threshold: [0, 0.2, 0.4, 0.6, 0.8, 1] },
    )
    els.forEach((el) => obs.observe(el))

    const onScroll = () => {
      const h = document.documentElement.scrollHeight - window.innerHeight
      setProgress(h > 0 ? Math.min(1, Math.max(0, window.scrollY / h)) : 0)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      obs.disconnect()
      window.removeEventListener('scroll', onScroll)
    }
  }, [selector])

  return (
    <div
      aria-hidden
      className="section-indicator"
      style={{
        position: 'fixed',
        right: 18,
        top: '50%',
        transform: 'translateY(-50%)',
        zIndex: 40,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 10,
        fontFamily: 'var(--font-mono)',
        pointerEvents: 'none',
      }}
    >
      <style>{`
        @media (max-width: 768px) {
          .section-indicator { display: none !important; }
        }
      `}</style>
      <span style={{ fontSize: 11, color: 'var(--text-primary)', letterSpacing: 2 }}>
        {active.toString().padStart(2, '0')}
      </span>

      {/* Vertical progress track */}
      <div
        style={{
          position: 'relative',
          width: 1,
          height: 140,
          background: 'var(--border-hud)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: -1,
            top: 0,
            width: 3,
            height: 10,
            background: 'var(--hud-line)',
            transform: `translateY(${progress * 130}px)`,
            transition: 'transform 200ms ease-out',
          }}
        />
      </div>

      <span style={{ fontSize: 10, color: 'var(--text-dim)', letterSpacing: 2 }}>
        {total.toString().padStart(2, '0')}
      </span>
    </div>
  )
}
