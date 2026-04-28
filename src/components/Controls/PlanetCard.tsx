import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import type { Exoplanet } from '../../data/types'
import { getExoplanetTexture } from '../../utils/textureMap'
import { planetNameToSeed } from '../../utils/planetSeed'
import { CornerBrackets } from '../HUD/CornerBrackets'
import { Barcode } from '../HUD/Barcode'
import { ComparePin } from '../HUD/ComparePin'

const TYPE_LABEL: Record<string, string> = {
  rocky: 'ROCKY',
  super_earth: 'SUPER EARTH',
  gas_giant: 'GAS GIANT',
  hot_jupiter: 'HOT JUPITER',
  ice_giant: 'ICE GIANT',
  mini_neptune: 'MINI NEPTUNE',
  lava_world: 'LAVA WORLD',
  frozen_rocky: 'FROZEN',
  water: 'WATER',
  unknown: 'UNKNOWN',
}

function orbStyle(planet: Exoplanet): CSSProperties {
  const texture = getExoplanetTexture(planet)
  const seed = planetNameToSeed(planet.pl_name)
  const bgX = Math.floor(seed) % 100
  return {
    borderRadius: '50%',
    backgroundImage: [
      'radial-gradient(circle at 30% 25%, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0) 32%)',
      'radial-gradient(circle at 50% 50%, transparent 52%, rgba(0,0,0,0.7) 100%)',
      `url(${texture})`,
    ].join(', '),
    backgroundSize: 'cover, cover, 220% 180%',
    backgroundPosition: `center, center, ${bgX}% 50%`,
    backgroundRepeat: 'no-repeat, no-repeat, no-repeat',
    boxShadow:
      'inset -8px -14px 30px rgba(0,0,0,0.72), 0 0 24px rgba(255,255,255,0.05)',
  }
}

