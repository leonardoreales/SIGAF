import React, { useState, useEffect, useCallback } from 'react';
import {
  Trash2, Search, Filter, Plus, FileDown, Building2,
  AlertCircle, TrendingDown, ChevronDown, ChevronUp,
  Layers, Monitor, Loader2, Package, ClipboardList,
  DollarSign,
} from 'lucide-react';
import { cn, fmtCOP } from '../../lib/utils';
import {
  apiWriteoffs,
  type WriteoffAct,
  type WriteoffActDetail,
  type WriteoffStats,
} from '../../lib/api';

// ── Lookup tables ─────────────────────────────────────────────────────────────

const REASON_LABELS: Record<string, string> = {
  DAÑO:                 'Daño Físico',
  OBSOLESCENCIA:        'Obsolescencia',
  DETERIORO_MOBILIARIO: 'Deterioro del Mobiliario',
  CAMBIO_MOBILIARIO:    'Cambio de Mobiliario',
  REEMPLAZO_MOBILIARIO: 'Reemplazo de Mobiliario',
  VENTA_VEHICULOS:      'Venta de Vehículos',
  DESUSO:               'Desuso',
  BAJA:                 'Baja',
}

const STATUS_CONFIG: Record<string, { label: string; dot: string }> = {
  COMPLETADA:  { label: 'Completada',  dot: 'bg-emerald-500' },
  EN_REVISION: { label: 'En Revisión', dot: 'bg-amber-500'   },
  BORRADOR:    { label: 'Borrador',    dot: 'bg-blue-500'    },
  RECHAZADA:   { label: 'Rechazada',   dot: 'bg-rose-500'    },
}

