import { useState } from 'react'
import { Link, useMatch } from 'react-router-dom'
import {
  Package2, ArrowLeftRight, History, BarChart3,
  Trash2, ClipboardList, FileText, LayoutDashboard,
  ChevronLeft, ChevronRight, ChevronDown,
  Sun, Moon, LogOut, Lock,
} from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import { cn } from '../lib/utils'

// ── Types ─────────────────────────────────────────────────────────────────────

type ItemStatus = 'live' | 'soon' | 'planned'

interface NavItem {
  to:     string
  icon:   React.ElementType
  label:  string
  status: ItemStatus
}

interface NavSection {
  id:    string
  title: string
  items: NavItem[]
}

// ── Navigation structure ──────────────────────────────────────────────────────

const NAV_SECTIONS: NavSection[] = [
  {
    id: 'inventario',
    title: 'Inventario',
    items: [
      { to: '/assets', icon: Package2, label: 'Activos', status: 'live' },
    ],
  },
  {
    id: 'operaciones',
    title: 'Operaciones',
    items: [
      { to: '/transfers', icon: ArrowLeftRight, label: 'Traslados',  status: 'live'    },
      { to: '/history',   icon: History,        label: 'Historial',  status: 'soon'    },
      { to: '/writeoffs', icon: Trash2,         label: 'Bajas',      status: 'planned' },
    ],
  },
  {
    id: 'gestion',
    title: 'Gestión',
    items: [
      { to: '/assignments', icon: ClipboardList, label: 'Asignaciones', status: 'planned' },
      { to: '/actas',       icon: FileText,      label: 'Actas',        status: 'planned' },
    ],
  },
  {
    id: 'analisis',
    title: 'Análisis',
    items: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', status: 'live' },
      { to: '/reports',   icon: BarChart3,       label: 'Reportes',  status: 'soon'  },
    ],
  },
]

// ── Utils ─────────────────────────────────────────────────────────────────────

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(n => n[0])
    .join('')
    .toUpperCase()
}

function loadSet(key: string): Set<string> {
  try {
    const raw = localStorage.getItem(key)
    return new Set(raw ? (JSON.parse(raw) as string[]) : [])
  } catch {
    return new Set()
  }
}

function saveSet(key: string, set: Set<string>) {
  localStorage.setItem(key, JSON.stringify([...set]))
}

// ── NavItemRow ────────────────────────────────────────────────────────────────

