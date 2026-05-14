import { Minus, TrendingDown, TrendingUp } from 'lucide-react'
import { cn } from '../../../lib/utils'

interface Props {
  value:      number
  invert?:    boolean
  className?: string
}

export default function DeltaBadge({ value, invert = false, className }: Props) {
  const positive = invert ? value < 0 : value > 0
  const negative = invert ? value > 0 : value < 0
  const Icon = value > 0 ? TrendingUp : value < 0 ? TrendingDown : Minus
  const sign = value > 0 ? '+' : ''

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 font-mono text-[10px] tabular-nums tracking-wide',
        positive && 'text-emerald-500 dark:text-emerald-400',
        negative && 'text-red-500 dark:text-red-400',
        !positive && !negative && 'text-gray-400 dark:text-mi-400',
        className,
      )}
    >
      <Icon size={11} strokeWidth={2} />
      {sign}{value.toFixed(1)}%
    </span>
  )
}
