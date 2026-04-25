import { Link, useLocation } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'

const NAV_LINKS = [
  { to: '/',         label: 'Home',     code: '01' },
  { to: '/explore',  label: 'Explore',  code: '02' },
  { to: '/catalog',  label: 'Catalog',  code: '03' },
  { to: '/compare',  label: 'Compare',  code: '04' },
  { to: '/timeline', label: 'Timeline', code: '05' },
  { to: '/stats',    label: 'Stats',    code: '06' },
]

function useClock() {
  const [now, setNow] = useState<Date>(() => new Date())
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(id)
  }, [])
  return now
}

export function Navbar() {
  const location = useLocation()
  const now = useClock()
  const time = now.toISOString().slice(11, 19)

  const [scrolled, setScrolled] = useState(false)
  const [hidden, setHidden] = useState(false)
  const lastY = useRef(0)

  useEffect(() => {
    lastY.current = window.scrollY
    const onScroll = () => {
      const y = window.scrollY
      setScrolled(y > 40)
      // Hide on scroll down past threshold, reveal on scroll up
      const dy = y - lastY.current
      if (y > 160 && dy > 6) setHidden(true)
      else if (dy < -4) setHidden(false)
      lastY.current = y
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const isActiveLink = (to: string) => {
    if (to === '/') return location.pathname === '/'
    // Exact path match or descendant; avoids /explore lighting up on /explorer
    return location.pathname === to || location.pathname.startsWith(`${to}/`)
  }

  return (
    <nav
      data-scrolled={scrolled}
      data-hidden={hidden}
      className="exoterra-nav"
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0,
        zIndex: 50,
        height: 56,
        transform: hidden ? 'translate3d(0, -110%, 0)' : 'translate3d(0, 0, 0)',
        transition:
          'transform 420ms cubic-bezier(0.22,1,0.36,1),' +
          ' background 280ms ease, backdrop-filter 280ms ease,' +
          ' border-color 280ms ease, box-shadow 280ms ease',
        borderBottom: scrolled
          ? '1px solid var(--border-hud)'
          : '1px solid transparent',
        background: scrolled ? 'rgba(5, 7, 13, 0.62)' : 'transparent',
        backdropFilter: scrolled ? 'blur(18px) saturate(1.2)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(18px) saturate(1.2)' : 'none',
        boxShadow: scrolled
          ? '0 12px 32px -16px rgba(0,0,0,0.55), inset 0 -1px 0 rgba(255,255,255,0.04)'
          : 'none',
      }}
    >
      <div
        style={{
          maxWidth: 'var(--max-w)',
          margin: '0 auto',
          paddingInline: 'var(--gutter)',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 24,
          position: 'relative',
        }}
      >
        {/* Left bracket tick */}
        <span
          aria-hidden
          style={{
            position: 'absolute', left: 0, top: 0, bottom: 0,
            display: 'flex', alignItems: 'center',
            pointerEvents: 'none',
          }}
        >
          <span style={{ width: 8, height: 1, background: 'var(--hud-line)' }} />
        </span>

        {/* Logo block */}
        <Link
          to="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 12,
            textDecoration: 'none',
            flexShrink: 0,
            paddingLeft: 14,
          }}
        >
          <span
            aria-hidden
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 16,
              color: 'var(--hud-cyan)',
              lineHeight: 1,
            }}
          >
            ⊛
          </span>
          <span
            style={{
              fontFamily: 'var(--font-hero)',
              fontWeight: 500,
              fontSize: 14,
              letterSpacing: '0.18em',
              color: 'var(--text-primary)',
              lineHeight: 1,
            }}
          >
            EXOTERRA
          </span>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 9,
              color: 'var(--text-primary)',
              letterSpacing: 1.5,
              padding: '3px 7px',
              border: '1px solid var(--border-hud-strong)',
              lineHeight: 1,
            }}
          >
            v2.1.0
          </span>
        </Link>

        {/* Nav links (mono uppercase) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            overflowX: 'auto',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          {NAV_LINKS.map(({ to, label, code }) => {
            const active = isActiveLink(to)
            return (
              <Link
                key={to}
                to={to}
                style={{
                  display: 'inline-flex',
                  alignItems: 'baseline',
                  gap: 6,
                  padding: '8px 14px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  fontWeight: active ? 600 : 500,
                  color: active ? 'var(--text-primary)' : 'var(--text-muted)',
                  letterSpacing: 2,
                  textTransform: 'uppercase',
                  textDecoration: 'none',
                  whiteSpace: 'nowrap',
                  position: 'relative',
                  transition: 'color 180ms ease',
                }}
                onMouseEnter={(e) => {
                  if (!active) e.currentTarget.style.color = 'var(--text-primary)'
                }}
                onMouseLeave={(e) => {
                  if (!active) e.currentTarget.style.color = 'var(--text-muted)'
                }}
              >
                <span
                  style={{
                    fontSize: 8,
                    color: active ? 'var(--hud-cyan)' : 'var(--text-dim)',
                  }}
                >
                  {code}
                </span>
                {label}
                {active && (
                  <>
                    {/* Active underline */}
                    <span
                      aria-hidden
                      style={{
                        position: 'absolute',
                        left: 14, right: 14, bottom: 2,
                        height: 1,
                        background: 'var(--hud-cyan)',
                      }}
                    />
                    {/* Active bracket ticks */}
                    <span
                      aria-hidden
                      style={{
                        position: 'absolute', left: 10, top: '50%',
                        width: 3, height: 3,
                        background: 'var(--hud-cyan)',
                        transform: 'translateY(-50%)',
                      }}
                    />
                    <span
                      aria-hidden
                      style={{
                        position: 'absolute', right: 10, top: '50%',
                        width: 3, height: 3,
                        background: 'var(--hud-cyan)',
                        transform: 'translateY(-50%)',
                      }}
                    />
                  </>
                )}
              </Link>
            )
          })}
        </div>

        {/* Right status cluster */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            flexShrink: 0,
            paddingRight: 14,
          }}
        >
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              letterSpacing: 1.5,
              color: 'var(--text-primary)',
              textTransform: 'uppercase',
            }}
          >
            <span
              aria-hidden
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: 'var(--hud-green)',
                boxShadow: '0 0 6px var(--hud-green)',
                animation: 'hud-pulse 1.8s ease-in-out infinite',
              }}
            />
            LIVE
          </span>

          <span style={{ width: 1, height: 14, background: 'var(--border-hud)' }} />

          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              color: 'var(--text-muted)',
              letterSpacing: 1.5,
            }}
          >
            {time}
          </span>
        </div>

        {/* Right bracket tick */}
        <span
          aria-hidden
          style={{
            position: 'absolute', right: 0, top: 0, bottom: 0,
            display: 'flex', alignItems: 'center',
            pointerEvents: 'none',
          }}
        >
          <span style={{ width: 8, height: 1, background: 'var(--hud-line)' }} />
        </span>
      </div>
    </nav>
  )
}
