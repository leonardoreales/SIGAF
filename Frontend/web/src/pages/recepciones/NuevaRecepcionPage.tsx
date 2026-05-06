import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, Send, Loader2, CheckCircle2 } from 'lucide-react'
import { apiCatalogs } from '../../lib/api'
import { cn } from '../../lib/utils'
import BatchHeader, { type BatchFields } from './components/BatchHeader'
import ReceptionGrid, { makeEmptyRow, validateRow, type GridRow } from './components/ReceptionGrid'

// ── Default batch fields ──────────────────────────────────────────────────────

function nowLocal(): string {
  const d = new Date()
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 16)
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function NuevaRecepcionPage() {
  const navigate = useNavigate()

  const [batch, setBatch] = useState<BatchFields>({
    orderNumber:  '',
    buildingId:   '',
    observations: '',
    entryDate:    nowLocal(),
  })
  const [rows, setRows]       = useState<GridRow[]>([makeEmptyRow()])
  const [submitted, setSubmitted] = useState(false)
  const [sending,   setSending]   = useState(false)
  const [sent,      setSent]      = useState(false)

  // ── Catalogs ────────────────────────────────────────────────────────────────

  const { data: buildings  = [] } = useQuery({ queryKey: ['catalog', 'buildings'],   queryFn: apiCatalogs.buildings,  staleTime: Infinity })
  const { data: assetTypes = [] } = useQuery({ queryKey: ['catalog', 'asset-types'], queryFn: apiCatalogs.assetTypes, staleTime: Infinity })
  const { data: areas      = [] } = useQuery({ queryKey: ['catalog', 'areas'],       queryFn: apiCatalogs.areas,      staleTime: Infinity })

  // ── Validation ──────────────────────────────────────────────────────────────

  const batchErrors: Partial<Record<keyof BatchFields, string>> = {}
  if (submitted) {
    if (!batch.orderNumber.trim()) batchErrors.orderNumber = 'Requerido'
    if (!batch.buildingId)         batchErrors.buildingId  = 'Requerido'
  }

  const rowErrors    = rows.map(validateRow)
  const hasRowErrors = rowErrors.some(e => e.length > 0)
  const hasBatchErr  = Object.keys(batchErrors).length > 0
  const isValid      = !hasBatchErr && !hasRowErrors

  // Summary
  const totalItems = rows.reduce((s, r) => s + (r.quantity || 1), 0)
  const totalValue = rows.reduce((s, r) => {
    const v   = parseFloat(r.unitValue) || 0
    const sub = r.quantity * v
    return s + (r.hasIva ? sub * 1.19 : sub)
  }, 0)

  // ── Submit (stub — UI only) ─────────────────────────────────────────────────

  async function handleSubmit() {
    setSubmitted(true)
    if (!isValid) return

    setSending(true)
    await new Promise(r => setTimeout(r, 1200))   // simulate API call
    setSending(false)
    setSent(true)
  }

  // ── Sent state ──────────────────────────────────────────────────────────────

  if (sent) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-24 text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center">
          <CheckCircle2 size={32} className="text-emerald-500" />
        </div>
        <div>
          <h2 className="text-xl font-syne font-bold text-gray-900 dark:text-mi-50">
            Recepción enviada
          </h2>
          <p className="text-sm text-gray-500 dark:text-mi-400 mt-1">
            {totalItems} activo{totalItems !== 1 ? 's' : ''} enviados al equipo de Activos Fijos para revisión.
          </p>
        </div>
        <button
          onClick={() => navigate('/recepciones')}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-gray-900 dark:bg-mi-100 text-white dark:text-mi-900 hover:opacity-90 transition-opacity"
        >
          Volver a Recepciones
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-5">

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/recepciones')}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:text-mi-500 dark:hover:text-mi-200 dark:hover:bg-white/[0.05] transition-colors"
        >
          <ChevronLeft size={16} />
        </button>
        <div>
          <nav className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-mi-600 mb-0.5">
            <button
              onClick={() => navigate('/recepciones')}
              className="hover:text-gray-600 dark:hover:text-mi-400 transition-colors"
            >
              Recepciones
            </button>
            <span>/</span>
            <span className="text-gray-600 dark:text-mi-300">Nueva</span>
          </nav>
          <h1 className="text-xl font-syne font-bold text-gray-900 dark:text-mi-50">
            Nueva Recepción de Activos
          </h1>
        </div>
      </div>

      {/* ── Batch header ────────────────────────────────────────────── */}
      <BatchHeader
        fields={batch}
        onChange={setBatch}
        buildings={buildings}
        errors={batchErrors}
      />

      {/* ── Grid label ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-gray-700 dark:text-mi-200">
            Ítems de la recepción
          </h2>
          <p className="text-xs text-gray-400 dark:text-mi-500 mt-0.5">
            Ingresa cada activo. El serial se adapta según el tipo seleccionado.
          </p>
        </div>

        {/* Row error summary */}
        {submitted && hasRowErrors && (
          <p className="text-xs text-red-500 dark:text-red-400 shrink-0">
            {rowErrors.filter(e => e.length > 0).length} fila{rowErrors.filter(e => e.length > 0).length !== 1 ? 's' : ''} con errores
          </p>
        )}
      </div>

      {/* ── Grid ────────────────────────────────────────────────────── */}
      <ReceptionGrid
        rows={rows}
        onChange={setRows}
        assetTypes={assetTypes}
        areas={areas}
        submitted={submitted}
      />

      {/* ── Footer: summary + actions ────────────────────────────────── */}
      <div className={cn(
        'flex items-center justify-between gap-4 px-4 py-3 rounded-xl',
        'border border-gray-200 dark:border-white/[0.07]',
        'bg-gray-50/60 dark:bg-white/[0.02]',
      )}>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-gray-500 dark:text-mi-400">
            <span className="font-semibold text-gray-900 dark:text-mi-100">{totalItems}</span>
            {' '}ítem{totalItems !== 1 ? 's' : ''}
          </span>
          {totalValue > 0 && (
            <span className="text-gray-500 dark:text-mi-400">
              Valor total{' '}
              <span className="font-semibold text-gray-900 dark:text-mi-100 font-mono">
                {totalValue.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })}
              </span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => navigate('/recepciones')}
            className="px-4 py-2 text-sm font-medium rounded-lg text-gray-600 hover:bg-gray-100 dark:text-mi-300 dark:hover:bg-white/[0.05] transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={sending}
            className="
              flex items-center gap-2 px-5 py-2 text-sm font-medium rounded-lg transition-colors
              bg-blue-600 hover:bg-blue-700 text-white
              dark:bg-mi-600 dark:hover:bg-mi-500 dark:text-mi-50
              disabled:opacity-60 disabled:cursor-not-allowed
            "
          >
            {sending ? (
              <><Loader2 size={15} className="animate-spin" /> Enviando…</>
            ) : (
              <><Send size={14} /> Enviar a Activos Fijos</>
            )}
          </button>
        </div>
      </div>

    </div>
  )
}
