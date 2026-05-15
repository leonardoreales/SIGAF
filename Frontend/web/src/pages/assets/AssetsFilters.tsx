import { useState, useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Search, X, Building2, Layers, CircleDot,
  CalendarDays, MapPin,
} from 'lucide-react'
import { apiCatalogs } from '../../lib/api'
import { useTheme } from '../../context/ThemeContext'
import { FilterSelect } from '../../components/ui/FilterSelect'
import type { FiltersState } from './AssetsPage'

const STATUS_OPTIONS = [
  { value: 'ACTIVO',           label: 'Activo' },
  { value: 'EN_MANTENIMIENTO', label: 'En mantenimiento' },
  { value: 'EN_TRASLADO',      label: 'En traslado' },
  { value: 'BAJA',             label: 'Baja' },
  { value: 'DADO_DE_BAJA',     label: 'Dado de baja' },
]

const YEAR_OPTIONS = ['2022', '2023', '2024', '2025', '2026']

const MONTH_OPTIONS = [
  { value: '1',  label: 'Enero' },
  { value: '2',  label: 'Febrero' },
  { value: '3',  label: 'Marzo' },
  { value: '4',  label: 'Abril' },
  { value: '5',  label: 'Mayo' },
  { value: '6',  label: 'Junio' },
  { value: '7',  label: 'Julio' },
  { value: '8',  label: 'Agosto' },
  { value: '9',  label: 'Septiembre' },
  { value: '10', label: 'Octubre' },
  { value: '11', label: 'Noviembre' },
  { value: '12', label: 'Diciembre' },
]

type FilterFields = Omit<FiltersState, 'page' | 'limit'>

interface Props {
  value:    FiltersState
  onChange: (partial: Partial<FilterFields>) => void
}

// ── ActiveChip ────────────────────────────────────────────────────────────────

function ActiveChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  const { isDark } = useTheme()
  const goldText = isDark ? '#F5C842' : '#9C6E22'

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 6px 3px 10px',
      borderRadius: 20,
      background: 'rgba(217,171,68,0.10)',
      border: '1px solid rgba(217,171,68,0.28)',
      color: goldText,
      fontSize: 12, fontWeight: 500,
      whiteSpace: 'nowrap',
    }}>
      {label}
      <button
        onClick={onRemove}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 16, height: 16, borderRadius: '50%',
          background: 'rgba(217,171,68,0.20)',
          border: 'none', cursor: 'pointer',
          color: goldText, padding: 0,
          transition: 'background 0.12s',
          flexShrink: 0,
        }}
        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(217,171,68,0.40)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'rgba(217,171,68,0.20)')}
      >
        <X size={9} />
      </button>
    </span>
  )
}

// ── AssetsFilters ─────────────────────────────────────────────────────────────

