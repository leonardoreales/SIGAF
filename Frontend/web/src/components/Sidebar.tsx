import { useState } from 'react'
import { Link, useMatch, useNavigate } from 'react-router-dom'
import {
  Package2, ArrowLeftRight, History, BarChart3,
  Trash2, ClipboardList, FileText, LayoutDashboard,
  ChevronLeft, ChevronRight, ChevronDown, FileDown,
  Sun, Moon, LogOut, Lock, Settings, Wrench
} from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { useAuth }  from '../context/AuthContext'
import { useRole }  from '../hooks/useRole'
import { cn }       from '../lib/utils'

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

const BASE_NAV_SECTIONS: NavSection[] = [
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
      { to: '/transfers',   icon: ArrowLeftRight, label: 'Traslados',     status: 'live' },
      { to: '/maintenance', icon: Wrench,         label: 'Mantenimiento', status: 'live' },
      { to: '/history',     icon: History,        label: 'Historial',     status: 'soon' },
      { to: '/writeoffs',   icon: Trash2,         label: 'Bajas',         status: 'live' },
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
      { to: '/dashboard',  icon: LayoutDashboard, label: 'Dashboard',    status: 'live' },
      { to: '/statistics', icon: BarChart3,       label: 'Estadísticas', status: 'live' },
      { to: '/reports',    icon: FileText,        label: 'Reportes',     status: 'soon' },
    ],
  },
]

