import type { AssetType } from '../../../lib/api'
import type { AssetFormValues, ChangeField } from './useAssetForm'

const LBL = 'block text-xs font-medium text-gray-600 mb-1'
const INP = [
  'w-full px-3 py-2 text-sm border border-gray-300 rounded-lg',
  'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
  'disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed',
].join(' ')

interface Props {
  values:     AssetFormValues
  onChange:   ChangeField
  assetTypes: AssetType[]
  isEdit:     boolean
}

export default function FieldsIdentificacion({ values, onChange, assetTypes, isEdit }: Props) {
  return (
    <section>
      <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs flex items-center justify-center font-bold select-none">
          1
        </span>
        Identificación
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        <div className="sm:col-span-2">
          <label className={LBL}>Nombre <span className="text-red-500">*</span></label>
          <input
            type="text"
            value={values.name}
            onChange={e => onChange('name', e.target.value)}
            required
            maxLength={300}
            placeholder="Descripción completa del activo"
            className={INP}
          />
        </div>

        <div>
          <label className={LBL}>Tipo de activo <span className="text-red-500">*</span></label>
          <select
            value={values.assetTypeCode}
            onChange={e => onChange('assetTypeCode', e.target.value)}
            required
            disabled={isEdit}
            className={INP}
          >
            <option value="">Seleccionar tipo</option>
            {assetTypes.map(t => (
              <option key={t.code} value={t.code}>{t.name}</option>
            ))}
          </select>
          {isEdit && (
            <p className="text-xs text-gray-400 mt-0.5">No modificable tras la creación</p>
          )}
        </div>

        <div>
          <label className={LBL}>Cuenta PUC</label>
          <input
            type="text"
            value={values.pucAccount}
            onChange={e => onChange('pucAccount', e.target.value)}
            maxLength={20}
            placeholder="ej. 1655010101"
            className={INP}
          />
        </div>

        <div>
          <label className={LBL}>Marca</label>
          <input
            type="text"
            value={values.brand}
            onChange={e => onChange('brand', e.target.value)}
            maxLength={100}
            placeholder="ej. Dell"
            className={INP}
          />
        </div>

        <div>
          <label className={LBL}>Modelo</label>
          <input
            type="text"
            value={values.model}
            onChange={e => onChange('model', e.target.value)}
            maxLength={100}
            placeholder="ej. Latitude 5490"
            className={INP}
          />
        </div>

        <div>
          <label className={LBL}>Serial</label>
          <input
            type="text"
            value={values.serial}
            onChange={e => onChange('serial', e.target.value)}
            maxLength={200}
            placeholder="Número de serie"
            className={INP}
          />
        </div>

        <div>
          <label className={LBL}>Cantidad</label>
          <input
            type="number"
            value={values.quantity}
            onChange={e => onChange('quantity', e.target.value)}
            min={1}
            max={9999}
            className={INP}
          />
        </div>

      </div>
    </section>
  )
}
