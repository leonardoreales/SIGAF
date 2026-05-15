import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Plus, Search, Building2, Tag, FolderOpen, Users2,
  Pencil, Ban, RefreshCw, X, Settings2,
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { apiCatalogs } from '../../lib/api'
import type { Building, AssetType, Area, Person } from '../../lib/api'

// ── Tab config ────────────────────────────────────────────────────────────────

type TabId = 'buildings' | 'assetTypes' | 'areas' | 'people'

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'buildings',  label: 'Edificios',      icon: Building2  },
  { id: 'assetTypes', label: 'Tipos de Activo', icon: Tag        },
  { id: 'areas',      label: 'Áreas',           icon: FolderOpen },
  { id: 'people',     label: 'Personas',        icon: Users2     },
]

// ── Shared primitives ─────────────────────────────────────────────────────────

function ActiveBadge({ active }: { active: boolean }) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium',
      active
        ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/30'
        : 'bg-gray-100 text-gray-400 ring-1 ring-gray-200 dark:bg-gray-800 dark:text-gray-500 dark:ring-gray-700',
    )}>
      <span className={cn('w-1.5 h-1.5 rounded-full', active ? 'bg-emerald-500' : 'bg-gray-400')} />
      {active ? 'Activo' : 'Inactivo'}
    </span>
  )
}

function RowActions({
  active, onEdit, onToggle, toggling,
}: {
  active: boolean
  onEdit: () => void
  onToggle: () => void
  toggling: boolean
}) {
  return (
    <div className="flex items-center gap-1 justify-end">
      <button
        onClick={onEdit}
        title="Editar"
        className="p-1.5 rounded-md text-gray-400 hover:text-[#0D1B4A] hover:bg-gray-100 dark:hover:text-gold dark:hover:bg-gold/10 transition-colors cursor-pointer"
      >
        <Pencil size={14} />
      </button>
      <button
        onClick={onToggle}
        disabled={toggling}
        title={active ? 'Desactivar' : 'Reactivar'}
        className={cn(
          'p-1.5 rounded-md transition-colors cursor-pointer disabled:opacity-40',
          active
            ? 'text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10'
            : 'text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10',
        )}
      >
        {active ? <Ban size={14} /> : <RefreshCw size={14} />}
      </button>
    </div>
  )
}

// ── Modal ─────────────────────────────────────────────────────────────────────