const RECON_CONFIG: Record<string, { label: string; cls: string }> = {
  MATCHED:     { label: 'Conciliado',    cls: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
  NOT_FOUND:   { label: 'No encontrado', cls: 'bg-amber-500/10 text-amber-600 dark:text-amber-400'       },
  NO_REGISTRA: { label: 'Sin placa',     cls: 'bg-gray-100 dark:bg-white/5 text-gray-500'                },
  EMPTY:       { label: 'Sin dato',      cls: 'bg-gray-100 dark:bg-white/5 text-gray-500'                },
}

const CHART_COLORS = ['bg-rose-500', 'bg-blue-500', 'bg-amber-500', 'bg-violet-500', 'bg-emerald-500']

// ── Helpers ───────────────────────────────────────────────────────────────────


function formatDate(val: string | null | undefined): string {
  if (!val) return '—'
  const d = new Date(val)
  if (isNaN(d.getTime())) return String(val)
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function WriteOffsPage() {
  const [acts, setActs]                   = useState<WriteoffAct[]>([])
  const [stats, setStats]                 = useState<WriteoffStats | null>(null)
  const [loading, setLoading]             = useState(true)
  const [searchTerm, setSearchTerm]       = useState('')
  const [debouncedQ, setDebouncedQ]       = useState('')
  const [filterBuilding, setFilterBuilding] = useState('')
  const [expandedId, setExpandedId]       = useState<number | null>(null)
  const [detailCache, setDetailCache]     = useState<Record<number, WriteoffActDetail>>({})
  const [loadingDetail, setLoadingDetail] = useState(false)

  useEffect(() => {
    apiWriteoffs.stats().then(setStats).catch(console.error)
  }, [])

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(searchTerm), 350)
    return () => clearTimeout(t)
  }, [searchTerm])

  const fetchList = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, string | number | undefined> = { page: 1, limit: 50 }
      if (debouncedQ)    params.q        = debouncedQ
      if (filterBuilding) params.building = filterBuilding
      const res = await apiWriteoffs.list(params)
      setActs(res.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [debouncedQ, filterBuilding])

  useEffect(() => { fetchList() }, [fetchList])

  const toggleRow = async (act: WriteoffAct) => {
    if (expandedId === act.id) { setExpandedId(null); return }
    setExpandedId(act.id)
    if (!detailCache[act.id]) {
      setLoadingDetail(true)
      try {
        const detail = await apiWriteoffs.get(act.id)
        setDetailCache(prev => ({ ...prev, [act.id]: detail }))
      } catch (e) {
        console.error(e)
      } finally {
        setLoadingDetail(false)
      }
    }
  }

  const distribution = stats?.byReason.slice(0, 4).map((r, i) => ({
    label: REASON_LABELS[r.reason] ?? r.reason,
    value: stats.totalActs > 0 ? Math.round((Number(r.count) / stats.totalActs) * 100) : 0,
    color: CHART_COLORS[i],
  })) ?? []

  const matchPct = stats
    ? Math.round((stats.matchedItems / Math.max(stats.totalItems, 1)) * 100)
    : 0

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-700">

      {/* ── Header ── */}
      <div className="relative overflow-hidden bg-white dark:bg-[#1A1A22]/90 border border-gray-200 dark:border-white/5 rounded-3xl p-8 shadow-sm">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-rose-500/5 to-transparent rounded-full -mr-20 -mt-20 blur-3xl" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[11px] font-semibold uppercase tracking-wider border border-rose-500/20">
              <Layers size={13} /> Operaciones
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
              Gestión de Bajas de Activos
            </h1>
            <p className="text-gray-500 dark:text-mi-500 max-w-xl text-sm leading-relaxed">
              Gestión centralizada de actas para la desincorporación de activos institucionales.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 text-gray-700 dark:text-mi-300 rounded-xl text-xs font-semibold transition-all border border-gray-200 dark:border-white/10">
              <FileDown size={16} /> Exportar
            </button>
            <button className="flex items-center gap-2 px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-rose-500/20">
              <Plus size={16} /> Crear Acta
            </button>
          </div>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Actas',
            value: stats ? String(stats.totalActs) : '—',
            badge: stats ? `${stats.totalActs} actas` : '—',
            icon: ClipboardList, color: 'text-rose-500', bg: 'bg-rose-500/10',
          },
          {
            label: 'Total Ítems',
            value: stats ? String(stats.totalItems) : '—',
            badge: stats ? `${stats.totalItems} ítems` : '—',
            icon: Package, color: 'text-blue-500', bg: 'bg-blue-500/10',
          },
          {
            label: 'Conciliados',
            value: stats ? `${matchPct}%` : '—',
            badge: stats ? `${stats.matchedItems} activos` : '—',
            icon: AlertCircle, color: 'text-emerald-500', bg: 'bg-emerald-500/10',
          },
          {
            label: 'Valor Total',
            value: stats ? fmtCOP(stats.totalValue) : '—',
            badge: 'Suma de actas',
            icon: DollarSign, color: 'text-amber-500', bg: 'bg-amber-500/10',
          },
        ].map((s, i) => (
          <div key={i} className="bg-white dark:bg-[#1A1A22]/90 border border-gray-200 dark:border-white/5 rounded-2xl p-5 shadow-sm">
            <div className="flex justify-between items-center mb-3">
              <div className={cn('p-2 rounded-lg', s.bg)}>
                <s.icon className={cn('w-5 h-5', s.color)} />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-white/5 text-gray-500">
                {s.badge}
              </span>
            </div>
            <p className="text-[10px] font-bold text-gray-400 dark:text-mi-400 uppercase tracking-widest">{s.label}</p>
            <p className="text-xl font-bold text-gray-900 dark:text-mi-100 mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Main table ── */}
        <div className="lg:col-span-2 space-y-4">
          {/* Search & Filter */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-mi-500 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar por acta, descripción..."
                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#1A1A22]/90 border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 transition-all text-gray-900 dark:text-mi-100 shadow-sm"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                className="bg-white dark:bg-[#1A1A22]/90 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-gray-700 dark:text-mi-300 focus:outline-none shadow-sm cursor-pointer"
                value={filterBuilding}
                onChange={e => setFilterBuilding(e.target.value)}
              >
                <option value="">Todas las sedes</option>
                {stats?.byBuilding.map(b => (
                  <option key={b.building} value={b.building}>{b.building}</option>
                ))}
              </select>
              <button className="p-2.5 bg-white dark:bg-[#1A1A22]/90 border border-gray-200 dark:border-white/10 rounded-xl text-gray-500 dark:text-mi-400 shadow-sm">
                <Filter size={18} />
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-[#1A1A22]/90 border border-gray-200 dark:border-white/5 rounded-2xl shadow-sm overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-16 gap-3 text-gray-400 dark:text-mi-500 text-sm">
                <Loader2 size={20} className="animate-spin" /> Cargando actas...
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02]">
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-mi-400">Acta / Fecha</th>
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-mi-400">Sede</th>
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-mi-400 text-center">Ítems</th>
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-mi-400">Valor ref.</th>
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-mi-400">Estado</th>
                      <th className="px-6 py-4" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                    {acts.map(act => {
                      const detail = detailCache[act.id]
                      const statusCfg = STATUS_CONFIG[act.status] ?? { label: act.status, dot: 'bg-gray-400' }
                      const isExpanded = expandedId === act.id
                      const isPartial  = Number(act.matchedCount) < act.totalItems

                      return (
                        <React.Fragment key={act.id}>
                          <tr
                            className={cn(
                              'hover:bg-gray-50 dark:hover:bg-white/[0.01] transition-colors cursor-pointer group',
                              isExpanded && 'bg-rose-50/20 dark:bg-rose-500/5',
                            )}
                            onClick={() => toggleRow(act)}
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className={cn(
                                  'w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs transition-colors',
                                  isExpanded ? 'bg-rose-500 text-white' : 'bg-gray-100 dark:bg-white/5 text-gray-900 dark:text-mi-100',
                                )}>
                                  {act.actaNumber.split('-')[1] ?? act.actaNumber}
                                </div>
                                <div>
                                  <p className="text-sm font-semibold text-gray-900 dark:text-mi-100">{act.actaNumber}</p>
                                  <p className="text-[10px] text-gray-400 dark:text-mi-400">{formatDate(act.date)}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-1.5">
                                <Building2 size={13} className="text-gray-400 dark:text-mi-500" />
                                <span className="text-sm text-gray-700 dark:text-mi-200">{act.building ?? '—'}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className="text-sm font-semibold text-gray-900 dark:text-mi-100">{act.totalItems}</span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-sm font-bold text-gray-900 dark:text-mi-100">
                                {fmtCOP(act.referenceValue)}
                              </span>
                              {act.referenceValue && Number(act.referenceValue) > 0 && isPartial && (
                                <span className="block text-[9px] text-gray-400 dark:text-mi-500 mt-0.5">referencia parcial</span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-1.5">
                                <div className={cn('w-1.5 h-1.5 rounded-full', statusCfg.dot)} />
                                <span className="text-xs font-medium text-gray-600 dark:text-mi-400">{statusCfg.label}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="text-gray-400 dark:text-mi-500 group-hover:text-rose-500 transition-colors">
                                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                              </div>
                            </td>
                          </tr>

                          {isExpanded && (
                            <tr>
                              <td colSpan={6} className="px-6 py-0">
                                <div className="bg-gray-50/50 dark:bg-white/[0.01] border-x border-b border-rose-500/10 rounded-b-xl p-5 mb-3 animate-in slide-in-from-top-1 duration-300">
                                  {loadingDetail && !detail ? (
                                    <div className="flex items-center gap-2 text-gray-400 dark:text-mi-500 text-xs py-4">
                                      <Loader2 size={14} className="animate-spin" /> Cargando ítems...
                                    </div>
                                  ) : detail ? (
                                    <>
                                      {/* Secondary: autoriza + responsable (solo en detalle expandido) */}
                                      {(detail.authorizedBy || detail.responsible) && (
                                        <div className="flex flex-wrap gap-x-6 gap-y-1 mb-4 text-[10px] text-gray-400 dark:text-mi-400">
                                          {detail.authorizedBy && (
                                            <span>
                                              Autoriza:{' '}
                                              <span className="font-medium text-gray-500 dark:text-mi-500">
                                                {detail.authorizedBy}
                                                {detail.authorizedByRole ? ` · ${detail.authorizedByRole}` : ''}
                                              </span>
                                            </span>
                                          )}
                                          {detail.responsible && (
                                            <span>
                                              Responsable:{' '}
                                              <span className="font-medium text-gray-500 dark:text-mi-500">
                                                {detail.responsible}
                                                {detail.responsibleRole ? ` · ${detail.responsibleRole}` : ''}
                                              </span>
                                            </span>
                                          )}
                                        </div>
                                      )}

                                      {/* Items grid (scroll si >6) */}
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
                                        {detail.items.map(item => {
                                          const recon = RECON_CONFIG[item.reconciledStatus] ?? { label: item.reconciledStatus, cls: 'bg-gray-100 text-gray-500' }
                                          const name  = item.description ?? item.assetName ?? '—'
                                          const brand = item.brandModel ?? ([item.assetBrand, item.assetModel].filter(Boolean).join(' ') || null)
                                          return (
                                            <div key={item.id} className="flex items-start justify-between p-3 bg-white dark:bg-black/20 rounded-lg border border-gray-100 dark:border-white/5">
                                              <div className="flex items-start gap-3 min-w-0">
                                                <div className="p-2 bg-gray-50 dark:bg-white/5 rounded text-gray-400 dark:text-mi-500 shrink-0 mt-0.5">
                                                  <Monitor size={14} />
                                                </div>
                                                <div className="min-w-0">
                                                  <p className="text-xs font-bold text-gray-900 dark:text-mi-100 truncate">{name}</p>
                                                  {brand && <p className="text-[10px] text-gray-400 dark:text-mi-400 truncate">{brand}</p>}
                                                  {item.plateSerial && (
                                                    <p className="text-[10px] font-mono text-gray-400 dark:text-mi-400 tracking-tight">#{item.plateSerial}</p>
                                                  )}
                                                </div>
                                              </div>
                                              <div className="flex flex-col items-end gap-1 shrink-0 ml-2">
                                                <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded-full', recon.cls)}>
                                                  {recon.label}
                                                </span>
                                                {item.assetReferenceValue && Number(item.assetReferenceValue) > 0 && (
                                                  <span className="text-[10px] font-bold text-gray-700 dark:text-mi-300">
                                                    {fmtCOP(item.assetReferenceValue)}
                                                  </span>
                                                )}
                                              </div>
                                            </div>
                                          )
                                        })}
                                      </div>

                                      <p className="text-[10px] text-gray-400 dark:text-mi-400 mt-3 text-right">
                                        {detail.items.length} ítems ·{' '}
                                        {detail.items.filter(i => i.reconciledStatus === 'MATCHED').length} conciliados
                                      </p>
                                    </>
                                  ) : null}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      )
                    })}
                    {!loading && acts.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-400 dark:text-mi-500">
                          No se encontraron actas con los filtros actuales.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* ── Sidebar Analytics ── */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-[#1A1A22]/90 border border-gray-200 dark:border-white/5 rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900 dark:text-mi-100 flex items-center gap-2 mb-4">
              <TrendingDown size={16} className="text-rose-500" />
              Motivos de Baja
            </h3>
            <div className="space-y-4">
              {distribution.length > 0
                ? distribution.map((item, i) => (
                  <div key={i} className="space-y-1.5">
                    <div className="flex justify-between text-[11px] font-medium">
                      <span className="text-gray-500 dark:text-mi-400">{item.label}</span>
                      <span className="text-gray-900 dark:text-mi-100">{item.value}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                      <div className={cn('h-full rounded-full transition-all duration-1000', item.color)} style={{ width: `${item.value}%` }} />
                    </div>
                  </div>
                ))
                : [1, 2, 3].map(i => (
                  <div key={i} className="h-6 bg-gray-100 dark:bg-white/5 rounded-lg animate-pulse" />
                ))
              }
            </div>
            <button className="w-full mt-6 py-2 text-[11px] font-bold text-gray-400 dark:text-mi-400 hover:text-rose-500 dark:hover:text-rose-500 border border-gray-100 dark:border-white/5 rounded-lg transition-all">
              DESCARGAR ANALÍTICAS
            </button>
          </div>

          {/* Support notice removed per user request */}
        </div>
      </div>

    </div>
  );
}
