import { fmtCOP } from '../../../lib/utils'

export interface AreaRank {
  area:       string
  cantidad:   number
  valorTotal: number
}

interface Props {
  items:    AreaRank[]
  loading?: boolean
}

export default function TopAreas({ items, loading }: Props) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="grid grid-cols-[24px_1fr_56px] items-center gap-3">
            <div className="skeleton h-4 w-5" />
            <div className="space-y-2">
              <div className="skeleton h-3 w-4/5" />
              <div className="skeleton h-2.5 w-2/5" />
            </div>
            <div className="skeleton h-4 w-12" />
          </div>
        ))}
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="flex min-h-[220px] items-center justify-center text-xs text-gray-400 dark:text-mi-500">
        Sin áreas responsables registradas
      </div>
    )
  }

  return (
    <div>
      {items.map((item, i) => (
        <div
          key={item.area}
          className="grid grid-cols-[24px_1fr_auto] items-center gap-3 border-b border-gray-100 py-2.5 last:border-b-0 dark:border-white/[0.04]"
        >
          <div className={i < 3 ? 'text-center font-mono text-[10px] text-[#B8880A] dark:text-[#F5C842]' : 'text-center font-mono text-[10px] text-gray-400 dark:text-mi-500'}>
            {String(i + 1).padStart(2, '0')}
          </div>

          <div className="min-w-0">
            <div className="truncate text-[12px] font-medium leading-tight text-gray-900 dark:text-mi-100" title={item.area}>
              {item.area}
            </div>
            <div className="mt-0.5 truncate text-[10px] text-gray-400 dark:text-mi-500">
              Valor referencial {fmtCOP(item.valorTotal)}
            </div>
          </div>

          <div className="text-right">
            <div className={i < 3 ? 'font-mono text-[13px] font-semibold leading-none text-[#B8880A] dark:text-[#F5C842]' : 'font-mono text-[13px] font-semibold leading-none text-gray-700 dark:text-mi-200'}>
              {item.cantidad.toLocaleString('es-CO')}
            </div>
            <div className="mt-1 font-mono text-[9px] text-gray-400 dark:text-mi-500">activos</div>
          </div>
        </div>
      ))}
    </div>
  )
}
