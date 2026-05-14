import { Fragment, useState } from 'react'

export interface HeatmapColumn {
  key:   string
  label: string
}

export interface HeatmapData {
  rows:   string[]
  cols:   HeatmapColumn[]
  matrix: number[][]
}

interface Props extends HeatmapData {
  loading?: boolean
}

interface HoverState {
  r:   number
  c:   number
  v:   number
  row: string
  col: string
}

function fmtCompact(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n)
}

function cellColor(value: number, max: number) {
  if (value <= 0) return 'rgba(255,255,255,0.025)'
  const ratio = Math.min(1, Math.log(value + 1) / Math.log(max + 1))
  if (ratio < 0.18) return `rgba(96,165,250,${0.10 + ratio * 0.42})`
  if (ratio < 0.45) return `rgba(167,139,250,${0.18 + ratio * 0.42})`
  if (ratio < 0.75) return `rgba(251,191,36,${0.28 + ratio * 0.45})`
  return `rgba(245,200,66,${0.55 + (ratio - 0.75) * 1.55})`
}

function textColor(value: number, max: number) {
  if (value <= 0) return 'rgba(255,255,255,0.35)'
  const ratio = Math.min(1, Math.log(value + 1) / Math.log(max + 1))
  if (ratio < 0.18) return 'rgba(255,255,255,0.48)'
  if (ratio < 0.45) return 'rgba(255,255,255,0.78)'
  return '#0B0F1F'
}

export default function Heatmap({ rows, cols, matrix, loading }: Props) {
  const [hover, setHover] = useState<HoverState | null>(null)
  const flat = matrix.flat().filter(Number.isFinite)
  const max = Math.max(1, ...flat)

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, row) => (
          <div key={row} className="grid grid-cols-6 gap-1">
            {Array.from({ length: 6 }).map((__, col) => (
              <div key={col} className="skeleton h-10 rounded-md" />
            ))}
          </div>
        ))}
      </div>
    )
  }

  if (rows.length === 0 || cols.length === 0) {
    return (
      <div className="flex min-h-[250px] items-center justify-center text-xs text-gray-400 dark:text-mi-500">
        Sin datos suficientes para el mapa de calor
      </div>
    )
  }

  return (
    <div>
      <div className="overflow-x-auto pb-1">
        <div
          className="grid min-w-[720px] gap-1"
          style={{ gridTemplateColumns: `132px repeat(${cols.length}, minmax(84px, 1fr))` }}
        >
          <div />
          {cols.map(col => (
            <div key={col.key} className="px-1 py-1 text-center">
              <div className="truncate font-mono text-[9px] uppercase tracking-[0.08em] text-gray-400 dark:text-mi-400" title={col.label}>
                {col.label}
              </div>
            </div>
          ))}

          {rows.map((row, ri) => (
            <Fragment key={row}>
              <div className="truncate px-1.5 py-2.5 text-right font-mono text-[10px] uppercase tracking-[0.04em] text-gray-500 dark:text-mi-300" title={row}>
                {row}
              </div>
              {cols.map((col, ci) => {
                const value = matrix[ri]?.[ci] ?? 0
                const isHover = hover?.r === ri && hover?.c === ci
                const hot = value === max

                return (
                  <div
                    key={`${row}-${col.key}`}
                    onMouseEnter={() => setHover({ r: ri, c: ci, v: value, row, col: col.label })}
                    onMouseLeave={() => setHover(null)}
                    className="rounded-md px-1 py-2.5 text-center font-mono text-[11px] transition duration-150"
                    style={{
                      background: cellColor(value, max),
                      color: textColor(value, max),
                      fontWeight: hot ? 700 : 500,
                      outline: isHover ? '1px solid rgba(245,200,66,0.62)' : '1px solid transparent',
                      transform: isHover ? 'scale(1.035)' : undefined,
                    }}
                    role="img"
                    aria-label={`${row}, ${col.label}: ${value.toLocaleString('es-CO')} activos`}
                  >
                    {value === 0 ? '-' : value >= 1000 ? fmtCompact(value) : value}
                  </div>
                )
              })}
            </Fragment>
          ))}
        </div>
      </div>

      <div className="mt-3.5 flex flex-col gap-2 border-t border-gray-100 pt-3 dark:border-white/[0.05] sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-gray-400 dark:text-mi-500">menor</span>
          <div
            className="h-2 w-[140px] rounded-full"
            style={{ background: 'linear-gradient(90deg, rgba(96,165,250,.4), rgba(167,139,250,.55), rgba(251,191,36,.75), #F5C842)' }}
          />
          <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-gray-400 dark:text-mi-500">mayor</span>
        </div>

        {hover && (
          <div className="truncate font-mono text-[11px] text-gray-700 dark:text-mi-200">
            <span className="text-gray-400 dark:text-mi-500">{hover.row}</span>
            <span className="mx-1 text-gray-300 dark:text-mi-600">/</span>
            <span className="text-gray-400 dark:text-mi-500">{hover.col}</span>
            <span className="mx-1 text-gray-300 dark:text-mi-600">/</span>
            <span className="font-bold text-[#B8880A] dark:text-[#F5C842]">{hover.v.toLocaleString('es-CO')}</span>
          </div>
        )}
      </div>
    </div>
  )
}
