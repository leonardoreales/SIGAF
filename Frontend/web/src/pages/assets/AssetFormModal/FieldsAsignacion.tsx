import type { Person } from '../../../lib/api'
import type { AssetFormValues, ChangeField } from './useAssetForm'

const LBL = 'block text-xs font-medium mb-1 text-gray-600 dark:text-mi-400'
const INP = [
  'w-full px-3 py-2 text-sm border rounded-lg transition-colors',
  'bg-white border-gray-300 text-gray-900 placeholder-gray-400',
  'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
  'dark:bg-mi-750 dark:border-mi-600 dark:text-mi-100 dark:placeholder-mi-500',
  'dark:focus:ring-mi-400 dark:focus:border-transparent',
].join(' ')

const STATUS_OPTIONS = [
  { value: 'ACTIVO',           label: 'Activo' },
  { value: 'BAJA',             label: 'Baja' },
  { value: 'EN_TRASLADO',      label: 'En traslado' },
  { value: 'EN_MANTENIMIENTO', label: 'En mantenimiento' },
  { value: 'DADO_DE_BAJA',     label: 'Dado de baja' },
]

const MAINTENANCE_AREA_OPTIONS = [
  { value: 'INFRAESTRUCTURA', label: 'Infraestructura Física' },
  { value: 'SISTEMAS',        label: 'Sistemas de Información' },
  { value: 'TRANSPORTE',      label: 'Transporte' },
  { value: 'ACTIVOS_FIJOS',   label: 'Activos Fijos' },
]

const CRITICALITY_OPTIONS = [
  { value: 'ALTO',  label: 'Alto' },
  { value: 'MEDIO', label: 'Medio' },
  { value: 'BAJO',  label: 'Bajo' },
]

interface Props {
  values:   AssetFormValues
  onChange: ChangeField
  people:   Person[]
}

const CRITICALITY_BADGE: Record<string, string> = {
  ALTO:  'text-red-600 dark:text-red-400',
  MEDIO: 'text-amber-600 dark:text-amber-400',
  BAJO:  'text-green-600 dark:text-green-400',
}

export default function FieldsAsignacion({ values, onChange, people }: Props) {
  return (
    <section>
      <h3 className="text-sm font-semibold mb-4 flex items-center gap-2 text-gray-800 dark:text-mi-100">
        <span className="w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold select-none bg-blue-100 text-blue-700 dark:bg-mi-700 dark:text-gold">
          3
        </span>
        Asignación y estado
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        <div>
          <label className={LBL}>Persona responsable</label>
          <select
            value={values.personId}
            onChange={e => onChange('personId', e.target.value)}
            className={INP}
          >
            <option value="">Sin asignar</option>
            {people.map(p => (
              <option key={p.id} value={String(p.id)}>{p.fullName}</option>
            ))}
          </select>
        </div>

        <div>
          <label className={LBL}>Responsable (texto libre)</label>
          <input
            type="text"
            value={values.responsableRaw}
            onChange={e => onChange('responsableRaw', e.target.value)}
            maxLength={300}
            placeholder="Nombre como figura en el acta"
            className={INP}
          />
        </div>

        <div>
          <label className={LBL}>Estado <span className="text-red-500">*</span></label>
          <select
            value={values.status}
            onChange={e => onChange('status', e.target.value)}
            className={INP}
          >
            {STATUS_OPTIONS.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className={LBL}>Año de incorporación</label>
          <select
            value={values.incorporationYear}
            onChange={e => onChange('incorporationYear', e.target.value)}
            className={INP}
          >
            <option value="">Inicial</option>
            {['2022','2023','2024','2025','2026'].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        <div>
          <label className={LBL}>Valor de referencia ($)</label>
          <input
            type="number"
            value={values.referenceValue}
            onChange={e => onChange('referenceValue', e.target.value)}
            min={0}
            step="0.01"
            placeholder="0.00"
            className={INP}
          />
        </div>

        <div>
          <label className={LBL}>Área responsable de mantenimiento</label>
          <select
            value={values.maintenanceArea}
            onChange={e => onChange('maintenanceArea', e.target.value)}
            className={INP}
          >
            <option value="">Sin definir</option>
            {MAINTENANCE_AREA_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <p className="text-xs mt-0.5 text-gray-400 dark:text-mi-500">
            Equipo técnico que ejecuta el mantenimiento
          </p>
        </div>

        <div>
          <label className={LBL}>
            Criticidad
            {values.criticality && (
              <span className={`ml-2 font-semibold ${CRITICALITY_BADGE[values.criticality] ?? ''}`}>
                {values.criticality}
              </span>
            )}
          </label>
          <select
            value={values.criticality}
            onChange={e => onChange('criticality', e.target.value)}
            className={INP}
          >
            {CRITICALITY_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <p className="text-xs mt-0.5 text-gray-400 dark:text-mi-500">
            Impacto operativo si el activo falla
          </p>
        </div>

        <div className="sm:col-span-2">
          <label className={LBL}>Notas</label>
          <textarea
            value={values.notes}
            onChange={e => onChange('notes', e.target.value)}
            rows={3}
            placeholder="Observaciones adicionales…"
            className={INP + ' resize-none'}
          />
        </div>

      </div>
    </section>
  )
}
