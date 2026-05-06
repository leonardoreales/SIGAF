import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { X, Save, Loader2 } from 'lucide-react'
import { apiUsers, type SystemUser } from '../../lib/api'

const ROLES = [
  { value: 'ADMIN',         label: 'Administrador' },
  { value: 'ACTIVOS_FIJOS', label: 'Activos Fijos' },
  { value: 'COMPRAS',       label: 'Compras' },
  { value: 'VIEWER',        label: 'Espectador' },
]

const inputCls = `
  w-full rounded-lg px-3 py-2 text-sm outline-none transition-colors
  bg-white border border-gray-200 text-gray-900 placeholder:text-gray-400
  focus:border-blue-400 focus:ring-1 focus:ring-blue-400/30
  dark:bg-mi-750 dark:border-mi-600 dark:text-mi-100 dark:placeholder:text-mi-500
  dark:focus:border-gold/60 dark:focus:ring-gold/20
`.trim()

interface Props {
  user:    SystemUser
  onClose: () => void
}

export function UserEditModal({ user, onClose }: Props) {
  const qc = useQueryClient()

  const [form, setForm] = useState({
    role:        user.role,
    cargo:       user.cargo,
    dependencia: user.dependencia,
    isActive:    user.isActive,
  })
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setForm({ role: user.role, cargo: user.cargo, dependencia: user.dependencia, isActive: user.isActive })
    setError(null)
  }, [user])

  const set = (field: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm(f => ({ ...f, [field]: e.target.value }))

  const mutation = useMutation({
    mutationFn: () => apiUsers.update(user.email, form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] })
      onClose()
    },
    onError: (err: Error) => setError(err.message),
  })

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 backdrop-blur-sm p-4 sm:py-10"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-md rounded-2xl shadow-2xl bg-white dark:bg-mi-800 dark:shadow-[0_0_60px_rgba(10,2,44,0.6)]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-mi-700/50">
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-mi-50 text-sm">Editar Usuario</h2>
            <p className="text-xs text-gray-400 dark:text-mi-400 mt-0.5 font-mono">{user.email}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-mi-700 transition-colors text-gray-400 dark:text-mi-400">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg border border-red-100 dark:border-red-800/30">
              {error}
            </p>
          )}

          <Field label="Rol">
            <select value={form.role} onChange={set('role')} className={inputCls}>
              {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </Field>

          <Field label="Cargo">
            <input
              type="text"
              value={form.cargo}
              onChange={set('cargo')}
              placeholder="Ej: Coordinador de Activos Fijos"
              className={inputCls}
            />
          </Field>

          <Field label="Dependencia">
            <input
              type="text"
              value={form.dependencia}
              onChange={set('dependencia')}
              placeholder="Ej: Administración"
              className={inputCls}
            />
          </Field>

          <Field label="Estado">
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <div className="relative">
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={form.isActive}
                  onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
                />
                <div className={`w-10 h-5 rounded-full transition-colors ${form.isActive ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-mi-600'}`} />
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${form.isActive ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </div>
              <span className="text-sm text-gray-700 dark:text-mi-200">
                {form.isActive ? 'Usuario activo' : 'Usuario inactivo'}
              </span>
            </label>
          </Field>

        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100 dark:border-mi-700/50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg text-gray-600 dark:text-mi-300 hover:bg-gray-100 dark:hover:bg-mi-700 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-gold text-mi-950 hover:bg-gold/90 disabled:opacity-50 transition-colors shadow-sm"
          >
            {mutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Guardar cambios
          </button>
        </div>

      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-gray-500 dark:text-mi-400 uppercase tracking-wide">
        {label}
      </label>
      {children}
    </div>
  )
}