function Modal({
  title, onClose, onSubmit, loading, children,
}: {
  title: string
  onClose: () => void
  onSubmit: (e: React.FormEvent) => void
  loading: boolean
  children: React.ReactNode
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={cn(
        'relative z-10 w-full max-w-md rounded-xl shadow-2xl',
        'bg-white dark:bg-[#0D1B4A]',
        'border border-gray-200 dark:border-gold/10',
      )}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gold/10">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>
        <form onSubmit={onSubmit}>
          <div className="px-6 py-5 space-y-4">{children}</div>
          <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100 dark:border-gold/10">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-sm rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className={cn(
                'px-4 py-1.5 text-sm rounded-lg font-medium transition-opacity cursor-pointer',
                'bg-[#0D1B4A] dark:bg-gold text-white dark:text-[#0D1B4A]',
                'hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed',
              )}
            >
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
        {label}
        {required && <span className="text-rose-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}

const inputCls = [
  'w-full px-3 py-2 text-sm rounded-lg',
  'border border-gray-200 dark:border-gold/15',
  'bg-white dark:bg-white/5',
  'text-gray-900 dark:text-white',
  'placeholder:text-gray-400 dark:placeholder:text-gray-600',
  'focus:outline-none focus:ring-2 focus:ring-[#0D1B4A]/20 dark:focus:ring-gold/25',
  'transition-colors',
].join(' ')

// ── Table shell ───────────────────────────────────────────────────────────────

function TableShell({
  search, onSearch, onNew, newLabel, columns, children, isLoading, extraActions,
}: {
  search: string
  onSearch: (v: string) => void
  onNew: () => void
  newLabel: string
  columns: string[]
  children: React.ReactNode
  isLoading: boolean
  extraActions?: React.ReactNode
}) {
  return (
    <div className="flex flex-col h-full gap-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => onSearch(e.target.value)}
            placeholder="Buscar..."
            className={cn(inputCls, 'pl-8 py-1.5 text-xs')}
          />
        </div>
        {extraActions}
        <button
          onClick={onNew}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold',
            'bg-[#0D1B4A] text-white hover:opacity-90',
            'dark:bg-gold dark:text-[#0D1B4A] dark:hover:opacity-90',
            'transition-opacity cursor-pointer',
          )}
        >
          <Plus size={13} />
          {newLabel}
        </button>
      </div>

      <div className="flex-1 overflow-auto rounded-xl border border-gray-100 dark:border-white/[0.06]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 dark:border-white/[0.06] bg-gray-50/80 dark:bg-white/[0.025]">
              {columns.map(col => (
                <th
                  key={col}
                  className="px-4 py-2.5 text-left text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-10 text-center text-sm text-gray-400">
                  Cargando...
                </td>
              </tr>
            ) : children}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const emptyRow = (colSpan: number) => (
  <tr>
    <td colSpan={colSpan} className="px-4 py-10 text-center text-sm text-gray-400 dark:text-gray-600">
      Sin resultados
    </td>
  </tr>
)

const trCls = 'border-b border-gray-50 dark:border-white/[0.03] hover:bg-gray-50/70 dark:hover:bg-white/[0.02] transition-colors'

// ── Buildings tab ─────────────────────────────────────────────────────────────

function BuildingsTab() {
  const qc = useQueryClient()
  const { data = [], isLoading } = useQuery({
    queryKey: ['catalogs', 'admin', 'buildings'],
    queryFn:  () => apiCatalogs.admin.buildings(),
    staleTime: 30_000,
  })

  const [search, setSearch]       = useState('')
  const [modal, setModal]         = useState<{ mode: 'create' | 'edit'; row?: Building } | null>(null)
  const [form, setForm]           = useState({ cityCode: '1', code: '', name: '' })
  const [togglingId, setTogglingId] = useState<number | null>(null)

  const filtered = useMemo(
    () => data.filter(b =>
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.code.toLowerCase().includes(search.toLowerCase()),
    ),
    [data, search],
  )

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['catalogs', 'admin', 'buildings'] })
    qc.invalidateQueries({ queryKey: ['catalogs', 'buildings'] })
  }

  const saveMut = useMutation({
    mutationFn: () =>
      modal?.mode === 'create'
        ? apiCatalogs.admin.createBuilding(form)
        : apiCatalogs.admin.updateBuilding(modal!.row!.id, { name: form.name, code: form.code, cityCode: form.cityCode }),
    onSuccess: () => {
      invalidate()
      toast.success(modal?.mode === 'create' ? 'Edificio creado' : 'Edificio actualizado')
      setModal(null)
    },
    onError: () => toast.error('Error al guardar'),
  })

  const toggleMut = useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) =>
      apiCatalogs.admin.updateBuilding(id, { active }),
    onSuccess: (row) => {
      invalidate()
      toast.success(row.active ? 'Edificio reactivado' : 'Edificio desactivado')
      setTogglingId(null)
    },
    onError: () => { toast.error('Error'); setTogglingId(null) },
  })

  function openCreate() {
    setForm({ cityCode: '1', code: '', name: '' })
    setModal({ mode: 'create' })
  }

  function openEdit(row: Building) {
    setForm({ cityCode: row.cityCode, code: row.code, name: row.name })
    setModal({ mode: 'edit', row })
  }

  return (
    <>
      <TableShell
        search={search} onSearch={setSearch}
        onNew={openCreate} newLabel="Nuevo Edificio"
        columns={['Código', 'Nombre', 'Ciudad', 'Estado', '']}
        isLoading={isLoading}
      >
        {filtered.length === 0 ? emptyRow(5) : filtered.map(row => (
          <tr key={row.id} className={trCls}>
            <td className="px-4 py-3 font-mono text-xs text-gray-400 dark:text-gray-500 uppercase">{row.code}</td>
            <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{row.name}</td>
            <td className="px-4 py-3 font-mono text-xs text-gray-400 dark:text-gray-500">{row.cityCode}</td>
            <td className="px-4 py-3"><ActiveBadge active={row.active} /></td>
            <td className="px-4 py-3 w-20">
              <RowActions
                active={row.active}
                onEdit={() => openEdit(row)}
                onToggle={() => { setTogglingId(row.id); toggleMut.mutate({ id: row.id, active: !row.active }) }}
                toggling={togglingId === row.id}
              />
            </td>
          </tr>
        ))}
      </TableShell>

      {modal && (
        <Modal
          title={modal.mode === 'create' ? 'Nuevo Edificio' : 'Editar Edificio'}
          onClose={() => setModal(null)}
          onSubmit={e => { e.preventDefault(); saveMut.mutate() }}
          loading={saveMut.isPending}
        >
          <Field label="Código" required>
            <input
              className={inputCls}
              value={form.code}
              onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase().slice(0, 2) }))}
              placeholder="ej. B1"
              maxLength={2}
              required
            />
          </Field>
          <Field label="Nombre" required>
            <input
              className={inputCls}
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="ej. Bloque Central"
              required
            />
          </Field>
          <Field label="Código de Ciudad">
            <input
              className={inputCls}
              value={form.cityCode}
              onChange={e => setForm(f => ({ ...f, cityCode: e.target.value.slice(0, 1) }))}
              placeholder="1"
              maxLength={1}
            />
          </Field>
        </Modal>
      )}
    </>
  )
}

