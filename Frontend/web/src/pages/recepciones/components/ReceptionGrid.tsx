import { useState, useRef, useCallback, useEffect } from 'react'
import { Plus, Trash2, AlertCircle, CheckCircle2, Lock } from 'lucide-react'
import { cn } from '../../../lib/utils'
import { ASSET_TYPE_SERIAL_RULES } from '@sigaf/shared'
import type { SerialRule } from '@sigaf/shared'
import type { AssetType, Area } from '../../../lib/api'
import SearchableSelect from './SearchableSelect'
import QuantityModal from './QuantityModal'
import type { ExpansionMode } from './QuantityModal'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface GridRow {
  id:            string
  name:          string
  assetTypeCode: string
  brand:         string
  model:         string
  quantity:      number
  serial:        string
  areaId:        string
  unitValue:     string
  hasIva:        boolean
  /** visual hint: this row was cloned from a batch expansion */
  isClone?:      boolean
  /** parent row id when cloned */
  cloneGroupId?: string
}

type ColKey = 'name' | 'assetTypeCode' | 'brand' | 'model' | 'quantity' | 'serial' | 'areaId' | 'unitValue'

const COL_ORDER: ColKey[] = ['name', 'assetTypeCode', 'brand', 'model', 'quantity', 'serial', 'areaId', 'unitValue']

interface CellId { rowId: string; col: ColKey }

// ── Helpers ───────────────────────────────────────────────────────────────────

let _id = 0
export function makeEmptyRow(overrides: Partial<GridRow> = {}): GridRow {
  return {
    id: `row-${++_id}-${Date.now()}`,
    name: '', assetTypeCode: '', brand: 'N/A', model: 'N/A',
    quantity: 1, serial: '', areaId: '', unitValue: '',
    hasIva: false, ...overrides,
  }
}

function getSerialRule(assetTypeCode: string): SerialRule {
  return (ASSET_TYPE_SERIAL_RULES[assetTypeCode] as SerialRule) ?? 'optional'
}

function calcSubtotal(row: GridRow): number {
  const v = parseFloat(row.unitValue.replace(/[^0-9.]/g, '')) || 0
  const sub = row.quantity * v
  return row.hasIva ? sub * 1.19 : sub
}

function fmtCOP(n: number) {
  if (!n) return '—'
  return n.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })
}

// ── Validation per row ────────────────────────────────────────────────────────

export function validateRow(row: GridRow): string[] {
  const errs: string[] = []
  if (!row.name.trim())          errs.push('Nombre requerido')
  if (!row.assetTypeCode)        errs.push('Tipo requerido')
  if (!row.areaId)               errs.push('Área requerida')
  if (!row.unitValue || parseFloat(row.unitValue) <= 0) errs.push('Valor inválido')
  const rule = getSerialRule(row.assetTypeCode)
  if (rule === 'required' && (!row.serial.trim() || row.serial.trim() === 'N/A')) {
    errs.push('Serial requerido para este tipo')
  }
  return errs
}

// ── Cell input classes ────────────────────────────────────────────────────────

const cellInputCls = `
  w-full h-full rounded px-2 py-1.5 text-sm outline-none transition-colors
  bg-white border border-blue-400 ring-1 ring-blue-400/20 text-gray-900
  dark:bg-mi-750 dark:border-gold/60 dark:ring-gold/10 dark:text-mi-100
  placeholder:text-gray-300 dark:placeholder:text-mi-600
`

// ── Confirmation toast for 11-50 ──────────────────────────────────────────────

interface ExpandToastProps {
  qty:      number
  onYes:    () => void
  onNo:     () => void
}

