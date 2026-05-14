import { useCallback, useMemo, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  AlertCircle,
  BarChart3,
  CheckCircle2,
  CircleDot,
  Grid3X3,
  Landmark,
  Package2,
  Plus,
  PlusCircle,
  RefreshCw,
  Trash2,
  UsersRound,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { apiAssets, type AssetAdvancedStatsRow, type AssetStats, type SyncEvent } from '../../lib/api'
import { cn, fmtCOP } from '../../lib/utils'
import { useSyncEvents } from '../../hooks/useSyncEvents'
import { useActivityLog } from '../../hooks/useActivityLog'
import { activityBus } from '../../lib/activityBus'
import { useAuth } from '../../context/AuthContext'
import ActivityFeed from './ActivityFeed'
import CardHeader from './CardHeader'
import DistributionChart from './DistributionChart'
import KpiCard from './KpiCard'
import DonutChart, { type DonutSlice } from './widgets/DonutChart'
import Heatmap, { type HeatmapData } from './widgets/Heatmap'
import TopAreas, { type AreaRank } from './widgets/TopAreas'
import TrendArea, { type TrendPoint } from './widgets/TrendArea'
import DeltaBadge from './widgets/DeltaBadge'

type Totals = AssetStats['totales']

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Buenos días'
  if (h < 18) return 'Buenas tardes'
  return 'Buenas noches'
}

function formatDate(): string {
  return new Date().toLocaleDateString('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function fmt(n: number): string {
  return n.toLocaleString('es-CO')
}

function pct(part: number, total: number): string {
  if (total <= 0) return '0%'
  return `${((part / total) * 100).toFixed(1)}%`
}

function fmtCOPCompact(raw: string | number | null | undefined): string {
  const value = Number(raw)
  if (!Number.isFinite(value) || value === 0) return '$0'
  if (Math.abs(value) >= 1e6) return `$${(value / 1e6).toLocaleString('es-CO', { maximumFractionDigits: 1 })}M`
  return fmtCOP(value)
}

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(ms / 60_000)
  const hours = Math.floor(ms / 3_600_000)
  const days = Math.floor(ms / 86_400_000)
  if (mins < 1) return 'ahora'
  if (mins < 60) return `hace ${mins} min`
  if (hours < 24) return `hace ${hours} h`
  return `hace ${days} d`
}

function cleanLabel(value: string | undefined, fallback: string): string {
  const text = value?.trim()
  return text && text.length > 0 ? text : fallback
}

function compactLabel(value: string): string {
  const normalized = value
    .replace(/^equipos?\s+de\s+/i, '')
    .replace(/^muebles,\s*/i, '')
    .replace(/\s+y\s+equipo\s+de\s+/i, ' / ')
    .replace(/\s+/g, ' ')
    .trim()

  return normalized.length > 18 ? `${normalized.slice(0, 17)}.` : normalized
}

function growthDelta(totals?: Totals): number | undefined {
  if (!totals) return undefined
  const previous = Math.max(0, totals.total - totals.nuevos30d)
  if (previous === 0) return totals.nuevos30d > 0 ? 100 : 0
  return (totals.nuevos30d / previous) * 100
}

function trendFromTotals(totals?: Totals): TrendPoint[] {
  if (!totals) return []
  const previous = Math.max(0, totals.total - totals.nuevos30d)
  return [
    { label: '30 días antes', total: previous, nuevos: 0 },
    { label: 'Hoy', total: totals.total, nuevos: totals.nuevos30d, highlight: true },
  ]
}

function statusSlices(totals?: Totals): DonutSlice[] {
  if (!totals) return []
  const base = Math.max(1, totals.total)
  const known = totals.activos + totals.enTraslado + totals.bajas
  const other = Math.max(0, totals.total - known)

  return [
    { label: 'Operativos', value: totals.activos, color: '#34D399', detail: pct(totals.activos, base) },
    { label: 'En traslado', value: totals.enTraslado, color: '#60A5FA', detail: pct(totals.enTraslado, base) },
    { label: 'Dados de baja', value: totals.bajas, color: '#F87171', detail: pct(totals.bajas, base) },
    { label: 'Otros estados', value: other, color: '#FBBF24', detail: pct(other, base) },
  ].filter(slice => slice.value > 0)
}