export function PlanetCard({ planet }: { planet: Exoplanet }) {
  const score = planet.habitability_score
  const C = 2 * Math.PI * 30
  const dash = (score / 100) * C
  const typeLabel = TYPE_LABEL[planet.planet_type] ?? TYPE_LABEL.unknown

  return (
    <Link
      to={`/explore/${encodeURIComponent(planet.pl_name)}`}
      className="hud-card planet-card"
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        border: '1px solid var(--border-hud)',
        padding: '22px 26px 20px',
        textDecoration: 'none',
        color: 'inherit',
        minWidth: 0,
        overflow: 'hidden',
      }}
    >
      <span className="hud-card__march" />
      <CornerBrackets size={9} inset={-1} color="var(--hud-line)" thickness={1} />

      {/* Header: type + HZ badge + compare pin */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 8, marginBottom: 20,
      }}>
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: 10,
          color: 'var(--text-dim)', letterSpacing: 2,
        }}>
          {typeLabel}
        </span>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          {planet.in_habitable_zone && (
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 600,
              padding: '3px 8px',
              border: '1px solid var(--border-hud-strong)',
              color: 'var(--text-primary)',
              letterSpacing: 1.5,
            }}>
              HZ · CONFIRMED
            </span>
          )}
          <ComparePin planet={planet} variant="icon" />
        </div>
      </div>

      {/* Body: big orb + name */}
      <div className="planet-card-body" style={{ display: 'flex', gap: 20, alignItems: 'center', marginBottom: 20, minWidth: 0 }}>
        <div style={{ position: 'relative', width: 120, height: 120, flexShrink: 0 }}>
          <div style={{ position: 'absolute', inset: 8, ...orbStyle(planet) }} />
          <svg
            viewBox="-64 -64 128 128"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
            aria-hidden
          >
            <circle cx="0" cy="0" r="58" fill="none"
              stroke="var(--border-hud)" strokeWidth="0.5"
              strokeDasharray="2 3" />
            {[0, 90, 180, 270].map((a) => (
              <line key={a}
                x1="52" y1="0" x2="60" y2="0"
                stroke="var(--hud-line)" strokeWidth="0.8"
                transform={`rotate(${a})`}
              />
            ))}
            <circle cx="40" cy="-40" r="1.4" fill="var(--hud-line)" />
          </svg>
        </div>

        <div style={{ minWidth: 0, flex: 1 }}>
          <h3 style={{
            fontFamily: 'var(--font-hero)', fontSize: 20, fontWeight: 500,
            letterSpacing: '0.04em', textTransform: 'uppercase',
            color: 'var(--text-primary)',
            margin: 0,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            lineHeight: 1.1,
          }}>
            {planet.pl_name}
          </h3>
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: 11,
            color: 'var(--text-muted)', letterSpacing: 1,
            marginTop: 6, textTransform: 'uppercase',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            HOST · {planet.hostname}
          </div>
          {planet.disc_year !== null && (
            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: 10,
              color: 'var(--text-dim)', letterSpacing: 1,
              marginTop: 3,
            }}>
              DISC · {planet.disc_year}
            </div>
          )}
        </div>
      </div>

      {/* Telemetry row — wider layout */}
      <div className="planet-card-tele" style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
        gap: 12,
        paddingTop: 14,
        borderTop: '1px dashed var(--border-hud)',
        minWidth: 0,
      }}>
        {[
          { label: 'RADIUS', value: planet.pl_rade !== null ? planet.pl_rade.toFixed(2) : '—', unit: 'R⊕' },
          { label: 'MASS',   value: planet.pl_masse !== null ? planet.pl_masse.toFixed(1) : '—', unit: 'M⊕' },
          { label: 'TEMP',   value: planet.pl_eqt !== null ? planet.pl_eqt.toFixed(0) : '—', unit: 'K' },
          { label: 'DIST',   value: planet.sy_dist !== null ? planet.sy_dist.toFixed(1) : '—', unit: 'PC' },
        ].map((t) => (
          <div key={t.label} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <span className="hud-label" style={{ fontSize: 9 }}>{t.label}</span>
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: 14,
              color: 'var(--text-primary)',
            }}>
              {t.value}
              <span style={{ marginLeft: 3, fontSize: 10, color: 'var(--text-dim)' }}>{t.unit}</span>
            </span>
          </div>
        ))}
      </div>

      {/* Footer: score gauge + label + open badge */}
      <div className="planet-card-footer" style={{
        display: 'flex', alignItems: 'center', gap: 16,
        marginTop: 18, paddingTop: 16,
        borderTop: '1px dashed var(--border-hud)',
        minWidth: 0,
      }}>
        <svg width={70} height={70} viewBox="-36 -36 72 72" aria-hidden>
          {Array.from({ length: 24 }).map((_, k) => (
            <line key={k}
              x1="34" y1="0" x2={k % 6 === 0 ? '30' : '32'} y2="0"
              stroke="var(--border-hud)" strokeWidth="0.6"
              transform={`rotate(${k * 15})`}
            />
          ))}
          <circle cx="0" cy="0" r="30" fill="none"
            stroke="var(--border-hud)" strokeWidth="1.4" />
          <circle cx="0" cy="0" r="30" fill="none"
            stroke="var(--text-primary)" strokeWidth="1.4"
            strokeDasharray={`${dash.toFixed(2)} ${C.toFixed(2)}`}
            strokeLinecap="round"
            transform="rotate(-90)"
          />
          <text
            x="0" y="1"
            textAnchor="middle" dominantBaseline="middle"
            fill="var(--text-primary)"
            style={{ fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 600 }}
          >
            {score.toFixed(0)}
          </text>
          <text
            x="0" y="14"
            textAnchor="middle"
            fill="var(--text-dim)"
            style={{ fontFamily: 'var(--font-mono)', fontSize: 6, letterSpacing: 1 }}
          >
            / 100
          </text>
        </svg>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: 10,
            color: 'var(--text-dim)', letterSpacing: 1.5, textTransform: 'uppercase',
          }}>
            Habitability Score
          </div>
          <div style={{
            fontFamily: 'var(--font-hero)', fontSize: 14, fontWeight: 500,
            color: 'var(--text-primary)', letterSpacing: '0.06em',
            textTransform: 'uppercase', marginTop: 3,
          }}>
            {score >= 60 ? 'Earth-like' : score >= 30 ? 'Partial Match' : 'Unlikely'}
          </div>
        </div>
        <div className="planet-card-open" style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <span data-card-barcode>
            <Barcode seed={`cat-${planet.pl_name}`} bars={20} height={10} />
          </span>
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 10,
            color: 'var(--text-primary)', letterSpacing: 2,
            padding: '5px 9px',
            border: '1px solid var(--border-hud-strong)',
            whiteSpace: 'nowrap',
          }}>
            OPEN →
          </span>
        </div>
      </div>

      <style>{`
        @media (max-width: 600px) {
          .planet-card { padding: 18px 18px 16px !important; }
          .planet-card-body { gap: 14px !important; }
          .planet-card-body > div:first-child {
            width: 96px !important; height: 96px !important;
          }
          .planet-card-tele { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; gap: 10px !important; }
          .planet-card-footer { gap: 12px !important; flex-wrap: wrap; }
          .planet-card-footer > svg { width: 60px !important; height: 60px !important; }
          .planet-card-open [data-card-barcode] { display: none; }
        }
        @media (max-width: 380px) {
          .planet-card { padding: 16px 14px 14px !important; }
        }
      `}</style>
    </Link>
  )
}
