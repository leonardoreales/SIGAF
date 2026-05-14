import { useEffect, useId, useMemo, useRef, useState } from 'react'

export interface TrendPoint {
  label:      string
  total:      number
  nuevos?:    number
  highlight?: boolean
}

interface Props {
  data:     TrendPoint[]
  accent?:  string
  height?:  number
  loading?: boolean
}

function fmtCompact(n: number): string {
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}k`
  return String(Math.round(n))
}

export default function TrendArea({ data, accent = '#F5C842', height = 246, loading }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)
  const [hover, setHover] = useState<number | null>(null)
  const rawId = useId()
  const gradId = `trend-${rawId.replace(/:/g, '')}`

  useEffect(() => {
    if (!wrapRef.current) return
    setWidth(wrapRef.current.clientWidth)

    const ro = new ResizeObserver(([entry]) => {
      setWidth(entry.contentRect.width)
    })
    ro.observe(wrapRef.current)
    return () => ro.disconnect()
  }, [])

  const chart = useMemo(() => {
    const safeData = data.filter(point => Number.isFinite(point.total))
    if (safeData.length < 2 || width < 80) return null

    const padL = 44
    const padR = 18
    const padT = 24
    const padB = 34
    const innerW = Math.max(1, width - padL - padR)
    const innerH = Math.max(1, height - padT - padB)

    const max = Math.max(...safeData.map(d => d.total))
    const min = Math.min(...safeData.map(d => d.total))
    const spread = max - min
    const margin = Math.max(1, spread * 0.12, max * 0.015)
    const yMax = max + margin
    const yMin = Math.max(0, min - margin)
    const yRange = yMax - yMin || 1
    const lastIndex = Math.max(1, safeData.length - 1)

    const x = (i: number) => padL + (i / lastIndex) * innerW
    const y = (v: number) => padT + innerH - ((v - yMin) / yRange) * innerH

    const linePath = 'M ' + safeData.map((d, i) => `${x(i)} ${y(d.total)}`).join(' L ')
    const areaPath = `${linePath} L ${x(safeData.length - 1)} ${padT + innerH} L ${x(0)} ${padT + innerH} Z`
    const yTicks = Array.from({ length: 5 }, (_, i) => yMin + (i * yRange) / 4)

    return { safeData, padL, padR, padT, innerW, innerH, x, y, linePath, areaPath, yTicks }
  }, [data, width, height])

  if (loading) {
    return (
      <div ref={wrapRef} className="h-[246px] w-full rounded-xl">
        <div className="skeleton h-full w-full" />
      </div>
    )
  }

  if (!chart) {
    return (
      <div ref={wrapRef} className="flex h-[246px] items-center justify-center text-xs text-gray-400 dark:text-mi-500">
        Sin datos suficientes para graficar tendencia
      </div>
    )
  }

  const hoverPoint = hover === null ? null : chart.safeData[hover]

  return (
    <div ref={wrapRef} className="relative w-full select-none">
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="block"
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect()
          const mx = e.clientX - rect.left
          const idx = Math.round(((mx - chart.padL) / chart.innerW) * (chart.safeData.length - 1))
          if (idx >= 0 && idx < chart.safeData.length) setHover(idx)
        }}
        onMouseLeave={() => setHover(null)}
        role="img"
        aria-label="Tendencia de activos"
      >
        <defs>
          <linearGradient id={gradId} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={accent} stopOpacity={0.32} />
            <stop offset="62%" stopColor={accent} stopOpacity={0.08} />
            <stop offset="100%" stopColor={accent} stopOpacity={0} />
          </linearGradient>
        </defs>

        {chart.yTicks.map((tick, i) => (
          <g key={i}>
            <line
              x1={chart.padL}
              x2={width - chart.padR}
              y1={chart.y(tick)}
              y2={chart.y(tick)}
              stroke="currentColor"
              strokeDasharray="2 5"
              className="text-gray-200/80 dark:text-white/[0.05]"
            />
            <text
              x={chart.padL - 9}
              y={chart.y(tick) + 3}
              textAnchor="end"
              fontSize="9.5"
              fontFamily="JetBrains Mono"
              className="fill-gray-400 dark:fill-mi-500"
            >
              {fmtCompact(tick)}
            </text>
          </g>
        ))}

        {chart.safeData.map((d, i) => (
          <text
            key={d.label}
            x={chart.x(i)}
            y={height - 10}
            textAnchor="middle"
            fontSize="9"
            fontFamily="JetBrains Mono"
            fill={d.highlight ? accent : 'currentColor'}
            className={d.highlight ? '' : 'fill-gray-400 dark:fill-mi-500'}
          >
            {d.label}
          </text>
        ))}

        <path d={chart.areaPath} fill={`url(#${gradId})`} />
        <path d={chart.linePath} fill="none" stroke={accent} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

        {chart.safeData.map((d, i) => (
          <g key={`${d.label}-${i}`}>
            {(d.highlight || i === chart.safeData.length - 1) && (
              <>
                <circle cx={chart.x(i)} cy={chart.y(d.total)} r="8" fill={accent} opacity={0.18} />
                <circle cx={chart.x(i)} cy={chart.y(d.total)} r="4" fill={accent} />
              </>
            )}
          </g>
        ))}

        {hover !== null && (
          <g>
            <line
              x1={chart.x(hover)}
              x2={chart.x(hover)}
              y1={chart.padT}
              y2={chart.padT + chart.innerH}
              stroke={accent}
              strokeOpacity={0.42}
              strokeDasharray="3 4"
            />
            <circle
              cx={chart.x(hover)}
              cy={chart.y(chart.safeData[hover].total)}
              r="4.5"
              fill={accent}
              stroke="#0B0F1F"
              strokeWidth="2"
            />
          </g>
        )}
      </svg>

      {hoverPoint && hover !== null && (
        <div
          className="absolute top-2 pointer-events-none rounded-lg border border-[#F5C842]/30 bg-white/95 px-3 py-2 text-[11px] font-mono shadow-lg backdrop-blur dark:bg-mi-900/95"
          style={{ left: Math.min(width - 164, Math.max(0, chart.x(hover) - 82)), minWidth: 148 }}
        >
          <div className="mb-1 text-[9px] uppercase tracking-[0.12em] text-gray-400 dark:text-mi-500">
            {hoverPoint.label}
          </div>
          <div className="mb-0.5 text-[14px] font-bold" style={{ color: accent }}>
            {hoverPoint.total.toLocaleString('es-CO')}
          </div>
          {hoverPoint.nuevos !== undefined && (
            <div className="text-[10px] text-gray-500 dark:text-mi-300">
              {hoverPoint.nuevos.toLocaleString('es-CO')} nuevos
            </div>
          )}
        </div>
      )}
    </div>
  )
}
