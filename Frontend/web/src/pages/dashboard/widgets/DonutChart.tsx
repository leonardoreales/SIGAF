import { useId } from 'react'
import { cn } from '../../../lib/utils'

export interface DonutSlice {
  label:  string
  value:  number
  color:  string
  detail?: string
}

interface Props {
  data:         DonutSlice[]
  size?:        number
  thickness?:   number
  centerLabel?: string
  centerValue?: string
  loading?:     boolean
}

export default function DonutChart({
  data,
  size = 176,
  thickness = 22,
  centerLabel = 'Total',
  centerValue,
  loading,
}: Props) {
  const rawId = useId()
  const titleId = `donut-${rawId.replace(/:/g, '')}`
  const safeData = data.filter(slice => slice.value > 0)
  const total = safeData.reduce((sum, slice) => sum + slice.value, 0)
  const cx = size / 2
  const cy = size / 2
  const radius = size / 2 - thickness / 2 - 2
  const circumference = 2 * Math.PI * radius

  let acc = 0
  const segments = safeData.map((slice) => {
    const fraction = total > 0 ? slice.value / total : 0
    const segment = {
      ...slice,
      fraction,
      dasharray: `${fraction * circumference} ${circumference}`,
      dashoffset: -acc * circumference,
    }
    acc += fraction
    return segment
  })

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-4">
        <div className="skeleton h-[176px] w-[176px] rounded-full" />
        <div className="w-full space-y-2">
          <div className="skeleton h-3 w-full" />
          <div className="skeleton h-3 w-4/5" />
          <div className="skeleton h-3 w-3/5" />
        </div>
      </div>
    )
  }

  if (total === 0) {
    return (
      <div className="flex min-h-[260px] items-center justify-center text-xs text-gray-400 dark:text-mi-500">
        Sin datos de estado
      </div>
    )
  }

  return (
    <div className="relative flex flex-col items-center gap-4">
      <svg width={size} height={size} role="img" aria-labelledby={titleId}>
        <title id={titleId}>Distribución por estado de activos</title>
        <g transform={`rotate(-90 ${cx} ${cy})`}>
          <circle
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={thickness}
            className="text-gray-100 dark:text-white/[0.05]"
          />
          {segments.map(segment => (
            <circle
              key={segment.label}
              cx={cx}
              cy={cy}
              r={radius}
              fill="none"
              stroke={segment.color}
              strokeWidth={thickness}
              strokeDasharray={segment.dasharray}
              strokeDashoffset={segment.dashoffset}
              strokeLinecap="butt"
              style={{ transition: 'stroke-dasharray 700ms ease' }}
            />
          ))}
        </g>
      </svg>

      <div
        className="pointer-events-none absolute left-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center"
        style={{ top: size / 2 }}
      >
        <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-gray-400 dark:text-mi-500">
          {centerLabel}
        </div>
        <div className="mt-0.5 font-syne text-[28px] font-bold leading-tight text-[#B8880A] dark:text-[#F5C842]">
          {centerValue ?? total.toLocaleString('es-CO')}
        </div>
      </div>

      <div className="w-full space-y-2">
        {segments.map(segment => (
          <div key={segment.label} className="grid grid-cols-[1fr_auto] items-center gap-3 text-[11px]">
            <div className="flex min-w-0 items-center gap-2">
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: segment.color }} />
              <span className="truncate text-gray-600 dark:text-mi-300">{segment.label}</span>
            </div>
            <div className="text-right font-mono tabular-nums">
              <span className="font-semibold text-gray-900 dark:text-mi-50">
                {segment.value.toLocaleString('es-CO')}
              </span>
              <span className={cn('ml-2 text-gray-400 dark:text-mi-500', !segment.detail && 'hidden')}>
                {segment.detail}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
