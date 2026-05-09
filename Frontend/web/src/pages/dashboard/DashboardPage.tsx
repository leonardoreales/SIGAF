import { useCallback }               from 'react'
import { Link }                       from 'react-router-dom'
import { useQuery, useQueryClient }   from '@tanstack/react-query'
import {
  Package2, CheckCircle2, Trash2, AlertCircle,
  Landmark, Building2, Layers, ArrowLeftRight,
  Plus, FileDown, RefreshCw,
} from 'lucide-react'
import { fmtCOP }              from '../../lib/utils'
import { apiAssets }           from '../../lib/api'
import type { SyncEvent }      from '../../lib/api'
import { useSyncEvents }       from '../../hooks/useSyncEvents'
import { useActivityLog }      from '../../hooks/useActivityLog'
import { activityBus }         from '../../lib/activityBus'
import { useAuth }             from '../../context/AuthContext'
import KpiCard                 from './KpiCard'
import DistributionChart       from './DistributionChart'
import ActivityFeed            from './ActivityFeed'

// ── Helpers ───────────────────────────────────────────────────────────────────

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Buenos días'
  if (h < 18) return 'Buenas tardes'
  return 'Buenas noches'
}

function formatDate(): string {
  return new Date().toLocaleDateString('es-CO', {
    weekday: 'long',
    day:     'numeric',
    month:   'long',
    year:    'numeric',
  })
}


function fmt(n: number): string {
  return n.toLocaleString('es-CO')
}

function pct(part: number, total: number): string {
  if (total === 0) return '0%'
  return `${((part / total) * 100).toFixed(1)}%`
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user }       = useAuth()
  const queryClient    = useQueryClient()
  const activities     = useActivityLog()

  const firstName = user?.name?.split(' ')[0] ?? 'Usuario'

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['assets', 'stats'],
    queryFn:  apiAssets.stats,
    staleTime: 60_000,
  })

  const handleSync = useCallback((event: SyncEvent) => {
    activityBus.emit({
      type:    'sync',
      message: `Sincronización completada — ${event.insertados} activos añadidos`,
      detail:  event.sourceSheet,
    })
    queryClient.invalidateQueries({ queryKey: ['assets', 'stats'] })
  }, [queryClient])

  useSyncEvents(handleSync)

  const t = stats?.totales

  return (
    <div className="space-y-6">

      {/* ── Hero header ─────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 animate-card-in">
        <div>
          <p className="text-[10.5px] font-mono tracking-[0.18em] text-gray-400 dark:text-mi-400 uppercase mb-1.5">
            {formatDate()}
          </p>
          <h1 className="text-[1.65rem] font-syne font-bold text-gray-900 dark:text-mi-50 leading-tight tracking-tight">
            {getGreeting()},{' '}
            <span className="text-gold-gradient">{firstName}</span>
          </h1>
          <p className="text-[12.5px] text-gray-400 dark:text-mi-500 mt-1">
            Corporación Universitaria Americana · Activos Fijos
          </p>
        </div>

        {/* Quick actions */}
        <div className="flex items-center gap-2 shrink-0">
          <Link
            to="/assets"
            className="
              flex items-center gap-1.5 text-[12px] font-medium px-3.5 py-2 rounded-lg transition-all duration-150
              bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900
              dark:bg-white/[0.06] dark:hover:bg-white/[0.09] dark:text-mi-300 dark:hover:text-white
            "
          >
            <Package2 size={13} />
            <span>Inventario</span>
          </Link>
          <Link
            to="/assets"
            state={{ openCreate: true }}
            className="
              flex items-center gap-1.5 text-[12px] font-semibold px-3.5 py-2 rounded-lg transition-all duration-150
              bg-gray-900 hover:bg-gray-800 text-white
              dark:bg-gold dark:hover:bg-gold-300 dark:text-mi-950
            "
          >
            <Plus size={13} />
            <span>Nuevo activo</span>
          </Link>
        </div>
      </div>

      {/* ── KPI cards — with stagger ─────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <KpiCard
          icon={Package2}
          label="Total activos"
          value={t ? fmt(t.total) : '—'}
          sub={t ? `${fmt(t.nuevos30d)} nuevos este mes` : undefined}
          color="default"
          loading={statsLoading}
          className="stagger-1"
        />
        <KpiCard
          icon={CheckCircle2}
          label="Operativos"
          value={t ? fmt(t.activos) : '—'}
          sub={t ? pct(t.activos, t.total) + ' del total' : undefined}
          color="emerald"
          loading={statsLoading}
          className="stagger-2"
        />
        <KpiCard
          icon={Trash2}
          label="Dados de baja"
          value={t ? fmt(t.bajas) : '—'}
          sub={t ? `Valor total: ${fmtCOP(t.valorBajas)}` : undefined}
          color="red"
          loading={statsLoading}
          className="stagger-3"
        />
        <KpiCard
          icon={AlertCircle}
          label="Requieren revisión"
          value={t ? fmt(t.revisionRequerida) : '—'}
          sub="Sin placa o con errores"
          color="amber"
          loading={statsLoading}
          className="stagger-4"
        />
        <KpiCard
          icon={Landmark}
          label="Valor referencial"
          value={t ? fmtCOP(t.valorTotal) : '—'}
          sub="Suma de adquisición"
          color="gold"
          loading={statsLoading}
          className="stagger-5"
        />
      </div>

      {/* ── Main grid ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-5" style={{ minHeight: '480px' }}>

        {/* Charts — izquierda */}
        <div className="xl:col-span-3 flex flex-col gap-4">
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

        {/* Activity feed — derecha */}
        <div className="xl:col-span-2 min-h-[400px] xl:min-h-0">
          <ActivityFeed entries={activities} live />
        </div>
      </div>

      {/* ── Módulos próximos ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {UPCOMING_MODULES.map(mod => (
          <div
            key={mod.label}
            className="
              flex items-center gap-3 px-4 py-3 rounded-xl
              border border-dashed border-gray-200 dark:border-white/[0.06]
              bg-gray-50/60 dark:bg-white/[0.015]
              opacity-55 transition-opacity hover:opacity-80
            "
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gray-100 dark:bg-white/[0.05] shrink-0">
              <mod.icon size={14} className="text-gray-400 dark:text-mi-400" />
            </div>
            <div className="min-w-0">
              <p className="text-[12px] font-medium text-gray-500 dark:text-mi-500 truncate">{mod.label}</p>
              <p className="text-[10px] font-mono text-gray-400 dark:text-mi-500 uppercase tracking-widest mt-0.5">Próximamente</p>
            </div>
          </div>
        ))}
      </div>

    </div>
  )
}

// ── Próximos módulos ──────────────────────────────────────────────────────────

const UPCOMING_MODULES = [
  { icon: ArrowLeftRight, label: 'Traslados entre sedes y áreas' },
  { icon: FileDown,       label: 'Reportes y exportaciones PDF' },
  { icon: Layers,         label: 'Asignaciones y actas de entrega' },
  { icon: Building2,      label: 'Gestión de bajas con aprobación' },
  { icon: RefreshCw,      label: 'Historial de auditoría por activo' },
  { icon: Package2,       label: 'Módulo de adquisiciones' },
] as const