// ── Asset Types tab ───────────────────────────────────────────────────────────

function AssetTypesTab() {
  const qc = useQueryClient()
  const { data = [], isLoading } = useQuery({
    queryKey: ['catalogs', 'admin', 'assetTypes'],
    queryFn:  () => apiCatalogs.admin.assetTypes(),
    staleTime: 30_000,
  })

  const [search, setSearch]           = useState('')
  const [modal, setModal]             = useState<{ mode: 'create' | 'edit'; row?: AssetType } | null>(null)
  const [form, setForm]               = useState({ code: '', name: '' })
  const [togglingCode, setTogglingCode] = useState<string | null>(null)

  const filtered = useMemo(
    () => data.filter(t =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.code.includes(search),
    ),
    [data, search],
  )

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['catalogs', 'admin', 'assetTypes'] })
    qc.invalidateQueries({ queryKey: ['catalogs', 'assetTypes'] })
  }

  const saveMut = useMutation({
    mutationFn: () =>
      modal?.mode === 'create'
        ? apiCatalogs.admin.createAssetType(form)
        : apiCatalogs.admin.updateAssetType(modal!.row!.code, { name: form.name }),
    onSuccess: () => {
      invalidate()
      toast.success(modal?.mode === 'create' ? 'Tipo creado' : 'Tipo actualizado')
      setModal(null)
    },
    onError: () => toast.error('Error al guardar'),
  })

  const toggleMut = useMutation({
    mutationFn: ({ code, active }: { code: string; active: boolean }) =>
      apiCatalogs.admin.updateAssetType(code, { active }),
    onSuccess: (row) => {
      invalidate()
      toast.success(row.active ? 'Tipo reactivado' : 'Tipo desactivado')
      setTogglingCode(null)
    },
    onError: () => { toast.error('Error'); setTogglingCode(null) },
  })

  function openCreate() {
    setForm({ code: '', name: '' })
    setModal({ mode: 'create' })
  }

  function openEdit(row: AssetType) {
    setForm({ code: row.code, name: row.name })
    setModal({ mode: 'edit', row })
  }

  return (
    <>
      <TableShell
        search={search} onSearch={setSearch}
        onNew={openCreate} newLabel="Nuevo Tipo"
        columns={['Código PUC', 'Nombre', 'Estado', '']}
        isLoading={isLoading}
      >
        {filtered.length === 0 ? emptyRow(4) : filtered.map(row => (
          <tr key={row.code} className={trCls}>
            <td className="px-4 py-3 font-mono text-xs text-gray-400 dark:text-gray-500">{row.code}</td>
            <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{row.name}</td>
            <td className="px-4 py-3"><ActiveBadge active={row.active} /></td>
            <td className="px-4 py-3 w-20">
              <RowActions
                active={row.active}
                onEdit={() => openEdit(row)}
                onToggle={() => { setTogglingCode(row.code); toggleMut.mutate({ code: row.code, active: !row.active }) }}
                toggling={togglingCode === row.code}
              />
            </td>
          </tr>
        ))}
      </TableShell>

      {modal && (
        <Modal
          title={modal.mode === 'create' ? 'Nuevo Tipo de Activo' : 'Editar Tipo de Activo'}
          onClose={() => setModal(null)}
          onSubmit={e => { e.preventDefault(); saveMut.mutate() }}
          loading={saveMut.isPending}
        >
          <Field label="Código PUC" required>
            <input
              className={cn(inputCls, modal.mode === 'edit' && 'opacity-60 cursor-not-allowed')}
              value={form.code}
              onChange={e => modal.mode === 'create' && setForm(f => ({ ...f, code: e.target.value.slice(0, 2) }))}
              placeholder="ej. 70"
              maxLength={2}
              required
              readOnly={modal.mode === 'edit'}
            />
          </Field>
          <Field label="Nombre" required>
            <input
              className={inputCls}
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="ej. Equipos de Computación"
              required
            />
          </Field>
        </Modal>
      )}
    </>
  )
}

