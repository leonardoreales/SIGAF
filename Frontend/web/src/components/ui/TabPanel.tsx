import { cn } from '../../lib/utils'

export interface TabItem<T extends string = string> {
  id:     T
  label:  string
  icon?:  React.ElementType
  badge?: number | string
}

interface TabPanelProps<T extends string = string> {
  tabs:      TabItem<T>[]
  active:    T
  onChange:  (id: T) => void
  variant?:  'pill' | 'underline'
  className?: string
}

export function TabPanel<T extends string = string>({
  tabs, active, onChange, variant = 'pill', className,
}: TabPanelProps<T>) {
  if (variant === 'pill') {
    return (
      <div className={cn('flex gap-1 p-1 rounded-xl bg-gray-100 dark:bg-mi-800/60 w-fit', className)}>
        {tabs.map(({ id, label, icon: Icon, badge }) => (
          <button
            key={id}
            onClick={() => onChange(id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
              active === id
                ? 'bg-white shadow-sm text-gray-900 dark:bg-mi-900 dark:text-mi-50'
                : 'text-gray-500 hover:text-gray-700 dark:text-mi-400 dark:hover:text-mi-200',
            )}
          >
            {Icon && <Icon size={15} />}
            {label}
            {badge !== undefined && (
              <span className={cn(
                'text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-none',
                active === id
                  ? 'bg-gray-100 text-gray-600 dark:bg-mi-700 dark:text-mi-300'
                  : 'bg-gray-200 text-gray-500 dark:bg-mi-700/60 dark:text-mi-400',
              )}>
                {badge}
              </span>
            )}
          </button>
        ))}
      </div>
    )
  }

  // underline variant
  return (
    <div className={cn('flex border-b border-gray-100 dark:border-white/[0.06]', className)}>
      {tabs.map(({ id, label, icon: Icon, badge }) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          className={cn(
            'flex items-center gap-1.5 px-4 py-3 text-sm font-medium transition-colors relative',
            active === id
              ? 'text-gray-900 dark:text-mi-50'
              : 'text-gray-500 hover:text-gray-700 dark:text-mi-400 dark:hover:text-mi-300',
          )}
        >
          {Icon && <Icon size={14} />}
          {label}
          {badge !== undefined && (
            <span className="text-[10px] font-bold bg-gold/10 text-[#9C6E22] dark:text-gold px-1.5 py-0.5 rounded-full">
              {badge}
            </span>
          )}
          {active === id && (
            <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#D9AB44] to-[#F5C842] rounded-full" />
          )}
        </button>
      ))}
    </div>
  )
}