function buildHeatmap(rows: AssetAdvancedStatsRow[]): HeatmapData {
  const values = new Map<string, number>()
  const buildingTotals = new Map<string, number>()
  const typeTotals = new Map<string, number>()

  rows.forEach(row => {
    const building = cleanLabel(row.building, 'Sin edificio')
    const type = cleanLabel(row.type, 'Sin tipo')
    const count = Number(row.cantidad) || 0
    const key = `${building}::${type}`

    values.set(key, (values.get(key) ?? 0) + count)
    buildingTotals.set(building, (buildingTotals.get(building) ?? 0) + count)
    typeTotals.set(type, (typeTotals.get(type) ?? 0) + count)
  })

  const topBuildings = [...buildingTotals.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name]) => name)

  const topTypes = [...typeTotals.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name]) => name)

  return {
    rows: topBuildings,
    cols: topTypes.map(type => ({ key: type, label: compactLabel(type) })),
    matrix: topBuildings.map(building =>
      topTypes.map(type => values.get(`${building}::${type}`) ?? 0),
    ),
  }
}

function buildTopAreas(rows: AssetAdvancedStatsRow[]): AreaRank[] {
  return rows
    .map(row => ({
      area: cleanLabel(row.area, 'Sin área asignada'),
      cantidad: Number(row.cantidad) || 0,
      valorTotal: Number(row.valor_total) || 0,
    }))
    .filter(row => row.cantidad > 0)
    .sort((a, b) => b.cantidad - a.cantidad)
    .slice(0, 7)
}

function DashboardPanel({
  icon: Icon,
  title,
  right,
  children,
  className,
}: {
  icon: LucideIcon
  title: string
  right?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section className={cn('card rounded-xl p-5 animate-card-in', className)}>
      <CardHeader icon={Icon} title={title} right={right} />
      {children}
    </section>
  )
}

function NewAssetsCard({ totals, loading }: { totals?: Totals; loading: boolean }) {
  const delta = growthDelta(totals)

  return (
    <section className="card rounded-xl p-5 animate-card-in">
      <CardHeader
        icon={PlusCircle}
        title="Nuevos - 30D"
        right={delta !== undefined && !loading ? <DeltaBadge value={delta} /> : undefined}
      />

      {loading ? (
        <div className="space-y-3">
          <div className="skeleton h-9 w-24" />
          <div className="skeleton h-3 w-36" />
        </div>
      ) : (
        <>
          <div className="font-syne text-[2rem] font-bold leading-none text-[#B8880A] dark:text-[#F5C842]">
            {totals ? fmt(totals.nuevos30d) : '-'}
          </div>
          <p className="mt-2 text-[11px] leading-snug text-gray-400 dark:text-mi-400">
            Activos creados durante los últimos 30 días
          </p>
        </>
      )}
    </section>
  )
}