// ── Areas tab ─────────────────────────────────────────────────────────────────

function AreasTab() {
  const qc = useQueryClient()
  const { data = [], isLoading } = useQuery({
    queryKey: ['catalogs', 'admin', 'areas'],
    queryFn:  () => apiCatalogs.admin.areas(),
    staleTime: 30_000,
  })

  const [search, setSearch]         = useState('')
  const [showInactive, setShowInactive] = useState(false)
  const [modal, setModal]           = useState<{ mode: 'create' | 'edit'; row?: Area } | null>(null)
  const [form, setForm]             = useState({ name: '' })
  const [togglingId, setTogglingId] = useState<number | null>(null)

  const filtered = useMemo(
    () => data
      .filter(a => showInactive || a.active)
      .filter(a => a.name.toLowerCase().includes(search.toLowerCase())),
    [data, search, showInactive],
  )

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['catalogs', 'admin', 'areas'] })
    qc.invalidateQueries({ queryKey: ['catalogs', 'areas'] })
  }

  const saveMut = useMutation({
    mutationFn: () =>
      modal?.mode === 'create'
        ? apiCatalogs.admin.createArea(form)
        : apiCatalogs.admin.updateArea(modal!.row!.id, form),
    onSuccess: () => {
      invalidate()
      toast.success(modal?.mode === 'create' ? 'Área creada' : 'Área actualizada')
      setModal(null)
    },
    onError: () => toast.error('Error al guardar'),
  })

  const toggleMut = useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) =>
      apiCatalogs.admin.updateArea(id, { active }),
    onSuccess: (row) => {
      invalidate()
      toast.success(row.active ? 'Área reactivada' : 'Área desactivada')
      setTogglingId(null)
    },
    onError: () => { toast.error('Error'); setTogglingId(null) },
  })

  return (
    <>
      <TableShell
        search={search} onSearch={setSearch}
        onNew={() => { setForm({ name: '' }); setModal({ mode: 'create' }) }}
        newLabel="Nueva Área"
        columns={['ID', 'Nombre', 'Estado', '']}
        isLoading={isLoading}
        extraActions={
          <button
            onClick={() => setShowInactive(v => !v)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer',
              showInactive
                ? 'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-400'
                : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300 dark:border-white/10 dark:bg-white/5 dark:text-gray-400',
            )}
          >
            {showInactive ? 'Ocultar inactivas' : 'Mostrar inactivas'}
          </button>
        }
      >
        {filtered.length === 0 ? emptyRow(4) : filtered.map(row => (
          <tr key={row.id} className={trCls}>
            <td className="px-4 py-3 font-mono text-xs text-gray-400 dark:text-gray-500">#{row.id}</td>
            <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{row.name}</td>
            <td className="px-4 py-3"><ActiveBadge active={row.active} /></td>
            <td className="px-4 py-3 w-20">
              <RowActions
                active={row.active}
                onEdit={() => { setForm({ name: row.name }); setModal({ mode: 'edit', row }) }}
                onToggle={() => { setTogglingId(row.id); toggleMut.mutate({ id: row.id, active: !row.active }) }}
                toggling={togglingId === row.id}
              />
            </td>
          </tr>
        ))}
      </TableShell>

      {modal && (
        <Modal
          title={modal.mode === 'create' ? 'Nueva Área' : 'Editar Área'}
          onClose={() => setModal(null)}
          onSubmit={e => { e.preventDefault(); saveMut.mutate() }}
          loading={saveMut.isPending}
        >
          <Field label="Nombre del Área" required>
            <input
              className={inputCls}
              value={form.name}
              onChange={e => setForm({ name: e.target.value })}
              placeholder="ej. Recursos Humanos"
              required
            />
          </Field>
        </Modal>
      )}
    </>
  )
}

