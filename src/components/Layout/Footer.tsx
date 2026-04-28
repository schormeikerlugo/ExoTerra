import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useStore } from '../../store/useStore'
import { Barcode } from '../HUD/Barcode'

const NAV_GROUPS: { label: string; code: string; links: { to: string; label: string }[] }[] = [
  {
    label: 'Mission',
    code: 'NAV_01',
    links: [
      { to: '/',         label: 'Home' },
      { to: '/explore',  label: 'Explore' },
      { to: '/explorer', label: 'Cockpit' },
    ],
  },
  {
    label: 'Archive',
    code: 'NAV_02',
    links: [
      { to: '/catalog',  label: 'Catalog' },
      { to: '/compare',  label: 'Compare' },
      { to: '/timeline', label: 'Timeline' },
      { to: '/stats',    label: 'Stats' },
    ],
  },
  {
    label: 'Sources',
    code: 'NAV_03',
    links: [
      { to: 'https://exoplanetarchive.ipac.caltech.edu/', label: 'NASA Exoplanet Archive' },
      { to: 'https://supabase.com/',                       label: 'Supabase Mirror' },
    ],
  },
]

function useUtcClock(): string {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(id)
  }, [])
  const iso = now.toISOString()
  return `${iso.slice(0, 10).replace(/-/g, '.')} · ${iso.slice(11, 19)}`
}

