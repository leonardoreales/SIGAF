import type { Person } from '../../../lib/api'
import type { AssetFormValues, ChangeField } from './useAssetForm'

const LBL = 'block text-xs font-medium text-gray-600 mb-1'
const INP = [
  'w-full px-3 py-2 text-sm border border-gray-300 rounded-lg',
  'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
].join(' ')

const STATUS_OPTIONS = [
  { value: 'ACTIVO',           label: 'Activo' },
  { value: 'BAJA',             label: 'Baja' },
  { value: 'EN_TRASLADO',      label: 'En traslado' },
  { value: 'EN_MANTENIMIENTO', label: 'En mantenimiento' },
  { value: 'DADO_DE_BAJA',     label: 'Dado de baja' },
]

interface Props {
  values:   AssetFormValues
  onChange: ChangeField
  people:   Person[]
}

export default function FieldsAsignacion({ values, onChange, people }: Props) {
  return (
    <section>
      <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs flex items-center justify-center font-bold select-none">
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