// ── People tab ────────────────────────────────────────────────────────────────

function PeopleTab() {
  const qc = useQueryClient()
  const { data = [], isLoading } = useQuery({
    queryKey: ['catalogs', 'admin', 'people'],
    queryFn:  () => apiCatalogs.admin.people(),
    staleTime: 30_000,
  })
  const { data: areas = [] } = useQuery({
    queryKey: ['catalogs', 'areas'],
    queryFn:  () => apiCatalogs.areas(),
    staleTime: 30_000,
  })

  const [search, setSearch]       = useState('')
  const [modal, setModal]         = useState<{ mode: 'create' | 'edit'; row?: Person } | null>(null)
  const [form, setForm]           = useState({ fullName: '', email: '', areaId: '' })
  const [togglingId, setTogglingId] = useState<number | null>(null)

  const filtered = useMemo(
    () => data.filter(p =>
      p.fullName.toLowerCase().includes(search.toLowerCase()) ||
      (p.email ?? '').toLowerCase().includes(search.toLowerCase()),
    ),
    [data, search],
  )

  const areaMap = useMemo(
    () => Object.fromEntries(areas.map(a => [a.id, a.name])),
    [areas],
  )

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['catalogs', 'admin', 'people'] })
    qc.invalidateQueries({ queryKey: ['catalogs', 'people'] })
  }

  const saveMut = useMutation({
    mutationFn: () => {
      const payload = {
        fullName: form.fullName,
        email:    form.email || undefined,
        areaId:   form.areaId ? Number(form.areaId) : undefined,
      }
      return modal?.mode === 'create'
        ? apiCatalogs.admin.createPerson(payload)
        : apiCatalogs.admin.updatePerson(modal!.row!.id, payload)
    },
    onSuccess: () => {
      invalidate()
      toast.success(modal?.mode === 'create' ? 'Persona creada' : 'Persona actualizada')
      setModal(null)
    },
    onError: () => toast.error('Error al guardar'),
  })

  const toggleMut = useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) =>
      apiCatalogs.admin.updatePerson(id, { active }),
    onSuccess: (row) => {
      invalidate()
      toast.success(row.active ? 'Persona reactivada' : 'Persona desactivada')
      setTogglingId(null)
    },
    onError: () => { toast.error('Error'); setTogglingId(null) },
  })

  function openCreate() {
    setForm({ fullName: '', email: '', areaId: '' })
    setModal({ mode: 'create' })
  }

  function openEdit(row: Person) {
    setForm({ fullName: row.fullName, email: row.email ?? '', areaId: row.areaId?.toString() ?? '' })
    setModal({ mode: 'edit', row })
  }

  return (
    <>
      <TableShell
        search={search} onSearch={setSearch}
        onNew={openCreate} newLabel="Nueva Persona"
        columns={['Nombre', 'Email', 'Área', 'Estado', '']}
        isLoading={isLoading}
      >
        {filtered.length === 0 ? emptyRow(5) : filtered.map(row => (
          <tr key={row.id} className={trCls}>
            <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{row.fullName}</td>
            <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">{row.email ?? '—'}</td>
            <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">
              {row.areaId ? (areaMap[row.areaId] ?? `#${row.areaId}`) : '—'}
            </td>
            <td className="px-4 py-3"><ActiveBadge active={row.active} /></td>
            <td className="px-4 py-3 w-20">
              <RowActions
                active={row.active}
                onEdit={() => openEdit(row)}
                onToggle={() => { setTogglingId(row.id); toggleMut.mutate({ id: row.id, active: !row.active }) }}
                toggling={togglingId === row.id}
              />
            </td>
          </tr>
        ))}
      </TableShell>

      {modal && (
        <Modal
          title={modal.mode === 'create' ? 'Nueva Persona' : 'Editar Persona'}
          onClose={() => setModal(null)}
          onSubmit={e => { e.preventDefault(); saveMut.mutate() }}
          loading={saveMut.isPending}
        >
          <Field label="Nombre completo" required>
            <input
              className={inputCls}
              value={form.fullName}
              onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))}
              placeholder="ej. Ana García López"
              required
            />
          </Field>
          <Field label="Email">
            <input
              className={inputCls}
              type="email"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              placeholder="ej. ana@americana.edu.co"
            />
          </Field>
          <Field label="Área">
            <select
              className={inputCls}
              value={form.areaId}
              onChange={e => setForm(f => ({ ...f, areaId: e.target.value }))}
            >
              <option value="">Sin área</option>
              {areas.map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </Field>
        </Modal>
      )}
    </>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

const TAB_CONTENT: Record<TabId, React.ElementType> = {
  buildings:  BuildingsTab,
  assetTypes: AssetTypesTab,
  areas:      AreasTab,
  people:     PeopleTab,
}

export default function CatalogsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('buildings')
  const TabContent = TAB_CONTENT[activeTab]

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="shrink-0 flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-xl bg-[#0D1B4A] dark:bg-gold/10 flex items-center justify-center shrink-0">
          <Settings2 size={17} className="text-white dark:text-gold" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white leading-none">
            Gestión de Catálogos
          </h1>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
            Datos maestros del sistema · solo ADMIN
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="shrink-0 flex items-center gap-0.5 border-b border-gray-100 dark:border-white/[0.06] mb-5">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={cn(
              'flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold',
              'rounded-t-lg transition-all duration-150 cursor-pointer relative -mb-px',
              activeTab === id
                ? [
                    'text-[#0D1B4A] dark:text-gold',
                    'border-b-2 border-[#0D1B4A] dark:border-gold',
                    'bg-[#0D1B4A]/[0.04] dark:bg-gold/[0.05]',
                  ].join(' ')
                : 'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/[0.02]',
            )}
          >
            <Icon size={13} />
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <TabContent />
      </div>
    </div>
  )
}
