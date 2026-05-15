import { useState, useEffect, useRef } from 'react'
import { Search, X, Loader2 } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'

export interface SearchInputProps {
  value:        string
  onChange:     (v: string) => void
  onSearch?:    () => void
  debounce?:    number
  placeholder?: string
  isLoading?:   boolean
  className?:   string
}

export function SearchInput({
  value, onChange, onSearch, debounce: debounceMs,
  placeholder = 'Buscar…', isLoading, className,
}: SearchInputProps) {
  const [focused, setFocused] = useState(false)
  const { isDark } = useTheme()
  const mounted = useRef(false)
  const goldFocus = isDark ? '#F5C842' : '#D9AB44'

  // Internal debounce — only active when debounce prop is provided
  useEffect(() => {
    if (debounceMs === undefined) return
    if (!mounted.current) { mounted.current = true; return }
    const t = setTimeout(() => onSearch?.(), debounceMs)
    return () => clearTimeout(t)
  }, [value]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      style={{
        position: 'relative',
        flex: '1 1 220px',
        minWidth: 180,
        borderRadius: 9,
        border: `1px solid ${focused ? goldFocus : 'var(--flt-border)'}`,
        boxShadow: focused ? '0 0 0 3px rgba(217,171,68,0.15)' : 'none',
        background: 'var(--flt-input)',
        transition: 'border-color 0.15s, box-shadow 0.15s',
      }}
      className={className}
    >
      {isLoading ? (
        <Loader2
          size={14}
          style={{
            position: 'absolute', left: 11, top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--tbl-text-sub)',
            pointerEvents: 'none',
            animation: 'spin 1s linear infinite',
          }}
        />
      ) : (
        <Search
          size={14}
          style={{
            position: 'absolute', left: 11, top: '50%',
            transform: 'translateY(-50%)',
            color: focused ? goldFocus : 'var(--tbl-text-sub)',
            pointerEvents: 'none',
            transition: 'color 0.15s',
          }}
        />
      )}
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onKeyDown={e => { if (e.key === 'Enter') onSearch?.() }}
        placeholder={placeholder}
        style={{
          width: '100%',
          padding: '7.5px 34px',
          fontSize: 13,
          border: 'none',
          borderRadius: 8,
          background: 'transparent',
          color: 'var(--tbl-text)',
          outline: 'none',
          boxSizing: 'border-box',
        }}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          style={{
            position: 'absolute', right: 10, top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--tbl-text-sub)',
            background: 'none', border: 'none',
            cursor: 'pointer', padding: 3,
            display: 'flex', alignItems: 'center',
          }}
        >
          <X size={13} />
        </button>
      )}
    </div>
  )
}
