import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '../../lib/utils'

interface Props {
  icon:       LucideIcon
  title:      string
  right?:     ReactNode
  className?: string
}

export default function CardHeader({ icon: Icon, title, right, className }: Props) {
  return (
    <div
      className={cn(
        'mb-4 flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5',
        'border-gray-200/80 bg-gradient-to-r from-gray-50 via-white to-[#FFF8E6]',
        'shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]',
        'dark:border-white/[0.07] dark:from-white/[0.055] dark:via-white/[0.03] dark:to-[#F5C842]/[0.055]',
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-2">
        <span
          className={cn(
            'flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border',
            'border-gray-200 bg-white text-[#9C6E22] shadow-sm',
            'dark:border-[#F5C842]/20 dark:bg-[#F5C842]/[0.08] dark:text-[#F5C842]',
          )}
        >
          <Icon size={12.5} strokeWidth={1.9} />
        </span>
        <h2 className="truncate font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-600 dark:text-mi-200">
          {title}
        </h2>
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </div>
  )
}
