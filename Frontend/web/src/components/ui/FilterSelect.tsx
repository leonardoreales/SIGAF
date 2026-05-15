import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'

export interface FilterSelectOption {
  value: string
  label: string
}

export interface FilterSelectProps {
  icon:        React.ElementType
  value:       string
  onChange:    (v: string) => void
  placeholder: string
  options?:    FilterSelectOption[]
  maxWidth?:   number
  children?:   React.ReactNode
  isActive?:   boolean
  className?:  string
}

export function FilterSelect({
  icon: Icon, value, onChange, placeholder,
  options, maxWidth = 200, children, isActive: isActiveProp, className,
}: FilterSelectProps) {
  const [focused, setFocused] = useState(false)
  const { isDark } = useTheme()
  const isActive  = isActiveProp ?? Boolean(value)
  const goldText   = isDark ? '#F5C842' : '#9C6E22'
  const goldFocus  = isDark ? '#F5C842' : '#D9AB44'
  const goldActive = isDark ? '#E6B220' : '#C8931A'

  return (
    <div style={{ position: 'relative', flexShrink: 0 }} className={className}>
      <Icon
        size={13}
        style={{
          position: 'absolute', left: 10, top: '50%',
          transform: 'translateY(-50%)',
          pointerEvents: 'none',
          color: isActive ? goldActive : focused ? goldFocus : 'var(--tbl-text-sub)',
          transition: 'color 0.15s',
          zIndex: 1,
        }}
      />
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          appearance: 'none',
          WebkitAppearance: 'none',
          padding: '7.5px 26px 7.5px 28px',
          fontSize: 13,
          border: `1px solid ${
            focused ? goldFocus :
            isActive ? 'rgba(217,171,68,0.50)' :
            'var(--flt-border)'
          }`,
          borderRadius: 10,
          background: isActive ? 'rgba(217,171,68,0.07)' : 'var(--flt-input)',
          color: isActive ? goldText : 'var(--tbl-text)',
          fontWeight: isActive ? 600 : 400,
          outline: 'none',
          cursor: 'pointer',
          transition: 'border-color 0.15s, background 0.15s, box-shadow 0.15s',
          boxShadow: focused ? '0 0 0 3px rgba(217,171,68,0.18)' : 'none',
          maxWidth,
          minWidth: 110,
          textOverflow: 'ellipsis',
        }}
      >
        <option value="">{placeholder}</option>
        {options
          ? options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)
          : children}
      </select>
      <ChevronDown
        size={11}
        style={{
          position: 'absolute', right: 9, top: '50%',
          transform: 'translateY(-50%)',
          pointerEvents: 'none',
          color: 'var(--tbl-text-sub)',
        }}
      />
    </div>
  )
}