const COMPRAS_NAV_SECTIONS: NavSection[] = [
  {
    id: 'compras',
    title: 'Compras',
    items: [
      { to: '/recepciones', icon: Package2, label: 'Recepciones', status: 'live' },
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
          'opacity-25 cursor-not-allowed',
          'text-gray-400 dark:text-mi-500',
        )}
      >
        <Icon size={15} className="shrink-0" />
        {!collapsed && (
          <>
            <span className="flex-1 truncate">{label}</span>
            <Lock size={10} className="shrink-0 text-gray-300 dark:text-mi-500" />
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
              'text-gold dark:text-gold',
              'bg-gradient-to-r from-gold/[0.12] to-transparent',
              'border-l-[3px] border-gold',
              'pl-[5px]',
            ].join(' ')
          : status === 'soon'
          ? 'text-white/30 hover:text-white/50 hover:bg-white/[0.02]'
          : 'text-white/60 hover:text-gold hover:bg-gold/[0.05]',
      )}
    >
      <Icon
        size={15}
        className={cn(
          'shrink-0 transition-all duration-150',
          isActive && 'drop-shadow-[0_0_6px_rgba(245,200,66,0.6)]',
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
                  ? 'bg-gold shadow-[0_0_6px_rgba(245,200,66,0.8)]'
                  : 'bg-emerald-400 shadow-[0_0_4px_rgba(52,211,153,0.7)]',
              )}
            />
          )}

          {status === 'soon' && (
            <span className="font-mono text-[9px] tracking-widest bg-gray-100 text-gray-400 border border-gray-200 dark:bg-mi-800 dark:text-mi-400 dark:border-mi-700/50 px-1.5 py-px rounded-sm uppercase leading-normal">
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
  const { isAdmin, isCompras } = useRole()
  const navigate           = useNavigate()

  const navSections = isAdmin
    ? [...BASE_NAV_SECTIONS, ...COMPRAS_NAV_SECTIONS]
    : isCompras
    ? COMPRAS_NAV_SECTIONS
    : BASE_NAV_SECTIONS

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
        'relative flex flex-col shrink-0 h-full overflow-hidden select-none transition-all duration-500',
        'bg-[#0D1B4A] dark:bg-[#060E28]',
        'border-r border-gold/10 dark:border-gold/5',
        collapsed ? 'w-[64px]' : 'w-[240px]',
      )}
    >
      {/* Ambient glow — top */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40
        bg-gradient-to-b from-gold/[0.03] dark:from-gold/[0.04] to-transparent z-0" />
      {/* Vignette — bottom */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20
        bg-gradient-to-t from-gray-100/60 dark:from-black/50 to-transparent z-0" />

      {/* ── Logo / Header ─────────────────────────────────────────── */}
      <div
        className={cn(
          'relative z-10 h-16 shrink-0 flex items-center',
          'border-b border-gold/10',
          collapsed ? 'justify-center px-0' : 'px-4 gap-3 justify-between',
        )}
      >
        <div className={cn('flex items-center gap-2.5 min-w-0', collapsed && 'justify-center')}>
          <img
            src="/logo-americana.png"
            alt="SIGAF"
            className="escudo-img w-7 h-7 shrink-0 object-contain"
          />
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span className="font-syne font-bold text-[15px] text-white tracking-wide leading-none">
                SIGAF
              </span>
              <span className="font-mono text-[9px] text-gold/60 tracking-[0.2em] uppercase leading-none mt-[4px]">
                Activos Fijos
              </span>
            </div>
          )}
        </div>

        {/* Expand / Collapse toggle — always visible */}
        <button
          onClick={toggleSidebar}
          className={cn(
            'flex items-center justify-center shrink-0 rounded-md transition-colors',
            'text-gray-400 hover:text-gray-700 hover:bg-gray-100',
            'dark:text-mi-400 dark:hover:text-mi-200 dark:hover:bg-white/[0.06]',
            collapsed ? 'w-8 h-8' : 'w-6 h-6',
          )}
          title={collapsed ? 'Expandir menú' : 'Colapsar menú'}
        >
          {collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
        </button>
      </div>

      {/* ── Nav ──────────────────────────────────────────────────── */}
      <nav className="relative z-10 flex-1 flex flex-col overflow-y-auto overflow-x-hidden py-3 px-2 gap-0">
        {navSections.map((section, idx) => {
          const isClosed = closedSections.has(section.id)

          return (
            <div key={section.id} className={cn(idx > 0 && 'mt-3')}>

              {!collapsed ? (
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full flex items-center gap-1.5 px-1.5 mb-1.5 group"
                >
                  <span className="font-mono text-[9px] tracking-[0.2em] text-gray-400 dark:text-mi-500 uppercase whitespace-nowrap group-hover:text-gray-600 dark:group-hover:text-mi-300 transition-colors duration-150">
                    {section.title}
                  </span>
                  <div className="flex-1 h-px bg-gradient-to-r from-gray-200/80 dark:from-mi-800/90 to-transparent" />
                  <ChevronDown
                    size={9}
                    className={cn(
                      'shrink-0 text-gray-300 dark:text-mi-500 group-hover:text-gray-400 dark:group-hover:text-mi-400 transition-all duration-200',
                      isClosed && '-rotate-90',
                    )}
                  />
                </button>
              ) : (
                idx > 0 && (
                  <div className="h-px bg-gray-100 dark:bg-white/[0.04] mx-2 mb-2" />
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
      <div className="relative z-10 shrink-0 border-t border-white/[0.05] p-3">

        {!collapsed ? (
          <div className={cn(
            "group relative rounded-2xl p-3 overflow-hidden transition-all duration-500",
            "bg-white/[0.03] dark:bg-white/[0.01]",
            "border border-white/10 dark:border-gold/10",
            "hover:border-gold/30 hover:shadow-[0_8px_32px_rgba(0,0,0,0.3)] dark:hover:shadow-[0_8px_32px_rgba(191,139,48,0.12)]",
            "backdrop-blur-xl"
          )}>
            {/* Ambient gold glow behind avatar on hover */}
            <div className="absolute -top-10 -left-10 w-24 h-24 bg-gold/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            
            {/* User info */}
            <div className="flex items-center gap-3 mb-4 relative z-10">
              <div className="relative">
                <div className={cn(
                  "w-10 h-10 rounded-xl shrink-0 flex items-center justify-center font-bold text-[14px]",
                  "bg-gradient-to-br from-gold-300 via-gold-500 to-gold-700 text-navy shadow-lg shadow-gold/20",
                  "transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3"
                )}>
                  {initials}
                </div>
                {/* Status indicator */}
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-[#0D1B4A] dark:border-[#060E28] rounded-full shadow-sm" />
              </div>
              
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-bold text-white dark:text-white truncate leading-none tracking-tight">
                  {user?.name}
                </p>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span className="w-1 h-1 rounded-full bg-gold/40" />
                  <p className="text-[10px] text-gold/60 truncate leading-none font-mono tracking-tighter uppercase">
                    Usuario Activo
                  </p>
                </div>
              </div>
            </div>

            {/* Action Grid */}
            <div className="grid grid-cols-4 gap-1.5 relative z-10">
              <button
                onClick={() => navigate('/settings')}
                title="Configuración y Perfil"
                className="col-span-2 flex items-center justify-center gap-2 py-2 rounded-lg bg-gold/10 hover:bg-gold/20 text-gold border border-gold/20 hover:border-gold/40 transition-all duration-200 text-[11px] font-bold active:scale-95"
              >
                <Settings size={13} className="shrink-0" />
                <span>PERFIL</span>
              </button>

              <button
                onClick={toggle}
                title={isDark ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
                className="flex items-center justify-center py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-gold transition-all duration-200 active:scale-95 border border-transparent hover:border-white/10"
              >
                {isDark ? <Sun size={14} /> : <Moon size={14} />}
              </button>

              <button
                onClick={logout}
                title="Cerrar Sesión"
                className="flex items-center justify-center py-2 rounded-lg bg-white/5 hover:bg-red-500/10 text-white/60 hover:text-red-400 transition-all duration-200 active:scale-95 border border-transparent hover:border-white/10"
              >
                <LogOut size={14} />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            {/* Avatar Collapsed */}
            <div className="relative group cursor-pointer" onClick={() => navigate('/settings')}>
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center font-bold text-[12px]",
                "bg-gradient-to-br from-gold-300 via-gold-500 to-gold-700 text-navy shadow-lg shadow-gold/20",
                "transition-all duration-300 group-hover:scale-110 group-hover:shadow-gold/40"
              )}>
                {initials}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-[#0D1B4A] dark:border-[#060E28] rounded-full" />
            </div>

            <div className="flex flex-col gap-1 w-full items-center">
              <button
                onClick={() => navigate('/settings')}
                title="Configuración"
                className="w-9 h-9 rounded-lg flex items-center justify-center text-white/40 hover:text-gold hover:bg-gold/10 transition-all duration-200"
              >
                <Settings size={14} />
              </button>

              <button
                onClick={toggle}
                title={isDark ? 'Modo Claro' : 'Modo Oscuro'}
                className="w-9 h-9 rounded-lg flex items-center justify-center text-white/40 hover:text-gold hover:bg-gold/10 transition-all duration-200"
              >
                {isDark ? <Sun size={14} /> : <Moon size={14} />}
              </button>

              <button
                onClick={logout}
                title="Cerrar sesión"
                className="w-9 h-9 rounded-lg flex items-center justify-center text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
              >
                <LogOut size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}
