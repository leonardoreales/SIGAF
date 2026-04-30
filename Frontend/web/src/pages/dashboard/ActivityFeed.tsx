import { RefreshCw, Plus, Edit2, Trash2, FileDown, Activity } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { ActivityEntry, ActivityType } from '../../lib/activityBus'
import { cn } from '../../lib/utils'

// ── Meta por tipo ─────────────────────────────────────────────────────────────

interface ActivityMeta { icon: LucideIcon; ring: string; bg: string; label: string }

const META: Record<ActivityType, ActivityMeta> = {
  sync: {
    icon:  RefreshCw,
    ring:  'ring-[#F5C842]/30',
    bg:    'bg-[#F5C842]/10 text-[#c49a10] dark:text-[#F5C842]',
    label: 'Sincronización',
  },
  asset_created: {
    icon:  Plus,
    ring:  'ring-emerald-400/30',
    bg:    'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400',
    label: 'Activo registrado',
  },
  asset_updated: {
    icon:  Edit2,
    ring:  'ring-blue-400/30',
    bg:    'bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400',
    label: 'Activo actualizado',
  },
  asset_deleted: {
    icon:  Trash2,
    ring:  'ring-red-400/30',
    bg:    'bg-red-50 text-red-500 dark:bg-red-950/30 dark:text-red-400',
    label: 'Dado de baja',
  },
  export: {
    icon:  FileDown,
    ring:  'ring-purple-400/30',
    bg:    'bg-purple-50 text-purple-600 dark:bg-purple-950/30 dark:text-purple-400',
    label: 'Exportación',
  },
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const ms    = Date.now() - new Date(iso).getTime()
  const mins  = Math.floor(ms / 60_000)
  const hours = Math.floor(ms / 3_600_000)
  const days  = Math.floor(ms / 86_400_000)
  if (mins  < 1)  return 'ahora'
  if (mins  < 60) return `${mins}m`
  if (hours < 24) return `${hours}h`
  return `${days}d`
}

// ── Entry row ─────────────────────────────────────────────────────────────────

function EntryRow({ entry }: { entry: ActivityEntry }) {
  const meta  = META[entry.type]
  const Icon  = meta.icon

  return (
    <div className="flex gap-3 py-2.5 group">
      {/* Icon */}
      <div className={cn(
        'w-7 h-7 shrink-0 rounded-lg flex items-center justify-center',
        'ring-1', meta.ring, meta.bg,
      )}>
        <Icon size={13} strokeWidth={2} />
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-medium text-gray-800 dark:text-mi-200 leading-snug truncate">
          {entry.message}
        </p>
        {entry.detail && (
          <p className="text-[11px] text-gray-400 dark:text-mi-600 leading-snug truncate mt-0.5">
            {entry.detail}
          </p>
        )}
      </div>

      {/* Time */}
      <span className="shrink-0 text-[10px] font-mono text-gray-300 dark:text-mi-700 self-start pt-[3px]">
        {timeAgo(entry.createdAt)}
      </span>
    </div>
  )
}

// ── ActivityFeed ──────────────────────────────────────────────────────────────

interface Props {
  entries: ActivityEntry[]
  live?:   boolean
}

export default function ActivityFeed({ entries, live = false }: Props) {
  return (
    <div className="
      rounded-2xl bg-white dark:bg-white/[0.02]
      border border-gray-100 dark:border-white/[0.06]
      flex flex-col overflow-hidden h-full
    ">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-white/[0.05] shrink-0">
        <div className="flex items-center gap-2">
          <Activity size={14} className="text-gray-400 dark:text-mi-600" />
          <h3 className="text-xs font-medium tracking-widest uppercase text-gray-400 dark:text-mi-600">
            Actividad Reciente
          </h3>
        </div>
        {live && (
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_5px_rgba(52,211,153,0.9)]" />
            <span className="text-[10px] font-mono text-emerald-500 dark:text-emerald-400">en vivo</span>
          </div>
        )}
      </div>

      {/* Feed */}
      <div className="flex-1 overflow-y-auto px-5 divide-y divide-gray-50 dark:divide-white/[0.03]">
        {entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2">
            <Activity size={22} className="text-gray-200 dark:text-mi-800" />
            <p className="text-xs text-gray-300 dark:text-mi-700">Sin actividad registrada</p>
          </div>
        ) : (
          entries.map(entry => <EntryRow key={entry.id} entry={entry} />)
        )}
      </div>
    </div>
  )
}
