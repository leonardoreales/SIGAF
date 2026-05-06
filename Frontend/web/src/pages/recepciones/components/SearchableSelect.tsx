import { useState, useRef, useEffect, useCallback } from 'react'
import { ChevronDown, Search, X } from 'lucide-react'
import { cn } from '../../../lib/utils'

export interface SelectOption {
  value: string
  label: string
}

interface Props {
  options:      SelectOption[]
  value:        string
  onChange:     (value: string) => void
  placeholder?: string
  disabled?:    boolean
  className?:   string
  onKeyDown?:   (e: React.KeyboardEvent) => void
}

export default function SearchableSelect({
  options, value, onChange, placeholder = 'Seleccionar…',
  disabled, className, onKeyDown,
}: Props) {
  const [open,   setOpen]   = useState(false)
  const [query,  setQuery]  = useState('')
  const [cursor, setCursor] = useState(-1)

  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef     = useRef<HTMLInputElement>(null)
  const listRef      = useRef<HTMLUListElement>(null)

  const selected = options.find(o => o.value === value)

  const filtered = query
    ? options.filter(o => o.label.toLowerCase().includes(query.toLowerCase()))
    : options

  // Recent: put last-used at top (stored in module-level set, simple approach)
  const sorted = filtered

  function openDropdown() {
    if (disabled) return
    setOpen(true)
    setQuery('')
    setCursor(-1)
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  function closeDropdown() {
    setOpen(false)
    setQuery('')
    setCursor(-1)
  }

  function select(option: SelectOption) {
    onChange(option.value)
    closeDropdown()
  }

  function clear(e: React.MouseEvent) {
    e.stopPropagation()
    onChange('')
    closeDropdown()
  }

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function handler(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) closeDropdown()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  // Scroll cursor into view
  useEffect(() => {
    if (cursor < 0 || !listRef.current) return
    const item = listRef.current.children[cursor] as HTMLElement
    item?.scrollIntoView({ block: 'nearest' })
  }, [cursor])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape')     { closeDropdown(); return }
    if (e.key === 'ArrowDown')  { e.preventDefault(); setCursor(c => Math.min(c + 1, sorted.length - 1)); return }
    if (e.key === 'ArrowUp')    { e.preventDefault(); setCursor(c => Math.max(c - 1, 0)); return }
    if (e.key === 'Enter' && cursor >= 0) { e.preventDefault(); select(sorted[cursor]); return }
    if (e.key === 'Tab')        { closeDropdown(); onKeyDown?.(e) }
  }, [cursor, sorted, onKeyDown])

  const triggerCls = cn(
    'w-full flex items-center gap-1.5 px-2.5 py-[7px] text-sm rounded-lg transition-colors outline-none',
    'bg-white border text-gray-900',
    'dark:bg-mi-800 dark:text-mi-100',
    open
      ? 'border-blue-400 ring-1 ring-blue-400/30 dark:border-gold/60 dark:ring-gold/20'
      : 'border-gray-200 dark:border-mi-600/60 hover:border-gray-300 dark:hover:border-mi-500',
    disabled && 'opacity-40 cursor-not-allowed bg-gray-50 dark:bg-mi-900/50',
    className,
  )

  return (
    <div ref={containerRef} className="relative w-full">

      {/* Trigger */}
      <button
        type="button"
        disabled={disabled}
        onClick={openDropdown}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openDropdown() }
          if (!open) onKeyDown?.(e)
        }}
        className={triggerCls}
      >
        <span className={cn('flex-1 truncate text-left', !selected && 'text-gray-400 dark:text-mi-500')}>
          {selected ? selected.label : placeholder}
        </span>
        {selected && !disabled ? (
          <X size={12} onClick={clear} className="shrink-0 text-gray-400 hover:text-gray-600 dark:text-mi-500 dark:hover:text-mi-300" />
        ) : (
          <ChevronDown size={12} className={cn('shrink-0 text-gray-400 dark:text-mi-500 transition-transform', open && 'rotate-180')} />
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-full min-w-[220px] rounded-xl border border-gray-200 dark:border-mi-600/60 bg-white dark:bg-mi-800 shadow-xl shadow-black/10 dark:shadow-black/40 overflow-hidden">

          {/* Search input */}
          <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100 dark:border-mi-700/60">
            <Search size={13} className="shrink-0 text-gray-400 dark:text-mi-500" />
            <input
              ref={inputRef}
              value={query}
              onChange={e => { setQuery(e.target.value); setCursor(-1) }}
              onKeyDown={handleKeyDown}
              placeholder="Buscar área…"
              className="flex-1 text-sm bg-transparent outline-none text-gray-900 dark:text-mi-100 placeholder:text-gray-400 dark:placeholder:text-mi-500"
            />
          </div>

          {/* Options list */}
          <ul
            ref={listRef}
            className="max-h-52 overflow-y-auto py-1"
          >
            {sorted.length === 0 ? (
              <li className="px-3 py-2.5 text-sm text-gray-400 dark:text-mi-500 text-center">
                Sin resultados
              </li>
            ) : sorted.map((opt, i) => (
              <li
                key={opt.value}
                onMouseDown={() => select(opt)}
                onMouseEnter={() => setCursor(i)}
                className={cn(
                  'flex items-center px-3 py-2 text-sm cursor-pointer transition-colors',
                  value === opt.value
                    ? 'bg-blue-50 text-blue-700 dark:bg-gold/10 dark:text-gold font-medium'
                    : cursor === i
                    ? 'bg-gray-50 text-gray-900 dark:bg-mi-700/60 dark:text-mi-100'
                    : 'text-gray-700 dark:text-mi-200 hover:bg-gray-50 dark:hover:bg-mi-700/40',
                )}
              >
                {opt.label}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
