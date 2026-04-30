import { useEffect, useState } from 'react'
import { cn } from '../../lib/utils'

interface Item { nombre: string; cantidad: number }

interface Props {
  title:   string
  items:   Item[]
  color?:  string
  loading?: boolean
}

function BarRow({ item, max, color }: { item: Item; max: number; color: string }) {
  const [width, setWidth] = useState(0)
  const target = max > 0 ? (item.cantidad / max) * 100 : 0

  useEffect(() => {
    const t = setTimeout(() => setWidth(target), 80)
    return () => clearTimeout(t)
  }, [target])

  return (
    <div className="flex items-center gap-3 py-[5px] group">
      <span
        title={item.nombre}
        className="w-32 text-[11px] text-right truncate text-gray-500 dark:text-mi-400 group-hover:text-gray-800 dark:group-hover:text-mi-200 transition-colors duration-150"
      >
        {item.nombre}
      </span>

      <div className="flex-1 h-[5px] bg-gray-100 dark:bg-white/[0.05] rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-700 ease-out', color)}
          style={{ width: `${width}%` }}
        />
      </div>

      <span className="w-14 text-[11px] font-mono text-right tabular-nums text-gray-500 dark:text-mi-500">
        {item.cantidad.toLocaleString('es-CO')}
      </span>
    </div>
  )
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 py-[5px]">
      <div className="w-32 h-3 rounded bg-gray-100 dark:bg-white/[0.05] animate-pulse" />
      <div className="flex-1 h-[5px] rounded-full bg-gray-100 dark:bg-white/[0.05] animate-pulse" />
      <div className="w-10 h-3 rounded bg-gray-100 dark:bg-white/[0.05] animate-pulse" />
    </div>
  )
}

export default function DistributionChart({ title, items, color = 'bg-mi-500 dark:bg-gold', loading }: Props) {
  const max = items.reduce((m, i) => Math.max(m, i.cantidad), 0)

  return (
    <div className="
      rounded-2xl bg-white dark:bg-white/[0.02]
      border border-gray-100 dark:border-white/[0.06] p-5
    ">
      <h3 className="text-xs font-medium tracking-widest uppercase text-gray-400 dark:text-mi-600 mb-4">
        {title}
      </h3>

      <div className="space-y-0.5">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
          : items.map(item => (
              <BarRow key={item.nombre} item={item} max={max} color={color} />
            ))
        }
        {!loading && items.length === 0 && (
          <p className="text-xs text-gray-400 dark:text-mi-700 text-center py-4">Sin datos</p>
        )}
      </div>
    </div>
  )
}
