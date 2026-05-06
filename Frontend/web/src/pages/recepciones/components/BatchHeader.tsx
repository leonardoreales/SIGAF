import { Calendar, Building2, FileText, Hash } from 'lucide-react'
import { cn } from '../../../lib/utils'
import type { Building } from '../../../lib/api'

export interface BatchFields {
  orderNumber:  string
  buildingId:   string
  observations: string
  entryDate:    string
}

interface Props {
  fields:    BatchFields
  onChange:  (fields: BatchFields) => void
  buildings: Building[]
  errors:    Partial<Record<keyof BatchFields, string>>
}

const inputCls = `
  w-full rounded-lg px-3 py-2 text-sm outline-none transition-colors
  bg-white border text-gray-900 placeholder:text-gray-400
  focus:border-blue-400 focus:ring-1 focus:ring-blue-400/30
  dark:bg-mi-800 dark:border-mi-600/60 dark:text-mi-100 dark:placeholder:text-mi-500
  dark:focus:border-gold/60 dark:focus:ring-gold/20
`

const errorInputCls = `
  border-red-400 focus:border-red-400 focus:ring-red-400/20
  dark:border-red-500/70 dark:focus:border-red-500/70
`

function Field({
  icon: Icon, label, required, error, children,
}: {
  icon:      React.ElementType
  label:     string
  required?: boolean
  error?:    string
  children:  React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5 min-w-0">
      <label className="flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-mi-400 uppercase tracking-wide">
        <Icon size={11} className="shrink-0" />
        {label}
        {required && <span className="text-red-500 dark:text-red-400">*</span>}
      </label>
      {children}
      {error && (
        <p className="text-xs text-red-500 dark:text-red-400">{error}</p>
      )}
    </div>
  )
}

export default function BatchHeader({ fields, onChange, buildings, errors }: Props) {
  function set<K extends keyof BatchFields>(key: K, val: BatchFields[K]) {
    onChange({ ...fields, [key]: val })
  }

  return (
    <div className="
      rounded-xl border border-gray-200 bg-gray-50/60
      dark:bg-white/[0.02] dark:border-white/[0.07]
      p-4
    ">
      <p className="text-xs font-mono tracking-[0.18em] uppercase text-gray-400 dark:text-mi-600 mb-3">
        Datos del lote — se aplican a todos los ítems
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Orden de compra / Factura */}
        <Field icon={Hash} label="OC / Factura" required error={errors.orderNumber}>
          <input
            type="text"
            value={fields.orderNumber}
            onChange={e => set('orderNumber', e.target.value)}
            placeholder="OC 26-1933"
            className={cn(inputCls, errors.orderNumber && errorInputCls)}
          />
        </Field>

        {/* Edificio */}
        <Field icon={Building2} label="Edificio" required error={errors.buildingId}>
          <select
            value={fields.buildingId}
            onChange={e => set('buildingId', e.target.value)}
            className={cn(inputCls, 'cursor-pointer', errors.buildingId && errorInputCls)}
          >
            <option value="">Seleccionar edificio…</option>
            {buildings.map(b => (
              <option key={b.id} value={String(b.id)}>{b.name}</option>
            ))}
          </select>
        </Field>

        {/* Fecha de ingreso */}
        <Field icon={Calendar} label="Fecha ingreso">
          <input
            type="datetime-local"
            value={fields.entryDate}
            onChange={e => set('entryDate', e.target.value)}
            className={cn(inputCls)}
          />
        </Field>

        {/* Observaciones */}
        <Field icon={FileText} label="Observaciones">
          <input
            type="text"
            value={fields.observations}
            onChange={e => set('observations', e.target.value)}
            placeholder="Contexto de la compra (opcional)"
            className={cn(inputCls)}
          />
        </Field>

      </div>
    </div>
  )
}
