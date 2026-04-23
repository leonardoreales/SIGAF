import type { Building, Area } from '../../../lib/api'
import type { AssetFormValues, ChangeField } from './useAssetForm'

const LBL = 'block text-xs font-medium text-gray-600 mb-1'
const INP = [
  'w-full px-3 py-2 text-sm border border-gray-300 rounded-lg',
  'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
  'disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed',
].join(' ')

interface Props {
  values:    AssetFormValues
  onChange:  ChangeField
  buildings: Building[]
  areas:     Area[]
  isEdit:    boolean
}

export default function FieldsUbicacion({ values, onChange, buildings, areas, isEdit }: Props) {
  return (
    <section>
      <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs flex items-center justify-center font-bold select-none">
          2
        </span>
        Ubicación
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        <div>
          <label className={LBL}>Edificio <span className="text-red-500">*</span></label>
          <select
            value={values.buildingId}
            onChange={e => onChange('buildingId', e.target.value)}
            required
            disabled={isEdit}
            className={INP}
          >
            <option value="">Seleccionar edificio</option>
            {buildings.map(b => (
              <option key={b.id} value={String(b.id)}>{b.name}</option>
            ))}
          </select>
          {isEdit && (
            <p className="text-xs text-gray-400 mt-0.5">No modificable tras la creación</p>
          )}
        </div>

        <div>
          <label className={LBL}>Área</label>
          <select
            value={values.areaId}
            onChange={e => onChange('areaId', e.target.value)}
            className={INP}
          >
            <option value="">Sin área</option>
            {areas.map(a => (
              <option key={a.id} value={String(a.id)}>{a.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className={LBL}>Piso</label>
          <input
            type="text"
            value={values.floor}
            onChange={e => onChange('floor', e.target.value)}
            maxLength={50}
            placeholder="ej. 3"
            className={INP}
          />
        </div>

        <div>
          <label className={LBL}>Bloque</label>
          <input
            type="text"
            value={values.block}
            onChange={e => onChange('block', e.target.value)}
            maxLength={50}
            placeholder="ej. A"
            className={INP}
          />
        </div>

        <div className="sm:col-span-2">
          <label className={LBL}>Ubicación específica</label>
          <input
            type="text"
            value={values.location}
            onChange={e => onChange('location', e.target.value)}
            maxLength={200}
            placeholder="ej. Sala de sistemas, oficina 301"
            className={INP}
          />
        </div>

      </div>
    </section>
  )
}
