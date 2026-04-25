import { Plus, Check } from 'lucide-react'
import { COMPARE_MAX, useStore } from '../../store/useStore'
import type { Exoplanet } from '../../data/types'

interface Props {
  planet: Exoplanet
  /** "icon" = compact 28×28 button with just the +/✓ glyph (use in cards).
   *  "label" = larger pill with "PIN TO COMPARE" / "IN COMPARE" text (use in heroes). */
  variant?: 'icon' | 'label'
}

export function ComparePin({ planet, variant = 'icon' }: Props) {
  const compareIds = useStore((s) => s.compareIds)
  const toggleCompare = useStore((s) => s.toggleCompare)
  const pinned = compareIds.includes(planet.id)
  const isFull = compareIds.length >= COMPARE_MAX
  const disabled = !pinned && isFull

  const onClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (disabled) return
    toggleCompare(planet.id)
  }

  if (variant === 'icon') {
    return (
      <button
        onClick={onClick}
        type="button"
        aria-label={pinned ? `Remove ${planet.pl_name} from compare` : `Pin ${planet.pl_name} to compare`}
        title={
          pinned
            ? 'In compare — click to remove'
            : isFull
              ? `Compare full (${COMPARE_MAX} max)`
              : 'Pin to compare'
        }
        disabled={disabled}
        style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 28, height: 28,
          background: pinned ? 'var(--hud-cyan-glow)' : 'rgba(255,255,255,0.025)',
          border: `1px solid ${pinned ? 'var(--hud-cyan)' : 'var(--border-hud)'}`,
          color: pinned ? 'var(--hud-cyan)' : 'var(--text-muted)',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.4 : 1,
          transition: 'all 180ms ease',
        }}
        onMouseEnter={(e) => {
          if (!disabled && !pinned) {
            e.currentTarget.style.borderColor = 'var(--hud-cyan)'
            e.currentTarget.style.color = 'var(--hud-cyan)'
          }
        }}
        onMouseLeave={(e) => {
          if (!disabled && !pinned) {
            e.currentTarget.style.borderColor = 'var(--border-hud)'
            e.currentTarget.style.color = 'var(--text-muted)'
          }
        }}
      >
        {pinned ? <Check size={13} strokeWidth={2.5} /> : <Plus size={13} strokeWidth={2.5} />}
      </button>
    )
  }

  // variant === 'label' — pill with text
  return (
    <button
      onClick={onClick}
      type="button"
      disabled={disabled}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        padding: '10px 16px',
        background: pinned ? 'var(--hud-cyan-glow)' : 'rgba(255,255,255,0.025)',
        border: `1px solid ${pinned ? 'var(--hud-cyan)' : 'var(--border-hud-strong)'}`,
        color: pinned ? 'var(--hud-cyan)' : 'var(--text-primary)',
        fontFamily: 'var(--font-mono)', fontSize: 11,
        fontWeight: 500, letterSpacing: 2,
        textTransform: 'uppercase',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        transition: 'all 180ms ease',
      }}
    >
      {pinned ? <Check size={13} strokeWidth={2.5} /> : <Plus size={13} strokeWidth={2.5} />}
      {pinned ? 'In Compare' : isFull ? 'Compare Full' : 'Compare'}
    </button>
  )
}
