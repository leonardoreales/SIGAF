import type { LucideIcon } from 'lucide-react'
import { cn } from '../../lib/utils'

type CardColor = 'default' | 'emerald' | 'red' | 'amber' | 'gold'

interface Props {
  icon:     LucideIcon
  label:    string
  value:    string | number
  sub?:     string
  color?:   CardColor
  loading?: boolean
}

const ACCENT: Record<CardColor, string> = {
  default: 'bg-mi-500',
  emerald: 'bg-emerald-500',
  red:     'bg-red-500',
  amber:   'bg-amber-400',
  gold:    'bg-[#F5C842]',
}

const ICON_BG: Record<CardColor, string> = {
  default: 'bg-mi-50   text-mi-600   dark:bg-mi-900/60  dark:text-mi-300',
  emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400',
  red:     'bg-red-50   text-red-600   dark:bg-red-950/40  dark:text-red-400',
  amber:   'bg-amber-50  text-amber-600  dark:bg-amber-950/40 dark:text-amber-400',
  gold:    'bg-[#F5C842]/10 text-[#c49a10] dark:bg-[#F5C842]/10 dark:text-[#F5C842]',
}

const VALUE_COLOR: Record<CardColor, string> = {
  default: 'text-gray-900 dark:text-mi-50',
  emerald: 'text-emerald-700 dark:text-emerald-300',
  red:     'text-red-700 dark:text-red-300',
  amber:   'text-amber-700 dark:text-amber-300',
  gold:    'text-[#c49a10] dark:text-[#F5C842]',
}

export default function KpiCard({ icon: Icon, label, value, sub, color = 'default', loading }: Props) {
  return (
    <div className="
      relative overflow-hidden rounded-2xl
      bg-white dark:bg-white/[0.02]
      border border-gray-100 dark:border-white/[0.06]
      p-5 flex flex-col gap-3
      transition-shadow hover:shadow-md dark:hover:shadow-none dark:hover:border-white/[0.10]
    ">
      {/* Accent bar top */}
      <div className={cn('absolute top-0 left-0 right-0 h-[2px]', ACCENT[color])} />

      {/* Icon + label */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium tracking-wide text-gray-500 dark:text-mi-500 uppercase">
          {label}
        </span>
        <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', ICON_BG[color])}>
          <Icon size={15} strokeWidth={2} />
        </div>
      </div>

      {/* Value */}
      {loading ? (
        <div className="space-y-2">
          <div className="h-8 w-28 rounded-lg bg-gray-100 dark:bg-white/[0.05] animate-pulse" />
          <div className="h-3 w-20 rounded bg-gray-100 dark:bg-white/[0.04] animate-pulse" />
        </div>
      ) : (
        <div>
          <p className={cn('text-3xl font-syne font-bold leading-none tracking-tight', VALUE_COLOR[color])}>
            {value}
          </p>
          {sub && (
            <p className="mt-1.5 text-xs text-gray-400 dark:text-mi-600">{sub}</p>
          )}
        </div>
      )}
    </div>
  )
}
