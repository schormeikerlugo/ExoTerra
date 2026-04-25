interface Props {
  size?: number
  color?: string
  thickness?: number
  inset?: number
  length?: number
}

export function CornerBrackets({
  size = 18,
  color = 'var(--border-hud-strong)',
  thickness = 1,
  inset = 0,
  length,
}: Props) {
  const len = length ?? size
  const style: React.CSSProperties = {
    position: 'absolute',
    width: len,
    height: len,
    pointerEvents: 'none',
    borderColor: color,
    borderStyle: 'solid',
    borderWidth: 0,
  }
  return (
    <>
      <span style={{ ...style, top: inset, left: inset, borderTopWidth: thickness, borderLeftWidth: thickness }} />
      <span style={{ ...style, top: inset, right: inset, borderTopWidth: thickness, borderRightWidth: thickness }} />
      <span style={{ ...style, bottom: inset, left: inset, borderBottomWidth: thickness, borderLeftWidth: thickness }} />
      <span style={{ ...style, bottom: inset, right: inset, borderBottomWidth: thickness, borderRightWidth: thickness }} />
    </>
  )
}