function ExpandToast({ qty, onYes, onNo }: ExpandToastProps) {
  return (
    <div className="absolute z-40 top-0 left-1/2 -translate-x-1/2 mt-2 flex items-center gap-3 rounded-xl border border-amber-300 dark:border-amber-700/60 bg-amber-50 dark:bg-amber-950/60 px-4 py-2.5 shadow-lg text-sm">
      <AlertCircle size={14} className="shrink-0 text-amber-500" />
      <span className="text-amber-800 dark:text-amber-300">
        ¿Expandir <strong>{qty}</strong> filas para ingresar seriales?
      </span>
      <button onClick={onYes} className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-medium text-xs transition-colors">Sí</button>
      <button onClick={onNo}  className="px-2.5 py-1 rounded-lg bg-gray-200 dark:bg-mi-700 hover:bg-gray-300 dark:hover:bg-mi-600 text-gray-700 dark:text-mi-200 text-xs transition-colors">No</button>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  rows:       GridRow[]
  onChange:   (rows: GridRow[]) => void
  assetTypes: AssetType[]
  areas:      Area[]
  submitted:  boolean
}

export default function ReceptionGrid({ rows, onChange, assetTypes, areas, submitted }: Props) {
  const [focused,      setFocused]      = useState<CellId | null>(null)
  const [expandToast,  setExpandToast]  = useState<{ rowId: string; qty: number } | null>(null)
  const [expandModal,  setExpandModal]  = useState<{ rowId: string; qty: number } | null>(null)

  const tbodyRef = useRef<HTMLTableSectionElement>(null)

  const areaOptions = areas.map(a => ({ value: String(a.id), label: a.name }))

  // ── Row helpers ─────────────────────────────────────────────────────────────

  function updateRow(id: string, patch: Partial<GridRow>) {
    onChange(rows.map(r => r.id === id ? { ...r, ...patch } : r))
  }

  function deleteRow(id: string) {
    const next = rows.filter(r => r.id !== id)
    onChange(next.length ? next : [makeEmptyRow()])
  }

  function addRow(afterId?: string) {
    const idx  = afterId ? rows.findIndex(r => r.id === afterId) : rows.length - 1
    const next = [...rows]
    const newRow = makeEmptyRow()
    next.splice(idx + 1, 0, newRow)
    onChange(next)
    return newRow.id
  }

  // ── Focus management ────────────────────────────────────────────────────────

  function focusCell(rowId: string, col: ColKey) {
    setFocused({ rowId, col })
  }

  function moveFocus(rowId: string, col: ColKey, dir: 1 | -1) {
    const colIdx = COL_ORDER.indexOf(col)
    const rowIdx = rows.findIndex(r => r.id === rowId)

    const nextColIdx = colIdx + dir
    if (nextColIdx >= 0 && nextColIdx < COL_ORDER.length) {
      focusCell(rowId, COL_ORDER[nextColIdx])
      return
    }
    // Wrap to next/prev row
    const nextRowIdx = rowIdx + (dir > 0 ? 1 : -1)
    if (nextRowIdx >= 0 && nextRowIdx < rows.length) {
      focusCell(rows[nextRowIdx].id, dir > 0 ? COL_ORDER[0] : COL_ORDER[COL_ORDER.length - 1])
      return
    }
    // Tab past last cell of last row → add new row
    if (dir > 0 && rowIdx === rows.length - 1 && colIdx === COL_ORDER.length - 1) {
      const newId = addRow(rowId)
      setTimeout(() => focusCell(newId, COL_ORDER[0]), 0)
    }
  }

  function handleCellKeyDown(e: React.KeyboardEvent, rowId: string, col: ColKey) {
    if (e.key === 'Tab') {
      e.preventDefault()
      moveFocus(rowId, col, e.shiftKey ? -1 : 1)
    }
    if (e.key === 'Enter') {
      e.preventDefault()
      if (col === 'unitValue') {
        const newId = addRow(rowId)
        setTimeout(() => focusCell(newId, 'name'), 0)
      } else {
        moveFocus(rowId, col, 1)
      }
    }
    if (e.key === 'Escape') setFocused(null)
  }

  // ── Quantity expansion ──────────────────────────────────────────────────────

  function handleQuantityChange(rowId: string, qty: number) {
    const row = rows.find(r => r.id === rowId)
    if (!row) return

    updateRow(rowId, { quantity: qty })

    const rule = getSerialRule(row.assetTypeCode)
    if (rule !== 'required' || qty <= 1) return

    if (qty <= 10) {
      expandRows(rowId, qty, 'manual')
    } else if (qty <= 50) {
      setExpandToast({ rowId, qty })
    } else {
      setExpandModal({ rowId, qty })
    }
  }

  function expandRows(rowId: string, qty: number, mode: ExpansionMode, prefix?: string) {
    const row = rows.find(r => r.id === rowId)
    if (!row) return

    // Remove any existing clones from a previous expansion of this row
    const cleaned = rows.filter(r => r.cloneGroupId !== rowId)
    const idx     = cleaned.findIndex(r => r.id === rowId)

    // Update original row: qty=1
    const origin: GridRow = {
      ...row, quantity: 1,
      serial: mode === 'sequential' ? `${prefix}-001` : '',
      cloneGroupId: undefined,
      isClone: false,
    }
    cleaned[idx] = origin

    // Insert clones after original
    const clones: GridRow[] = Array.from({ length: qty - 1 }, (_, i) => makeEmptyRow({
      name:          row.name,
      assetTypeCode: row.assetTypeCode,
      brand:         row.brand,
      model:         row.model,
      quantity:      1,
      areaId:        row.areaId,
      unitValue:     row.unitValue,
      hasIva:        row.hasIva,
      serial:        mode === 'na'         ? 'N/A' :
                     mode === 'sequential' ? `${prefix}-${String(i + 2).padStart(3, '0')}` :
                                             '',
      isClone:      true,
      cloneGroupId: rowId,
    }))

    const next = [...cleaned.slice(0, idx + 1), ...clones, ...cleaned.slice(idx + 1)]
    onChange(next)

    // Focus serial of first clone (manual mode)
    if (mode === 'manual') {
      setTimeout(() => focusCell(origin.id, 'serial'), 0)
    }
  }

  function handleToastYes() {
    if (!expandToast) return
    expandRows(expandToast.rowId, expandToast.qty, 'manual')
    setExpandToast(null)
  }

  function handleModalConfirm(mode: ExpansionMode, prefix?: string) {
    if (!expandModal) return
    expandRows(expandModal.rowId, expandModal.qty, mode, prefix)
    setExpandModal(null)
  }

  // ── Type change side-effects ─────────────────────────────────────────────────

  function handleTypeChange(rowId: string, code: string) {
    const rule = getSerialRule(code)
    const serial = rule === 'disabled' ? 'N/A' : ''
    updateRow(rowId, { assetTypeCode: code, serial })
  }

  // ── Auto-focus on mount for first cell ──────────────────────────────────────

  useEffect(() => {
    if (rows.length === 1 && !rows[0].name) {
      focusCell(rows[0].id, 'name')
    }
  }, [])

  // ── Render helpers ───────────────────────────────────────────────────────────

  function isFocused(rowId: string, col: ColKey) {
    return focused?.rowId === rowId && focused?.col === col
  }

  function SerialCell({ row }: { row: GridRow }) {
    const rule = getSerialRule(row.assetTypeCode)
    const active = isFocused(row.id, 'serial')
    const errs = submitted ? validateRow(row) : []
    const hasSerialErr = errs.some(e => e.includes('Serial'))

    if (rule === 'disabled') {
      return (
        <td className="px-2 py-1.5">
          <div className="flex items-center gap-1.5 px-2 py-1.5 rounded bg-gray-50 dark:bg-mi-900/40">
            <Lock size={10} className="shrink-0 text-gray-300 dark:text-mi-600" />
            <span className="text-xs font-mono text-gray-300 dark:text-mi-600">N/A</span>
          </div>
        </td>
      )
    }

    return (
      <td
        className="px-2 py-1.5 min-w-[120px]"
        onClick={() => focusCell(row.id, 'serial')}
      >
        {active ? (
          <input
            autoFocus
            value={row.serial}
            onChange={e => updateRow(row.id, { serial: e.target.value })}
            onKeyDown={e => handleCellKeyDown(e, row.id, 'serial')}
            onBlur={() => setFocused(null)}
            placeholder={rule === 'required' ? 'Requerido…' : 'N/A o serial…'}
            className={cn(cellInputCls, rule === 'required' && 'placeholder:text-red-300 dark:placeholder:text-red-700')}
          />
        ) : (
          <div className={cn(
            'flex items-center gap-1.5 px-2 py-1.5 rounded cursor-text',
            'hover:bg-gray-50 dark:hover:bg-mi-700/30',
            hasSerialErr && 'bg-red-50 dark:bg-red-950/20 ring-1 ring-red-300 dark:ring-red-700/50 rounded',
          )}>
            {row.serial
              ? <CheckCircle2 size={11} className="shrink-0 text-emerald-500" />
              : rule === 'required'
              ? <AlertCircle  size={11} className="shrink-0 text-amber-400" />
              : null
            }
            <span className={cn(
              'text-sm font-mono truncate',
              !row.serial         ? 'text-gray-300 dark:text-mi-600 italic' :
              row.serial === 'N/A' ? 'text-gray-400 dark:text-mi-500' :
                                    'text-gray-700 dark:text-mi-200',
            )}>
              {row.serial || (rule === 'required' ? '— requerido' : 'N/A')}
            </span>
          </div>
        )}
      </td>
    )
  }

  function TextCell({ row, col, placeholder }: { row: GridRow; col: ColKey; placeholder?: string }) {
    const active = isFocused(row.id, col)
    const value  = String(row[col as keyof GridRow] ?? '')

    return (
      <td
        className="px-2 py-1.5"
        onClick={() => focusCell(row.id, col)}
      >
        {active ? (
          <input
            autoFocus
            value={value}
            onChange={e => updateRow(row.id, { [col]: e.target.value })}
            onKeyDown={e => handleCellKeyDown(e, row.id, col)}
            onBlur={() => setFocused(null)}
            placeholder={placeholder}
            className={cellInputCls}
          />
        ) : (
          <div className={cn(
            'px-2 py-1.5 rounded cursor-text text-sm truncate',
            'hover:bg-gray-50 dark:hover:bg-mi-700/30',
            !value || value === 'N/A'
              ? 'text-gray-300 dark:text-mi-600'
              : 'text-gray-800 dark:text-mi-100',
          )}>
            {value || <span className="italic">{placeholder}</span>}
          </div>
        )}
      </td>
    )
  }

  const totalItems = rows.reduce((s, r) => s + (r.quantity || 1), 0)
  const totalValue = rows.reduce((s, r) => s + calcSubtotal(r), 0)

  return (
    <div className="flex flex-col gap-0">

      {/* Expand toast */}
      {expandToast && (
        <div className="relative">
          <ExpandToast
            qty={expandToast.qty}
            onYes={handleToastYes}
            onNo={() => setExpandToast(null)}
          />
        </div>
      )}

      {/* Table wrapper */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-white/[0.07] bg-white dark:bg-white/[0.01]">
        <table className="w-full text-sm border-collapse min-w-[900px]">

          {/* Header */}
          <thead>
            <tr className="border-b border-gray-100 dark:border-white/[0.06]">
              <th className="w-9 px-2 py-2.5 text-center font-mono text-[10px] text-gray-400 dark:text-mi-600 font-normal">#</th>
              <th className="px-2 py-2.5 text-left font-mono text-[10px] text-gray-400 dark:text-mi-600 font-normal uppercase tracking-wider min-w-[220px]">Nombre Activo *</th>
              <th className="px-2 py-2.5 text-left font-mono text-[10px] text-gray-400 dark:text-mi-600 font-normal uppercase tracking-wider w-[160px]">Tipo *</th>
              <th className="px-2 py-2.5 text-left font-mono text-[10px] text-gray-400 dark:text-mi-600 font-normal uppercase tracking-wider w-[90px]">Marca</th>
              <th className="px-2 py-2.5 text-left font-mono text-[10px] text-gray-400 dark:text-mi-600 font-normal uppercase tracking-wider w-[90px]">Modelo</th>
              <th className="px-2 py-2.5 text-center font-mono text-[10px] text-gray-400 dark:text-mi-600 font-normal uppercase tracking-wider w-[60px]">Cant</th>
              <th className="px-2 py-2.5 text-left font-mono text-[10px] text-gray-400 dark:text-mi-600 font-normal uppercase tracking-wider w-[140px]">Serial</th>
              <th className="px-2 py-2.5 text-left font-mono text-[10px] text-gray-400 dark:text-mi-600 font-normal uppercase tracking-wider w-[170px]">Área *</th>
              <th className="px-2 py-2.5 text-right font-mono text-[10px] text-gray-400 dark:text-mi-600 font-normal uppercase tracking-wider w-[110px]">Valor unit *</th>
              <th className="px-2 py-2.5 text-center font-mono text-[10px] text-gray-400 dark:text-mi-600 font-normal uppercase tracking-wider w-[44px]">IVA</th>
              <th className="px-2 py-2.5 text-right font-mono text-[10px] text-gray-400 dark:text-mi-600 font-normal uppercase tracking-wider w-[110px]">V. Ref.</th>
              <th className="w-9" />
            </tr>
          </thead>

          <tbody ref={tbodyRef}>
            {rows.map((row, idx) => {
              const rule    = getSerialRule(row.assetTypeCode)
              const errs    = submitted ? validateRow(row) : []
              const hasErr  = errs.length > 0
              const subtotal = calcSubtotal(row)

              return (
                <tr
                  key={row.id}
                  className={cn(
                    'group border-b border-gray-50 dark:border-white/[0.03] transition-colors',
                    row.isClone
                      ? 'bg-blue-50/30 dark:bg-blue-950/10'
                      : 'hover:bg-gray-50/50 dark:hover:bg-white/[0.02]',
                    hasErr && 'bg-red-50/40 dark:bg-red-950/10',
                  )}
                >
                  {/* Row number */}
                  <td className="px-2 py-1.5 text-center">
                    <span className={cn(
                      'text-xs font-mono',
                      row.isClone
                        ? 'text-blue-400 dark:text-blue-500'
                        : 'text-gray-300 dark:text-mi-700',
                    )}>
                      {idx + 1}
                    </span>
                  </td>

                  {/* NOMBRE ACTIVO */}
                  <td
                    className="px-2 py-1.5 min-w-[220px]"
                    onClick={() => focusCell(row.id, 'name')}
                  >
                    {isFocused(row.id, 'name') ? (
                      <input
                        autoFocus
                        value={row.name}
                        onChange={e => updateRow(row.id, { name: e.target.value })}
                        onKeyDown={e => handleCellKeyDown(e, row.id, 'name')}
                        onBlur={() => setFocused(null)}
                        placeholder="Nombre del activo…"
                        className={cn(cellInputCls, 'min-w-[200px]')}
                      />
                    ) : (
                      <div className={cn(
                        'px-2 py-1.5 rounded cursor-text text-sm',
                        'hover:bg-gray-50 dark:hover:bg-mi-700/30',
                        !row.name
                          ? 'text-gray-300 dark:text-mi-600 italic'
                          : 'text-gray-900 dark:text-mi-100 font-medium',
                        submitted && !row.name.trim() && 'ring-1 ring-red-300 dark:ring-red-700/50 bg-red-50/40 dark:bg-red-950/10',
                      )}>
                        {row.name || 'Nombre del activo…'}
                      </div>
                    )}
                  </td>

                  {/* TIPO */}
                  <td className="px-2 py-1.5 w-[160px]" onClick={() => focusCell(row.id, 'assetTypeCode')}>
                    {isFocused(row.id, 'assetTypeCode') ? (
                      <select
                        autoFocus
                        value={row.assetTypeCode}
                        onChange={e => { handleTypeChange(row.id, e.target.value); setFocused(null) }}
                        onKeyDown={e => handleCellKeyDown(e, row.id, 'assetTypeCode')}
                        onBlur={() => setFocused(null)}
                        className={cn(cellInputCls, 'cursor-pointer')}
                      >
                        <option value="">Seleccionar…</option>
                        {assetTypes.map(t => (
                          <option key={t.code} value={t.code}>{t.name}</option>
                        ))}
                      </select>
                    ) : (
                      <div className={cn(
                        'px-2 py-1.5 rounded cursor-pointer text-sm truncate',
                        'hover:bg-gray-50 dark:hover:bg-mi-700/30',
                        !row.assetTypeCode
                          ? 'text-gray-300 dark:text-mi-600 italic'
                          : 'text-gray-800 dark:text-mi-200',
                        submitted && !row.assetTypeCode && 'ring-1 ring-red-300 dark:ring-red-700/50',
                      )}>
                        {row.assetTypeCode
                          ? assetTypes.find(t => t.code === row.assetTypeCode)?.name ?? row.assetTypeCode
                          : 'Seleccionar…'
                        }
                      </div>
                    )}
                  </td>

                  {/* MARCA */}
                  <TextCell row={row} col="brand" placeholder="N/A" />

                  {/* MODELO */}
                  <TextCell row={row} col="model" placeholder="N/A" />

                  {/* CANTIDAD */}
                  <td className="px-2 py-1.5 w-[60px] text-center" onClick={() => focusCell(row.id, 'quantity')}>
                    {isFocused(row.id, 'quantity') ? (
                      <input
                        autoFocus
                        type="number"
                        min={1}
                        max={999}
                        value={row.quantity}
                        onChange={e => {
                          const v = Math.max(1, Math.min(999, parseInt(e.target.value) || 1))
                          updateRow(row.id, { quantity: v })
                        }}
                        onBlur={e => {
                          setFocused(null)
                          const v = parseInt(e.target.value) || 1
                          if (v !== row.quantity) handleQuantityChange(row.id, v)
                          else handleQuantityChange(row.id, row.quantity)
                        }}
                        onKeyDown={e => {
                          if (e.key === 'Enter' || e.key === 'Tab') {
                            e.preventDefault()
                            const v = parseInt((e.target as HTMLInputElement).value) || 1
                            handleQuantityChange(row.id, v)
                            moveFocus(row.id, 'quantity', e.shiftKey ? -1 : 1)
                          } else {
                            handleCellKeyDown(e, row.id, 'quantity')
                          }
                        }}
                        className={cn(cellInputCls, 'text-center')}
                      />
                    ) : (
                      <div className={cn(
                        'px-2 py-1.5 rounded cursor-text text-sm font-mono text-center',
                        'hover:bg-gray-50 dark:hover:bg-mi-700/30',
                        rule === 'disabled' && row.quantity > 1
                          ? 'text-blue-600 dark:text-blue-400 font-semibold'
                          : 'text-gray-700 dark:text-mi-200',
                      )}>
                        {row.quantity}
                        {rule === 'disabled' && row.quantity > 1 && (
                          <span className="ml-1 text-[9px] text-blue-400 dark:text-blue-500">×</span>
                        )}
                      </div>
                    )}
                  </td>

                  {/* SERIAL */}
                  <SerialCell row={row} />

                  {/* ÁREA */}
                  <td className="px-2 py-1.5 w-[170px]">
                    <SearchableSelect
                      options={areaOptions}
                      value={row.areaId}
                      onChange={v => updateRow(row.id, { areaId: v })}
                      placeholder="Área…"
                      onKeyDown={e => {
                        if (e.key === 'Tab') moveFocus(row.id, 'areaId', e.shiftKey ? -1 : 1)
                      }}
                    />
                  </td>

                  {/* VALOR UNITARIO */}
                  <td className="px-2 py-1.5 w-[110px] text-right" onClick={() => focusCell(row.id, 'unitValue')}>
                    {isFocused(row.id, 'unitValue') ? (
                      <input
                        autoFocus
                        type="number"
                        min={0}
                        value={row.unitValue}
                        onChange={e => updateRow(row.id, { unitValue: e.target.value })}
                        onKeyDown={e => handleCellKeyDown(e, row.id, 'unitValue')}
                        onBlur={() => setFocused(null)}
                        placeholder="0"
                        className={cn(cellInputCls, 'text-right')}
                      />
                    ) : (
                      <div className={cn(
                        'px-2 py-1.5 rounded cursor-text text-sm font-mono text-right',
                        'hover:bg-gray-50 dark:hover:bg-mi-700/30',
                        !row.unitValue
                          ? 'text-gray-300 dark:text-mi-600'
                          : 'text-gray-800 dark:text-mi-100',
                        submitted && (!row.unitValue || parseFloat(row.unitValue) <= 0) && 'ring-1 ring-red-300 dark:ring-red-700/50',
                      )}>
                        {row.unitValue
                          ? `$${parseInt(row.unitValue).toLocaleString('es-CO')}`
                          : '—'
                        }
                      </div>
                    )}
                  </td>

                  {/* IVA checkbox */}
                  <td className="px-2 py-1.5 text-center w-[44px]">
                    <label className="flex items-center justify-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={row.hasIva}
                        onChange={e => updateRow(row.id, { hasIva: e.target.checked })}
                        className="w-3.5 h-3.5 rounded accent-blue-500 dark:accent-gold cursor-pointer"
                      />
                    </label>
                  </td>

                  {/* VALOR REFERENCIA (auto) */}
                  <td className="px-3 py-1.5 text-right w-[110px]">
                    <span className={cn(
                      'text-sm font-mono',
                      subtotal > 0
                        ? 'text-gray-700 dark:text-mi-200'
                        : 'text-gray-300 dark:text-mi-700',
                    )}>
                      {fmtCOP(subtotal)}
                    </span>
                  </td>

                  {/* Delete */}
                  <td className="px-1 py-1.5 text-center w-9">
                    <button
                      type="button"
                      onClick={() => deleteRow(row.id)}
                      className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-lg flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 dark:text-mi-700 dark:hover:text-red-400 dark:hover:bg-red-950/20 transition-all"
                    >
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Footer: add row + totals */}
      <div className="flex items-center justify-between gap-4 pt-2 px-1">
        <button
          type="button"
          onClick={() => {
            const id = addRow()
            setTimeout(() => focusCell(id, 'name'), 0)
          }}
          className="
            flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors
            text-gray-500 hover:text-gray-900 hover:bg-gray-100
            dark:text-mi-500 dark:hover:text-mi-200 dark:hover:bg-white/[0.05]
          "
        >
          <Plus size={13} />
          Agregar fila  <span className="font-mono text-[10px] text-gray-300 dark:text-mi-700 ml-0.5">↵ Enter</span>
        </button>

        <div className="flex items-center gap-4 text-xs font-mono text-gray-500 dark:text-mi-400">
          <span>
            <span className="text-gray-900 dark:text-mi-100 font-semibold">{totalItems}</span>
            {' '}ítem{totalItems !== 1 ? 's' : ''}
          </span>
          {totalValue > 0 && (
            <span>
              Total{' '}
              <span className="text-gray-900 dark:text-mi-100 font-semibold">
                {fmtCOP(totalValue)}
              </span>
            </span>
          )}
        </div>
      </div>

      {/* Keyboard hint */}
      <p className="text-[10px] text-gray-300 dark:text-mi-700 font-mono px-1">
        Tab — siguiente celda &nbsp;·&nbsp; Enter — nueva fila &nbsp;·&nbsp; Esc — cancelar edición
      </p>

      {/* Quantity expansion modal */}
      {expandModal && (() => {
        const row = rows.find(r => r.id === expandModal.rowId)
        if (!row) return null
        const rule = getSerialRule(row.assetTypeCode)
        return (
          <QuantityModal
            itemName={row.name || 'Activo'}
            quantity={expandModal.qty}
            serialRequired={rule === 'required'}
            onConfirm={(mode, prefix) => handleModalConfirm(mode, prefix)}
            onCancel={() => setExpandModal(null)}
          />
        )
      })()}

    </div>
  )
}