export default function DashboardPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const activities = useActivityLog()
  const firstName = user?.name?.split(' ')[0] ?? 'Usuario'

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['assets', 'stats'],
    queryFn: apiAssets.stats,
    staleTime: 60_000,
  })

  const { data: matrixRows = [], isLoading: matrixLoading } = useQuery({
    queryKey: ['assets', 'stats', 'advanced', 'building-type'],
    queryFn: () => apiAssets.advancedStats(['building', 'type']),
    staleTime: 60_000,
  })

  const { data: areaRows = [], isLoading: areasLoading } = useQuery({
    queryKey: ['assets', 'stats', 'advanced', 'area'],
    queryFn: () => apiAssets.advancedStats(['area']),
    staleTime: 60_000,
  })

  const handleSync = useCallback((event: SyncEvent) => {
    activityBus.emit({
      type: 'sync',
      message: `Sincronización completada - ${event.insertados} activos añadidos`,
      detail: event.sourceSheet,
    })
    queryClient.invalidateQueries({ queryKey: ['assets', 'stats'] })
  }, [queryClient])

  useSyncEvents(handleSync)

  const refreshDashboard = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['assets', 'stats'] })
  }, [queryClient])

  const totals = stats?.totales
  const delta = growthDelta(totals)
  const trendData = useMemo(() => trendFromTotals(totals), [totals])
  const slices = useMemo(() => statusSlices(totals), [totals])
  const heatmap = useMemo(() => buildHeatmap(matrixRows), [matrixRows])
  const topAreas = useMemo(() => buildTopAreas(areaRows), [areaRows])
  const latestSync = useMemo(() => activities.find(entry => entry.type === 'sync'), [activities])

  const syncLabel = latestSync
    ? `Sincronizado ${timeAgo(latestSync.createdAt)}`
    : 'Estadísticas conectadas al inventario'

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 animate-card-in lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="mb-1.5 font-mono text-[10.5px] uppercase tracking-[0.18em] text-gray-400 dark:text-mi-400">
            {formatDate()}
          </p>
          <h1 className="font-syne text-[1.8rem] font-bold leading-tight tracking-tight text-gray-900 dark:text-mi-50">
            {getGreeting()}, <span className="text-gold-gradient">{firstName}</span>
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12.5px] text-gray-400 dark:text-mi-500">
            <span>Corporación Universitaria Americana</span>
            <span className="hidden text-gray-300 dark:text-mi-600 sm:inline">/</span>
            <span>Activos Fijos</span>
            <span className="hidden text-gray-300 dark:text-mi-600 sm:inline">/</span>
            <span className="inline-flex items-center gap-1.5">
              <span className="live-dot" />
              {syncLabel}
            </span>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={refreshDashboard}
            className="flex items-center gap-1.5 rounded-lg bg-gray-100 px-3.5 py-2 text-[12px] font-medium text-gray-600 transition-all duration-150 hover:bg-gray-200 hover:text-gray-900 dark:bg-white/[0.06] dark:text-mi-300 dark:hover:bg-white/[0.09] dark:hover:text-white"
          >
            <RefreshCw size={13} />
            <span>Actualizar</span>
          </button>
          <Link
            to="/assets"
            className="flex items-center gap-1.5 rounded-lg bg-gray-100 px-3.5 py-2 text-[12px] font-medium text-gray-600 transition-all duration-150 hover:bg-gray-200 hover:text-gray-900 dark:bg-white/[0.06] dark:text-mi-300 dark:hover:bg-white/[0.09] dark:hover:text-white"
          >
            <Package2 size={13} />
            <span>Inventario</span>
          </Link>
          <Link
            to="/assets"
            state={{ openCreate: true }}
            className="flex items-center gap-1.5 rounded-lg bg-gray-900 px-3.5 py-2 text-[12px] font-semibold text-white transition-all duration-150 hover:bg-gray-800 dark:bg-gold dark:text-mi-950 dark:hover:bg-gold-300"
          >
            <Plus size={13} />
            <span>Nuevo activo</span>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard
          icon={Package2}
          label="Total activos"
          value={totals ? fmt(totals.total) : '-'}
          sub={totals ? 'Inventario registrado' : undefined}
          color="default"
          loading={statsLoading}
          delta={delta}
          spark={trendData.map(point => point.total)}
          className="stagger-1"
        />
        <KpiCard
          icon={CheckCircle2}
          label="Operativos"
          value={totals ? fmt(totals.activos) : '-'}
          sub={totals ? `${pct(totals.activos, totals.total)} del total` : undefined}
          color="emerald"
          loading={statsLoading}
          className="stagger-2"
        />
        <KpiCard
          icon={Trash2}
          label="Dados de baja"
          value={totals ? fmt(totals.bajas) : '-'}
          sub={totals ? fmtCOPCompact(totals.valorBajas) : undefined}
          color="red"
          loading={statsLoading}
          className="stagger-3"
        />
        <KpiCard
          icon={AlertCircle}
          label="Requieren revisión"
          value={totals ? fmt(totals.revisionRequerida) : '-'}
          sub="Sin placa o con placa no válida"
          color="amber"
          loading={statsLoading}
          className="stagger-4"
        />
        <KpiCard
          icon={Landmark}
          label="Valor referencial"
          value={totals ? fmtCOPCompact(totals.valorTotal) : '-'}
          sub="Suma de adquisición"
          color="gold"
          loading={statsLoading}
          className="stagger-5"
        />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_280px]">
        <DashboardPanel
          icon={BarChart3}
          title="Crecimiento del inventario - 30 días"
          right={delta !== undefined && !statsLoading ? <DeltaBadge value={delta} /> : undefined}
        >
          <TrendArea data={trendData} loading={statsLoading} />
        </DashboardPanel>
        <NewAssetsCard totals={totals} loading={statsLoading} />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-5">
        <DashboardPanel
          icon={Grid3X3}
          title="Mapa de calor - edificio x tipo de activo"
          className="xl:col-span-3"
        >
          <Heatmap {...heatmap} loading={matrixLoading} />
        </DashboardPanel>

        <DashboardPanel
          icon={CircleDot}
          title="Distribución por estado"
          className="xl:col-span-2"
        >
          <DonutChart
            data={slices}
            centerLabel="Total"
            centerValue={totals ? fmt(totals.total) : undefined}
            loading={statsLoading}
          />
        </DashboardPanel>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <DistributionChart
          title="Activos por edificio"
          items={stats?.porEdificio ?? []}
          color="bg-mi-500 dark:bg-[#F5C842]"
          loading={statsLoading}
        />
        <DistributionChart
          title="Top tipos de activo"
          items={stats?.porTipo ?? []}
          color="bg-mi-400/80 dark:bg-mi-400"
          loading={statsLoading}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-5">
        <DashboardPanel
          icon={UsersRound}
          title="Top áreas responsables"
          className="xl:col-span-2"
        >
          <TopAreas items={topAreas} loading={areasLoading} />
        </DashboardPanel>

        <div className="min-h-[420px] xl:col-span-3">
          <ActivityFeed entries={activities} live />
        </div>
      </div>

    </div>
  )
}
