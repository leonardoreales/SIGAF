import type { LucideIcon } from 'lucide-react'
import { cn } from '../../lib/utils'

type CardColor = 'default' | 'emerald' | 'red' | 'amber' | 'gold'

interface Props {
  icon:       LucideIcon
  label:      string
  value:      string | number
  sub?:       string
  color?:     CardColor
  loading?:   boolean
  className?: string
}

const ACCENT_STYLE: Record<CardColor, React.CSSProperties> = {
  default: { background: 'linear-gradient(90deg, #52525B 0%, #A1A1AA 100%)' },
  emerald: { background: 'linear-gradient(90deg, #059669 0%, #34D399 100%)' },
  red:     { background: 'linear-gradient(90deg, #DC2626 0%, #F87171 100%)' },
  amber:   { background: 'linear-gradient(90deg, #D97706 0%, #FCD34D 100%)' },
  gold:    { background: 'linear-gradient(90deg, #B8880A 0%, #F5C842 50%, #DBA830 100%)' },
}

const ICON_BG: Record<CardColor, string> = {
  default: 'bg-mi-50    text-mi-500   dark:bg-mi-900/50   dark:text-mi-300',
  emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400',
  red:     'bg-red-50   text-red-500   dark:bg-red-950/50  dark:text-red-400',
  amber:   'bg-amber-50  text-amber-600  dark:bg-amber-950/50 dark:text-amber-400',
  gold:    'bg-[#F5C842]/10 text-[#b8880a] dark:bg-[#F5C842]/[0.12] dark:text-[#F5C842]',
}

const VALUE_COLOR: Record<CardColor, string> = {
  default: 'text-gray-900 dark:text-mi-50',
  emerald: 'text-emerald-700 dark:text-emerald-300',
  red:     'text-red-700 dark:text-red-300',
  amber:   'text-amber-700 dark:text-amber-300',
  gold:    'text-[#b8880a] dark:text-[#F5C842]',
}

export default function KpiCard({
  icon: Icon, label, value, sub, color = 'default', loading, className,
}: Props) {
  return (
    <div className={cn('card relative overflow-hidden rounded-2xl p-5 flex flex-col gap-3 animate-card-in', className)}>

      {/* Gradient accent bar */}
      <div
        className="absolute top-0 left-0 right-0 h-[3px]"
        style={ACCENT_STYLE[color]}
      />

      {/* Icon + label row */}
      <div className="flex items-center justify-between pt-0.5">
        <span className="text-[10.5px] font-mono tracking-[0.14em] text-gray-400 dark:text-mi-400 uppercase leading-none">
          {label}
        </span>
        <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0', ICON_BG[color])}>
          <Icon size={16} strokeWidth={1.75} />
        </div>
      </div>

      {/* Value / skeleton */}
      {loading ? (
        <div className="space-y-2.5 mt-1">
          <div className="skeleton h-8 w-28" />
          <div className="skeleton h-3 w-20" />
        </div>
      ) : (
        <div className="animate-fade-up">
          <p className={cn('text-[2rem] font-syne font-bold leading-none tracking-tight', VALUE_COLOR[color])}>
            {value}
          </p>
          {sub && (
            <p className="mt-2 text-[11px] text-gray-400 dark:text-mi-400 leading-none">
              {sub}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
