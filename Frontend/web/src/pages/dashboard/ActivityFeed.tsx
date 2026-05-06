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
    bg:    'bg-[#F5C842]/10 text-[#b8880a] dark:text-[#F5C842]',
    label: 'Sincronización',
  },
  asset_created: {
    icon:  Plus,
    ring:  'ring-emerald-400/25',
    bg:    'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/35 dark:text-emerald-400',
    label: 'Activo registrado',
  },
  asset_updated: {
    icon:  Edit2,
    ring:  'ring-blue-400/25',
    bg:    'bg-blue-50 text-blue-600 dark:bg-blue-950/35 dark:text-blue-400',
    label: 'Activo actualizado',
  },
  asset_deleted: {
    icon:  Trash2,
    ring:  'ring-red-400/25',
    bg:    'bg-red-50 text-red-500 dark:bg-red-950/35 dark:text-red-400',
    label: 'Dado de baja',
  },
  export: {
    icon:  FileDown,
    ring:  'ring-purple-400/25',
    bg:    'bg-purple-50 text-purple-600 dark:bg-purple-950/35 dark:text-purple-400',
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

function EntryRow({ entry, isLast }: { entry: ActivityEntry; isLast: boolean }) {
  const meta = META[entry.type]
  const Icon = meta.icon

  return (
    <div className="relative flex gap-3 py-3 group animate-fade-up">
      {/* Timeline connector */}
      {!isLast && (
        <div className="absolute left-[13px] top-[42px] bottom-0 w-px bg-gray-100 dark:bg-white/[0.04]" />
      )}

      {/* Icon bubble */}
      <div className={cn(
        'relative z-10 w-7 h-7 shrink-0 rounded-lg flex items-center justify-center',
        'ring-1 transition-transform duration-150 group-hover:scale-105',
        meta.ring, meta.bg,
      )}>
        <Icon size={12} strokeWidth={2} />
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0 pt-[1px]">
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
    <div className="card rounded-2xl flex flex-col overflow-hidden h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-white/[0.05] shrink-0">
        <div className="flex items-center gap-2">
          <Activity size={13} className="text-gray-400 dark:text-mi-600" />
          <h3 className="text-[10.5px] font-mono tracking-[0.16em] uppercase text-gray-400 dark:text-mi-600">
            Actividad Reciente
          </h3>
        </div>
        {live && (
          <div className="flex items-center gap-1.5">
            <span className="live-dot" />
            <span className="text-[10px] font-mono text-emerald-500 dark:text-emerald-400">en vivo</span>
          </div>
        )}
      </div>

      {/* Feed */}
      <div className="flex-1 overflow-y-auto px-5">
        {entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 gap-2">
            <Activity size={22} className="text-gray-200 dark:text-mi-800" />
            <p className="text-xs text-gray-300 dark:text-mi-700">Sin actividad registrada</p>
          </div>
        ) : (
          entries.map((entry, i) => (
            <EntryRow
              key={entry.id}
              entry={entry}
              isLast={i === entries.length - 1}
            />
          ))
        )}
      </div>
    </div>
  )
}
