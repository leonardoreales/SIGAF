import type { CSSProperties } from 'react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '../../lib/utils'
import DeltaBadge from './widgets/DeltaBadge'
import Sparkline from './widgets/Sparkline'

type CardColor = 'default' | 'emerald' | 'red' | 'amber' | 'gold' | 'blue' | 'violet'

interface Props {
  icon:        LucideIcon
  label:       string
  value:       string | number
  sub?:        string
  color?:      CardColor
  loading?:    boolean
  delta?:      number
  invertDelta?: boolean
  spark?:      number[]
  className?:  string
}

const ACCENT_STYLE: Record<CardColor, CSSProperties> = {
  default: { background: 'linear-gradient(90deg, #52525B 0%, #A1A1AA 100%)' },
  emerald: { background: 'linear-gradient(90deg, #059669 0%, #34D399 100%)' },
  red:     { background: 'linear-gradient(90deg, #DC2626 0%, #F87171 100%)' },
  amber:   { background: 'linear-gradient(90deg, #D97706 0%, #FCD34D 100%)' },
  gold:    { background: 'linear-gradient(90deg, #B8880A 0%, #F5C842 50%, #DBA830 100%)' },
  blue:    { background: 'linear-gradient(90deg, #2563EB 0%, #60A5FA 100%)' },
  violet:  { background: 'linear-gradient(90deg, #7C3AED 0%, #A78BFA 100%)' },
}

const ICON_BG: Record<CardColor, string> = {
  default: 'bg-mi-50 text-mi-500 dark:bg-mi-900/50 dark:text-mi-300',
  emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400',
  red:     'bg-red-50 text-red-500 dark:bg-red-950/50 dark:text-red-400',
  amber:   'bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400',
  gold:    'bg-[#F5C842]/10 text-[#B8880A] dark:bg-[#F5C842]/[0.12] dark:text-[#F5C842]',
  blue:    'bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400',
  violet:  'bg-violet-50 text-violet-600 dark:bg-violet-950/50 dark:text-violet-400',
}

const VALUE_COLOR: Record<CardColor, string> = {
  default: 'text-gray-900 dark:text-mi-50',
  emerald: 'text-emerald-700 dark:text-emerald-300',
  red:     'text-red-700 dark:text-red-300',
  amber:   'text-amber-700 dark:text-amber-300',
  gold:    'text-[#B8880A] dark:text-[#F5C842]',
  blue:    'text-blue-700 dark:text-blue-300',
  violet:  'text-violet-700 dark:text-violet-300',
}

const SPARK_COLOR: Record<CardColor, string> = {
  default: '#A1A1AA',
  emerald: '#34D399',
  red:     '#F87171',
  amber:   '#FBBF24',
  gold:    '#F5C842',
  blue:    '#60A5FA',
  violet:  '#A78BFA',
}

export default function KpiCard({
  icon: Icon,
  label,
  value,
  sub,
  color = 'default',
  loading,
  delta,
  invertDelta,
  spark,
  className,
}: Props) {
  return (
    <div className={cn('card relative flex min-h-[150px] flex-col gap-3 overflow-hidden rounded-xl p-4 pb-3 animate-card-in', className)}>
      <div className="absolute inset-x-0 top-0 h-[2.5px]" style={ACCENT_STYLE[color]} />

      <div className="flex items-start justify-between gap-3 pt-1">
        <div className="min-w-0 flex-1">
          <div className="mb-2 font-mono text-[9.5px] uppercase leading-none tracking-[0.18em] text-gray-400 dark:text-mi-400">
            {label}
          </div>

          {loading ? (
            <div className="space-y-2.5">
              <div className="skeleton h-7 w-24" />
              <div className="skeleton h-3 w-20" />
            </div>
          ) : (
            <>
              <p className={cn('font-syne text-[1.65rem] font-bold leading-none tracking-tight', VALUE_COLOR[color])}>
                {value}
              </p>
              {sub && (
                <p className="mt-2 text-[10.5px] leading-tight text-gray-400 dark:text-mi-400">
                  {sub}
                </p>
              )}
            </>
          )}
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          <div className={cn('flex h-[30px] w-[30px] items-center justify-center rounded-lg', ICON_BG[color])}>
            <Icon size={15} strokeWidth={1.75} />
          </div>
          {!loading && spark && spark.length > 1 && (
            <Sparkline data={spark} color={SPARK_COLOR[color]} width={72} height={22} />
          )}
        </div>
      </div>

      {delta !== undefined && !loading && (
        <div className="mt-auto flex items-center justify-between gap-2 border-t border-gray-100 pt-2 dark:border-white/[0.05]">
          <DeltaBadge value={delta} invert={invertDelta} />
          <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-gray-400 dark:text-mi-500">
            30 días
          </span>
        </div>
      )}
    </div>
  )
}