function NavItemRow({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
  const { to, icon: Icon, label, status } = item
  const isActive = Boolean(useMatch(to))

  const base = cn(
    'flex items-center rounded-lg px-2 py-[9px] text-[13px] font-medium',
    'transition-all duration-150',
    collapsed ? 'justify-center' : 'gap-2.5',
  )

  if (status === 'planned') {
    return (
      <div
        title={collapsed ? label : undefined}
        className={cn(
          base,
          'opacity-30 cursor-not-allowed',
          'text-gray-400 dark:text-mi-300',
        )}
      >
        <Icon size={15} className="shrink-0" />
        {!collapsed && (
          <>
            <span className="flex-1 truncate">{label}</span>
            <Lock size={10} className="shrink-0 text-gray-300 dark:text-mi-600" />
          </>
        )}
      </div>
    )
  }

  return (
    <Link
      to={to}
      title={collapsed ? label : undefined}
      className={cn(
        base,
        isActive
          ? [
              'text-mi-700 dark:text-gold',
              'bg-gradient-to-r from-gold/[0.09] to-transparent',
              'border-l-[2px] border-gold/70',
              'pl-[6px]',
            ].join(' ')
          : status === 'soon'
          ? 'text-gray-400 hover:text-gray-700 hover:bg-gray-100/70 dark:text-mi-400 dark:hover:text-mi-200 dark:hover:bg-white/[0.03]'
          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/70 dark:text-mi-200 dark:hover:text-white dark:hover:bg-white/[0.04]',
      )}
    >
      <Icon
        size={15}
        className={cn(
          'shrink-0 transition-all duration-150',
          isActive && 'drop-shadow-[0_0_6px_rgba(245,200,66,0.7)]',
        )}
      />

      {!collapsed && (
        <>
          <span className="flex-1 truncate leading-none">{label}</span>

          {status === 'live' && (
            <span
              className={cn(
                'w-1.5 h-1.5 rounded-full shrink-0 animate-pulse',
                isActive
                  ? 'bg-gold shadow-[0_0_7px_rgba(245,200,66,0.9)]'
                  : 'bg-emerald-400 shadow-[0_0_5px_rgba(52,211,153,0.8)]',
              )}
            />
          )}

          {status === 'soon' && (
            <span className="font-mono text-[9px] tracking-widest bg-gray-100 text-gray-400 border border-gray-200 dark:bg-mi-900/80 dark:text-mi-600 dark:border-mi-700/50 px-1.5 py-px rounded-sm uppercase leading-normal">
              pronto
            </span>
          )}
        </>
      )}
    </Link>
  )
}

// ── Sidebar ───────────────────────────────────────────────────────────────────

export default function Sidebar() {
  const { isDark, toggle } = useTheme()
  const { user, logout }   = useAuth()

  const [collapsed, setCollapsed] = useState<boolean>(() =>
    localStorage.getItem('sigaf_sidebar') === 'collapsed',
  )

  const [closedSections, setClosedSections] = useState<Set<string>>(() =>
    loadSet('sigaf_sections'),
  )

  function toggleSidebar() {
    const next = !collapsed
    setCollapsed(next)
    localStorage.setItem('sigaf_sidebar', next ? 'collapsed' : 'expanded')
  }

  function toggleSection(id: string) {
    if (collapsed) return
    setClosedSections(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      saveSet('sigaf_sections', next)
      return next
    })
  }

  const initials = user ? getInitials(user.name) : '?'

  return (
    <aside
      className={cn(
        'relative flex flex-col shrink-0 h-full overflow-hidden select-none',
        'bg-white dark:bg-[#06010F]',
        'border-r border-gray-200 dark:border-white/[0.06]',
        'transition-[width] duration-300 ease-in-out',
        collapsed ? 'w-[60px]' : 'w-[220px]',
      )}
    >
      {/* Top ambient glow */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-mi-300/[0.08] dark:from-mi-700/[0.12] to-transparent z-0" />
      {/* Bottom vignette */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-gray-100/80 dark:from-black/40 to-transparent z-0" />

      {/* ── Logo / Header ─────────────────────────────────────────── */}
      <div
        className={cn(
          'relative z-10 h-14 shrink-0 flex items-center',
          'border-b border-gray-200 dark:border-white/[0.06]',
          collapsed ? 'justify-center px-0' : 'px-3 gap-2.5 justify-between',
        )}
      >
        <div className={cn('flex items-center gap-2.5 min-w-0', collapsed && 'justify-center')}>
          <img
            src="/escudo.webp"
            alt="SIGAF"
            className="escudo-img w-7 h-7 shrink-0 object-contain"
          />
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span className="font-syne font-bold text-[14px] text-gray-900 dark:text-white tracking-wide leading-none">
                SIGAF
              </span>
              <span className="font-mono text-[9px] text-gray-400 dark:text-mi-500 tracking-[0.16em] uppercase leading-none mt-[3px]">
                Activos Fijos
              </span>
            </div>
          )}
        </div>

        {!collapsed && (
          <button
            onClick={toggleSidebar}
            className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:text-mi-700 dark:hover:text-mi-300 dark:hover:bg-white/[0.05] transition-colors"
            title="Colapsar menú"
          >
            <ChevronLeft size={13} />
          </button>
        )}
      </div>

      {/* ── Nav ──────────────────────────────────────────────────── */}
      <nav className="relative z-10 flex-1 flex flex-col overflow-y-auto overflow-x-hidden py-3 px-2 gap-0">
        {NAV_SECTIONS.map((section, idx) => {
          const isClosed = closedSections.has(section.id)

          return (
            <div key={section.id} className={cn(idx > 0 && 'mt-3')}>

              {!collapsed ? (
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full flex items-center gap-1.5 px-1.5 mb-1.5 group"
                >
                  <span className="font-mono text-[9px] tracking-[0.2em] text-gray-400 dark:text-mi-700 uppercase whitespace-nowrap group-hover:text-gray-600 dark:group-hover:text-mi-400 transition-colors duration-150">
                    {section.title}
                  </span>
                  <div className="flex-1 h-px bg-gradient-to-r from-gray-300/70 dark:from-mi-800/80 to-transparent" />
                  <ChevronDown
                    size={9}
                    className={cn(
                      'shrink-0 text-gray-300 dark:text-mi-700 group-hover:text-gray-500 dark:group-hover:text-mi-500 transition-all duration-200',
                      isClosed && '-rotate-90',
                    )}
                  />
                </button>
              ) : (
                idx > 0 && (
                  <div className="h-px bg-gray-200 dark:bg-white/[0.05] mx-2 mb-2" />
                )
              )}

              <div
                className={cn(
                  'flex flex-col gap-0.5 overflow-hidden',
                  'transition-[max-height,opacity] duration-200 ease-in-out',
                  !collapsed && isClosed
                    ? 'max-h-0 opacity-0'
                    : 'max-h-[400px] opacity-100',
                )}
              >
                {section.items.map(item => (
                  <NavItemRow key={item.to} item={item} collapsed={collapsed} />
                ))}
              </div>
            </div>
          )
        })}
      </nav>

      {/* ── User card / Footer ────────────────────────────────────── */}
      <div className="relative z-10 shrink-0 border-t border-gray-200 dark:border-white/[0.06] p-2">

        {!collapsed ? (
          <div className="rounded-xl border border-gray-200 bg-gray-50 dark:border-white/[0.07] dark:bg-white/[0.03] p-2.5">
            {/* User info row */}
            <div className="flex items-center gap-2.5 mb-2.5">
              <div className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center font-bold text-[11px] bg-gradient-to-br from-gold to-mi-400 text-mi-950">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-semibold text-gray-900 dark:text-mi-100 truncate leading-none">
                  {user?.name}
                </p>
                <p className="text-[10px] text-gray-500 dark:text-mi-600 truncate leading-none mt-[3px] font-mono">
                  {user?.email}
                </p>
              </div>
            </div>

            {/* Action row */}
            <div className="flex gap-1">
              <button
                onClick={toggle}
                title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
                className="flex-1 flex items-center justify-center gap-1.5 py-[7px] rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-mi-500 dark:hover:text-mi-100 dark:hover:bg-white/[0.06] transition-colors text-[11px]"
              >
                {isDark
                  ? <Sun  size={12} className="text-gold/80" />
                  : <Moon size={12} />
                }
                <span>{isDark ? 'Claro' : 'Oscuro'}</span>
              </button>

              <div className="w-px bg-gray-200 dark:bg-white/[0.06] self-stretch" />

              <button
                onClick={logout}
                title="Cerrar sesión"
                className="flex-1 flex items-center justify-center gap-1.5 py-[7px] rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 dark:text-mi-500 dark:hover:text-red-400 dark:hover:bg-red-950/20 transition-colors text-[11px]"
              >
                <LogOut size={12} />
                <span>Salir</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1.5">
            {/* Avatar */}
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-[11px] bg-gradient-to-br from-gold to-mi-400 text-mi-950"
              title={user?.name}
            >
              {initials}
            </div>

            {/* Theme toggle */}
            <button
              onClick={toggle}
              title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gold hover:bg-gray-100 dark:text-mi-600 dark:hover:text-gold dark:hover:bg-white/[0.06] transition-colors"
            >
              {isDark ? <Sun size={13} /> : <Moon size={13} />}
            </button>

            {/* Expand */}
            <button
              onClick={toggleSidebar}
              title="Expandir menú"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:text-mi-700 dark:hover:text-mi-200 dark:hover:bg-white/[0.06] transition-colors"
            >
              <ChevronRight size={13} />
            </button>

            {/* Logout */}
            <button
              onClick={logout}
              title="Cerrar sesión"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 dark:text-mi-700 dark:hover:text-red-400 dark:hover:bg-red-950/20 transition-colors"
            >
              <LogOut size={13} />
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}
