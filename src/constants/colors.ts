export const ACCENT = '#4ECDC4'
export const ACCENT_15 = 'rgba(78, 205, 196, 0.15)'
export const ACCENT_30 = 'rgba(78, 205, 196, 0.3)'
export const WARM = '#FFE66D'
export const WARM_15 = 'rgba(255, 230, 109, 0.15)'

export function getScoreColor(score: number): string {
  if (score >= 60) return ACCENT
  if (score >= 30) return WARM
  return 'rgba(255, 255, 255, 0.4)'
}

export function getScoreBarColor(score: number): string {
  if (score >= 60) return 'rgba(78, 205, 196, 0.6)'
  if (score >= 30) return 'rgba(255, 230, 109, 0.5)'
  return 'rgba(255, 255, 255, 0.2)'
}