export function Footer() {
  const location = useLocation()
  const planetCount = useStore((s) => s.planets.length)
  const utc = useUtcClock()

  // Don't render on the cockpit (full-screen 3D mode)
  if (location.pathname.startsWith('/explorer')) return null

  return (
    <footer style={{
      position: 'relative',
      padding: '64px var(--gutter) 40px',
      backgroundColor: 'transparent',
      borderTop: '1px solid var(--border-hud)',
      marginTop: 24,
    }}>
      <div style={{ maxWidth: 'var(--max-w)', margin: '0 auto' }}>
        {/* ─── Top strip: brand + live + barcode ─── */}
        <div className="footer-head" style={{
          display: 'flex', alignItems: 'center', gap: 16,
          flexWrap: 'wrap', justifyContent: 'space-between',
          paddingBottom: 28,
          borderBottom: '1px solid var(--border-hud)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <span style={{
              fontFamily: 'var(--font-astra)', fontSize: 22, fontWeight: 600,
              letterSpacing: '0.04em', color: 'var(--text-primary)',
            }}>
              EXOTERRA
            </span>
            <span style={{ width: 32, height: 1, background: 'var(--hud-line)' }} />
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: 10,
              color: 'var(--text-muted)', letterSpacing: 2, textTransform: 'uppercase',
            }}>
              Exoplanet Mission Control
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginLeft: 4 }}>
              <span style={{
                width: 6, height: 6, borderRadius: '50%',
                background: 'var(--hud-green)',
                boxShadow: '0 0 6px var(--hud-green)',
                animation: 'hud-pulse 1.8s ease-in-out infinite',
              }} />
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: 9,
                color: 'var(--hud-green)', letterSpacing: 2,
              }}>
                LIVE
              </span>
            </span>
          </div>
          <Barcode seed={`footer-${planetCount}`} bars={56} height={20} />
        </div>

        {/* ─── Sitemap columns ─── */}
        <div className="footer-grid" style={{
          display: 'grid',
          gridTemplateColumns: '1.2fr repeat(3, 1fr)',
          gap: 36,
          paddingBlock: 36,
          borderBottom: '1px solid var(--border-hud)',
        }}>
          <div>
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: 9,
              color: 'var(--text-dim)', letterSpacing: 2, textTransform: 'uppercase',
            }}>
              // BRIEFING
            </span>
            <p style={{
              fontFamily: 'var(--font-body)', fontSize: 13, lineHeight: 1.7,
              color: 'var(--text-muted)',
              margin: '12px 0 0', maxWidth: '34ch',
            }}>
              An open archive of confirmed exoplanets — render them in 3D, filter by class
              and detection method, and stack candidates side-by-side. Live mirror of the
              NASA Exoplanet Archive.
            </p>
            <div style={{
              marginTop: 14,
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '6px 10px',
              border: '1px solid var(--border-hud)',
              background: 'rgba(255,255,255,0.02)',
              fontFamily: 'var(--font-mono)', fontSize: 9,
              color: 'var(--text-primary)', letterSpacing: 1.5, textTransform: 'uppercase',
            }}>
              <span style={{ color: 'var(--hud-cyan)' }}>{planetCount.toLocaleString()}</span>
              <span style={{ color: 'var(--text-dim)' }}>worlds indexed</span>
            </div>
          </div>

          {NAV_GROUPS.map((group) => (
            <div key={group.code}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                marginBottom: 14,
              }}>
                <span style={{
                  fontFamily: 'var(--font-mono)', fontSize: 9,
                  color: 'var(--text-dim)', letterSpacing: 2,
                }}>
                  {group.code}
                </span>
                <span style={{ flex: 1, height: 1, background: 'var(--border-hud)' }} />
                <span style={{
                  fontFamily: 'var(--font-mono)', fontSize: 10,
                  color: 'var(--text-primary)', letterSpacing: 2, textTransform: 'uppercase',
                }}>
                  {group.label}
                </span>
              </div>
              <ul style={{
                listStyle: 'none', margin: 0, padding: 0,
                display: 'flex', flexDirection: 'column', gap: 8,
              }}>
                {group.links.map((link) => {
                  const external = link.to.startsWith('http')
                  return (
                    <li key={link.to}>
                      {external ? (
                        <a
                          href={link.to}
                          target="_blank" rel="noopener noreferrer"
                          className="footer-link"
                        >
                          {link.label}
                          <span aria-hidden style={{ marginLeft: 6, color: 'var(--text-dim)' }}>↗</span>
                        </a>
                      ) : (
                        <Link to={link.to} className="footer-link">
                          {link.label}
                        </Link>
                      )}
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </div>

        {/* ─── Telemetry strip ─── */}
        <div className="footer-tele" style={{
          display: 'flex', flexWrap: 'wrap', gap: 18,
          paddingBlock: 18,
          borderBottom: '1px solid var(--border-hud)',
          fontFamily: 'var(--font-mono)', fontSize: 9,
          letterSpacing: 1.8, textTransform: 'uppercase',
          color: 'var(--text-dim)',
        }}>
          <span><span style={{ color: 'var(--text-dim)' }}>BUILD · </span><span style={{ color: 'var(--text-primary)' }}>4A1C2F3</span></span>
          <span style={{ color: 'var(--border-hud-strong)' }}>//</span>
          <span><span style={{ color: 'var(--text-dim)' }}>UTC · </span><span style={{ color: 'var(--text-primary)' }}>{utc}</span></span>
          <span style={{ color: 'var(--border-hud-strong)' }}>//</span>
          <span><span style={{ color: 'var(--text-dim)' }}>NODE · </span><span style={{ color: 'var(--text-primary)' }}>EXOTERRA-01</span></span>
          <span style={{ color: 'var(--border-hud-strong)' }}>//</span>
          <span><span style={{ color: 'var(--text-dim)' }}>COORD · </span><span style={{ color: 'var(--text-primary)' }}>42.36°N · 71.06°W</span></span>
        </div>

        {/* ─── Bottom rail ─── */}
        <div className="footer-bot" style={{
          display: 'flex', flexWrap: 'wrap', gap: 12,
          justifyContent: 'space-between', alignItems: 'center',
          paddingTop: 22,
          fontFamily: 'var(--font-mono)', fontSize: 10,
          color: 'var(--text-dim)', letterSpacing: 1.5, textTransform: 'uppercase',
        }}>
          <span>© ExoTerra · Open archive · Educational use</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              width: 6, height: 6,
              background: 'var(--hud-cyan)',
              transform: 'rotate(45deg)',
              boxShadow: '0 0 5px var(--hud-cyan-glow)',
            }} />
            EOF · END OF TRANSMISSION
          </span>
        </div>
      </div>

      <style>{`
        .footer-link {
          font-family: var(--font-body);
          font-size: 13px;
          color: var(--text-muted);
          text-decoration: none;
          letter-spacing: 0.02em;
          transition: color 180ms;
          display: inline-flex; align-items: center;
        }
        .footer-link:hover { color: var(--hud-cyan); }

        @media (max-width: 1024px) {
          .footer-grid {
            grid-template-columns: 1fr 1fr !important;
            gap: 28px !important;
          }
          .footer-grid > div:first-child {
            grid-column: 1 / -1;
          }
        }
        @media (max-width: 600px) {
          .footer-head { gap: 12px !important; }
          .footer-grid { grid-template-columns: 1fr !important; }
          .footer-tele { gap: 12px !important; font-size: 8px !important; }
          .footer-bot { font-size: 9px !important; }
        }
      `}</style>
    </footer>
  )
}
