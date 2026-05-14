import { useId, useMemo } from 'react'
import { cn } from '../../../lib/utils'

interface Props {
  data:         number[]
  color?:       string
  fill?:        boolean
  height?:      number
  width?:       number
  strokeWidth?: number
  className?:   string
}

export default function Sparkline({
  data,
  color = '#F5C842',
  fill = true,
  height = 28,
  width = 80,
  strokeWidth = 1.5,
  className,
}: Props) {
  const rawId = useId()
  const gradId = `spark-${rawId.replace(/:/g, '')}`

  const chart = useMemo(() => {
    const safeData = data.filter(Number.isFinite)
    if (safeData.length < 2) return null

    const min = Math.min(...safeData)
    const max = Math.max(...safeData)
    const range = max - min || 1
    const step = safeData.length > 1 ? width / (safeData.length - 1) : width

    const pts = safeData.map((v, i) => {
      const x = i * step
      const y = height - ((v - min) / range) * (height - 4) - 2
      return [x, y] as const
    })

    const path = 'M ' + pts.map(([x, y]) => `${x} ${y}`).join(' L ')
    return {
      path,
      area: path + ` L ${width} ${height} L 0 ${height} Z`,
      last: pts[pts.length - 1],
    }
  }, [data, width, height])

  if (!chart) return null

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={cn('block overflow-visible', className)}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.34} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      {fill && <path d={chart.area} fill={`url(#${gradId})`} />}
      <path
        d={chart.path}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle cx={chart.last[0]} cy={chart.last[1]} r="2.4" fill={color} />
      <circle cx={chart.last[0]} cy={chart.last[1]} r="4.5" fill={color} opacity={0.18} />
    </svg>
  )
}