export default function AssetsFilters({ value, onChange }: Props) {
  const [localQ, setLocalQ]         = useState(value.q)
  const [searchFocused, setSearchFocused] = useState(false)
  const { isDark } = useTheme()
  const goldText = isDark ? '#F5C842' : '#9C6E22'
  const mounted = useRef(false)

  useEffect(() => { setLocalQ(value.q) }, [value.q])

  useEffect(() => {
    if (!mounted.current) { mounted.current = true; return }
    const t = setTimeout(() => onChange({ q: localQ.trim() }), 300)
    return () => clearTimeout(t)
  }, [localQ]) // eslint-disable-line react-hooks/exhaustive-deps

  const { data: buildings } = useQuery({
    queryKey: ['catalog', 'buildings'],
    queryFn:  apiCatalogs.buildings,
    staleTime: Infinity,
  })
  const { data: assetTypes } = useQuery({
    queryKey: ['catalog', 'assetTypes'],
    queryFn:  apiCatalogs.assetTypes,
    staleTime: Infinity,
  })

  const selectedBuilding = buildings?.find(b => b.code === value.building)
  const buildingId = selectedBuilding?.id ?? null

  const { data: areas } = useQuery({
    queryKey:  ['catalog', 'areas', buildingId],
    queryFn:   () => apiCatalogs.areasByBuilding(buildingId!),
    enabled:   buildingId !== null,
    staleTime: Infinity,
  })

  function clearAll() {
    setLocalQ('')
    onChange({ q: '', building: '', type: '', status: '', year: '', month: '', area: '' })
  }

  const activeChips: { key: keyof FilterFields; label: string }[] = []
  if (value.building) {
    const b = buildings?.find(b => b.code === value.building)
    activeChips.push({ key: 'building', label: b?.name ?? value.building })
  }
  if (value.area) {
    const a = areas?.find(a => String(a.id) === value.area)
    activeChips.push({ key: 'area', label: a?.name ?? value.area })
  }
  if (value.type) {
    const t = assetTypes?.find(t => t.code === value.type)
    activeChips.push({ key: 'type', label: t?.name ?? value.type })
  }
  if (value.status) {
    const s = STATUS_OPTIONS.find(s => s.value === value.status)
    activeChips.push({ key: 'status', label: s?.label ?? value.status })
  }
  if (value.year) {
    activeChips.push({ key: 'year', label: value.year })
  }
  if (value.month) {
    const mo = MONTH_OPTIONS.find(m => m.value === value.month)
    activeChips.push({ key: 'month', label: mo?.label ?? value.month })
  }

  return (
    <div style={{
      background: 'var(--flt-bg)',
      border: '1px solid var(--flt-border)',
      borderRadius: 14,
      overflow: 'hidden',
      boxShadow: '0 1px 0 rgba(0,0,0,0.02), 0 4px 18px rgba(13,27,74,0.04)',
    }}>

      {/* ── Fila única: Búsqueda + Filtros ───────────────────────────────── */}
      <div style={{
        padding: '9px 14px',
        display: 'flex',
        gap: 8,
        alignItems: 'center',
        flexWrap: 'wrap',
        borderBottom: activeChips.length > 0 ? '1px solid var(--flt-border)' : 'none',
      }}>

        {/* Search */}
        <div style={{
          position: 'relative',
          flex: '1 1 220px',
          minWidth: 180,
          borderRadius: 9,
          border: `1px solid ${searchFocused ? (isDark ? '#F5C842' : '#D9AB44') : 'var(--flt-border)'}`,
          boxShadow: searchFocused ? '0 0 0 3px rgba(217,171,68,0.15)' : 'none',
          background: 'var(--flt-input)',
          transition: 'border-color 0.15s, box-shadow 0.15s',
        }}>
          <Search
            size={14}
            style={{
              position: 'absolute', left: 11, top: '50%',
              transform: 'translateY(-50%)',
              color: searchFocused ? (isDark ? '#F5C842' : '#D9AB44') : 'var(--tbl-text-sub)',
              pointerEvents: 'none',
              transition: 'color 0.15s',
            }}
          />
          <input
            type="text"
            value={localQ}
            onChange={e => setLocalQ(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            placeholder="Buscar por placa, nombre, serial, marca…"
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
          {localQ && (
            <button
              type="button"
              onClick={() => setLocalQ('')}
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

        {/* Divider */}
        <div style={{ width: 1, height: 24, background: 'var(--flt-border)', flexShrink: 0 }} />

        <FilterSelect
          icon={Building2}
          value={value.building}
          onChange={v => onChange({ building: v, area: '' })}
          placeholder="Edificio"
          maxWidth={190}
        >
          {buildings?.map(b => <option key={b.id} value={b.code}>{b.name}</option>)}
        </FilterSelect>

        {value.building && (
          <FilterSelect
            icon={MapPin}
            value={value.area}
            onChange={v => onChange({ area: v })}
            placeholder="Área"
            maxWidth={190}
          >
            {areas?.map(a => <option key={a.id} value={String(a.id)}>{a.name}</option>)}
          </FilterSelect>
        )}

        <FilterSelect
          icon={Layers}
          value={value.type}
          onChange={v => onChange({ type: v })}
          placeholder="Tipo de activo"
          maxWidth={200}
        >
          {assetTypes?.map(t => <option key={t.code} value={t.code}>{t.name}</option>)}
        </FilterSelect>

        <FilterSelect
          icon={CircleDot}
          value={value.status}
          onChange={v => onChange({ status: v })}
          placeholder="Estado"
          maxWidth={175}
        >
          {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </FilterSelect>

        <FilterSelect
          icon={CalendarDays}
          value={value.year}
          onChange={v => onChange({ year: v, month: '' })}
          placeholder="Año"
          maxWidth={120}
        >
          {YEAR_OPTIONS.map(y => <option key={y} value={y}>{y}</option>)}
        </FilterSelect>

        {value.year && (
          <FilterSelect
            icon={CalendarDays}
            value={value.month}
            onChange={v => onChange({ month: v })}
            placeholder="Mes"
            maxWidth={145}
          >
            {MONTH_OPTIONS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </FilterSelect>
        )}

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Contador + limpiar */}
        {activeChips.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <span style={{
              fontSize: 11,
              fontFamily: '"JetBrains Mono", monospace',
              background: 'rgba(217,171,68,0.10)',
              border: '1px solid rgba(217,171,68,0.22)',
              color: goldText,
              borderRadius: 20,
              padding: '2px 8px',
              fontWeight: 600,
            }}>
              {activeChips.length} {activeChips.length === 1 ? 'filtro' : 'filtros'}
            </span>
            <button
              onClick={clearAll}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                fontSize: 12, color: 'var(--tbl-text-sub)',
                background: 'none', border: 'none', cursor: 'pointer',
                padding: '2px 4px', whiteSpace: 'nowrap',
                transition: 'color 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = '#DC2626')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--tbl-text-sub)')}
            >
              <X size={12} /> Limpiar todo
            </button>
          </div>
        )}
      </div>

      {/* ── Fila 3: Chips activos ─────────────────────────────────────────── */}
      {activeChips.length > 0 && (
        <div style={{
          padding: '8px 14px',
          display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center',
          background: 'rgba(217,171,68,0.025)',
        }}>
          <span style={{
            fontSize: 10.5, color: 'var(--tbl-text-sub)',
            fontWeight: 600, letterSpacing: '0.08em',
            textTransform: 'uppercase', marginRight: 2,
            fontFamily: '"JetBrains Mono", monospace',
          }}>
            Filtrado por:
          </span>
          {activeChips.map(chip => (
            <ActiveChip
              key={chip.key}
              label={chip.label}
              onRemove={() => onChange({ [chip.key]: '' } as Partial<FilterFields>)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
