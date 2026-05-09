import { useEffect, useState } from 'react'
import { cn } from '../../lib/utils'

interface Item { nombre: string; cantidad: number }

interface Props {
  title:    string
  items:    Item[]
  color?:   string
  loading?: boolean
}

const BAR_GRADIENT_LIGHT = 'linear-gradient(90deg, #52525B 0%, #A1A1AA 100%)'
const BAR_GRADIENT_DARK  = 'linear-gradient(90deg, #F5C842 0%, #FFD566 100%)'

function BarRow({ item, max, color }: { item: Item; max: number; color: string }) {
  const [width, setWidth] = useState(0)
  const target = max > 0 ? (item.cantidad / max) * 100 : 0

  useEffect(() => {
    const t = setTimeout(() => setWidth(target), 100)
    return () => clearTimeout(t)
  }, [target])

  const pct = max > 0 ? Math.round((item.cantidad / max) * 100) : 0

  return (
    <div className="flex items-center gap-3 py-[6px] group">
      <span
        title={item.nombre}
        className="w-32 text-[11px] text-right truncate text-gray-500 dark:text-mi-400 group-hover:text-gray-800 dark:group-hover:text-mi-200 transition-colors duration-150"
      >
        {item.nombre}
      </span>

      <div className="flex-1 flex items-center gap-2">
        <div className="flex-1 h-[6px] bg-gray-100 dark:bg-white/[0.06] rounded-full overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all duration-700 ease-out', color)}
            style={{
              width: `${width}%`,
              background: color.includes('gold') || color.includes('F5C842')
                ? undefined
                : undefined,
            }}
          />
        </div>
        <span className="w-8 text-[10px] font-mono text-right tabular-nums text-gray-400 dark:text-mi-400 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
          {pct}%
        </span>
      </div>

      <span className="w-14 text-[11px] font-mono text-right tabular-nums text-gray-500 dark:text-mi-500">
        {item.cantidad.toLocaleString('es-CO')}
      </span>
    </div>
  )
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 py-[6px]">
      <div className="skeleton w-32 h-3" />
      <div className="flex-1 skeleton h-[6px]" />
      <div className="skeleton w-10 h-3" />
    </div>
  )
}

export default function DistributionChart({ title, items, color = 'bg-mi-500 dark:bg-[#F5C842]', loading }: Props) {
  const max = items.reduce((m, i) => Math.max(m, i.cantidad), 0)

  return (
    <div className="card rounded-2xl p-5">
      <h3 className="text-[10.5px] font-mono tracking-[0.16em] uppercase text-gray-400 dark:text-mi-400 mb-4">
        {title}
      </h3>

      <div className="space-y-0">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
          : items.map(item => (
              <BarRow key={item.nombre} item={item} max={max} color={color} />
            ))
        }
        {!loading && items.length === 0 && (
          <p className="text-xs text-gray-400 dark:text-mi-500 text-center py-6">Sin datos</p>
        )}
      </div>
    </div>
  )
}
