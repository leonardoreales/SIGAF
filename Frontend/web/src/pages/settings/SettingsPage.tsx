import { useAuth }  from '../../context/AuthContext'
import { useRole }  from '../../hooks/useRole'
import {
  Crown, Shield, Package, Eye,
  Briefcase, Building2, Mail,
  ShieldCheck, CheckCircle2, XCircle,
  LayoutDashboard, Boxes, ArrowLeftRight,
  ShoppingCart, Users, ChevronRight,
} from 'lucide-react'
import { UserManagementTable } from './UserManagementTable'

// ── Configuración de permisos por rol ────────────────────────────────────────

type PermLevel = 'full' | 'partial' | 'read' | 'none'

interface ModulePerm {
  label:   string
  icon:    React.ReactNode
  desc:    Record<string, string>
  level:   Record<string, PermLevel>
}

const MODULES: ModulePerm[] = [
  {
    label: 'Dashboard',
    icon:  <LayoutDashboard size={15} />,
    desc:  {
      ADMIN:        'Ver todas las estadísticas',
      ACTIVOS_FIJOS:'Ver todas las estadísticas',
      COMPRAS:      'Sin acceso',
      VIEWER:       'Ver estadísticas (solo lectura)',
    },
    level: { ADMIN: 'full', ACTIVOS_FIJOS: 'full', COMPRAS: 'none', VIEWER: 'read' },
  },
  {
    label: 'Inventario',
    icon:  <Boxes size={15} />,
    desc:  {
      ADMIN:        'Crear, editar y eliminar activos',
      ACTIVOS_FIJOS:'Crear, editar y eliminar activos',
      COMPRAS:      'Sin acceso',
      VIEWER:       'Solo lectura',
    },
    level: { ADMIN: 'full', ACTIVOS_FIJOS: 'full', COMPRAS: 'none', VIEWER: 'read' },
  },
  {
    label: 'Traslados',
    icon:  <ArrowLeftRight size={15} />,
    desc:  {
      ADMIN:        'Crear, gestionar y completar traslados',
      ACTIVOS_FIJOS:'Crear, gestionar y completar traslados',
      COMPRAS:      'Sin acceso',
      VIEWER:       'Sin acceso',
    },
    level: { ADMIN: 'full', ACTIVOS_FIJOS: 'full', COMPRAS: 'none', VIEWER: 'none' },
  },
  {
    label: 'Recepciones',
    icon:  <ShoppingCart size={15} />,
    desc:  {
      ADMIN:        'Acceso completo',
      ACTIVOS_FIJOS:'Sin acceso',
      COMPRAS:      'Registrar recepciones',
      VIEWER:       'Sin acceso',
    },
    level: { ADMIN: 'full', ACTIVOS_FIJOS: 'none', COMPRAS: 'partial', VIEWER: 'none' },
  },
  {
    label: 'Usuarios',
    icon:  <Users size={15} />,
    desc:  {
      ADMIN:        'Administrar roles, cargos y dependencias',
      ACTIVOS_FIJOS:'Sin acceso',
      COMPRAS:      'Sin acceso',
      VIEWER:       'Sin acceso',
    },
    level: { ADMIN: 'full', ACTIVOS_FIJOS: 'none', COMPRAS: 'none', VIEWER: 'none' },
  },
]

// ── Configuración visual por rol ─────────────────────────────────────────────

const ROLE_CONFIG = {
  ADMIN: {
    label:      'Administrador',
    icon:       <Crown size={14} />,
    glowClass:  'shadow-[0_0_60px_rgba(245,200,66,0.18)] dark:shadow-[0_0_80px_rgba(245,200,66,0.12)]',
    ringClass:  'ring-4 ring-gold/40',
    badgeCls:   'bg-gold text-mi-950 border border-gold/60',
    bannerCls:  'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/50 text-amber-800 dark:text-amber-300',
    glowBg:     'from-gold/10 via-transparent',
  },
  ACTIVOS_FIJOS: {
    label:      'Activos Fijos',
    icon:       <Shield size={14} />,
    glowClass:  'shadow-[0_0_40px_rgba(0,0,0,0.3)]',
    ringClass:  'ring-4 ring-white/10',
    badgeCls:   'bg-mi-600 text-white border border-mi-500/60',
    bannerCls:  'bg-gray-50 dark:bg-white/[0.03] border-gray-200 dark:border-white/[0.08] text-gray-700 dark:text-mi-200',
    glowBg:     'from-white/[0.03] via-transparent',
  },
  COMPRAS: {
    label:      'Compras',
    icon:       <Package size={14} />,
    glowClass:  'shadow-[0_0_40px_rgba(168,85,247,0.12)]',
    ringClass:  'ring-4 ring-purple-400/30',
    badgeCls:   'bg-purple-600 text-white border border-purple-500/60',
    bannerCls:  'bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800/50 text-purple-800 dark:text-purple-300',
    glowBg:     'from-purple-500/8 via-transparent',
  },
  VIEWER: {
    label:      'Espectador',
    icon:       <Eye size={14} />,
    glowClass:  '',
    ringClass:  'ring-4 ring-gray-300/40 dark:ring-mi-600/40',
    badgeCls:   'bg-gray-500 text-white border border-gray-400/60',
    bannerCls:  'bg-gray-50 dark:bg-mi-800/60 border-gray-200 dark:border-mi-700/50 text-gray-600 dark:text-mi-400',
    glowBg:     'from-gray-400/5 via-transparent',
  },
} as const

// ── Helpers ──────────────────────────────────────────────────────────────────

function levelBadge(level: PermLevel) {
  if (level === 'full')    return <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium"><CheckCircle2 size={13} />Acceso completo</span>
  if (level === 'partial') return <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-medium"><CheckCircle2 size={13} />Acceso parcial</span>
  if (level === 'read')    return <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium"><CheckCircle2 size={13} />Solo lectura</span>
  return <span className="flex items-center gap-1 text-gray-400 dark:text-mi-500"><XCircle size={13} />Sin acceso</span>
}

// ── Componente principal ─────────────────────────────────────────────────────

export default function SettingsPage() {
  const { user }                     = useAuth()
  const { role, cargo, dependencia } = useRole()

  if (!user) return null

  const cfg = ROLE_CONFIG[role as keyof typeof ROLE_CONFIG] ?? ROLE_CONFIG.VIEWER
  const isAdmin = role === 'ADMIN'

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* ── Encabezado ──────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-syne font-bold text-gray-900 dark:text-mi-50 leading-tight">
          Configuración y Perfil
        </h1>
        <p className="text-sm text-gray-500 dark:text-mi-400 mt-1">
          Información personal, permisos y administración del sistema SIGAF.
        </p>
      </div>

      {/* ── Banner de rol ────────────────────────────────────────────────── */}
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium ${cfg.bannerCls}`}>
        <ShieldCheck size={17} className="shrink-0" />
        <span>
          {isAdmin
            ? 'Tienes acceso total de administrador al sistema SIGAF.'
            : role === 'ACTIVOS_FIJOS'
              ? 'Tienes acceso completo al módulo de Inventario y Traslados.'
              : role === 'COMPRAS'
                ? 'Tu acceso está limitado al módulo de Recepciones.'
                : 'Tienes acceso de solo lectura al sistema.'}
        </span>
      </div>

      {/* ── Tarjeta Hero de Perfil ───────────────────────────────────────── */}
      <div className={`relative overflow-hidden rounded-2xl border border-gray-200 dark:border-white/[0.07] bg-white dark:bg-mi-900 ${cfg.glowClass} transition-shadow duration-500`}>

        {/* Glow de fondo por rol */}
        <div className={`absolute inset-0 bg-gradient-to-br ${cfg.glowBg} to-transparent pointer-events-none`} />

        <div className="relative z-10 p-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-7">

            {/* Avatar */}
            <div className="shrink-0 relative">
              {user.picture ? (
                <img
                  src={user.picture}
                  alt={user.name}
                  referrerPolicy="no-referrer"
                  className={`w-28 h-28 rounded-full object-cover ${cfg.ringClass} shadow-xl`}
                />
              ) : (
                <div className={`w-28 h-28 rounded-full flex items-center justify-center font-bold text-4xl bg-gradient-to-br from-gold to-mi-400 text-mi-950 shadow-xl ${cfg.ringClass}`}>
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}

              {/* Badge de rol sobre el avatar */}
              <div className="absolute -bottom-3 inset-x-0 flex justify-center">
                <span className={`inline-flex items-center gap-1.5 text-[10px] font-mono tracking-widest uppercase px-3 py-1 rounded-full shadow-lg ${cfg.badgeCls}`}>
                  {cfg.icon}
                  {cfg.label}
                </span>
              </div>
            </div>

            {/* Info principal */}
            <div className="flex-1 text-center sm:text-left pt-1">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white leading-tight">
                {user.name}
              </h2>
              <div className="flex items-center justify-center sm:justify-start gap-2 mt-1.5 text-sm text-gray-500 dark:text-mi-400">
                <Mail size={13} />
                <span className="font-mono">{user.email}</span>
              </div>

              {/* Chips de estado */}
              <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Cuenta activa
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs bg-gray-100 dark:bg-mi-800 text-gray-600 dark:text-mi-400 border border-gray-200 dark:border-mi-700/40 font-mono">
                  @americana.edu.co
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Separador */}
        <div className="h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-white/[0.06] to-transparent" />

        {/* ── Grid: Cargo, Dependencia, Acceso ──────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-gray-100 dark:divide-white/[0.04] bg-gray-50/50 dark:bg-white/[0.01]">

          <DetailCell
            icon={<Briefcase size={18} />}
            iconCls="text-blue-500 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400"
            label="Cargo"
            value={cargo || 'No especificado'}
          />
          <DetailCell
            icon={<Building2 size={18} />}
            iconCls="text-purple-500 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400"
            label="Dependencia"
            value={dependencia || 'No especificada'}
          />
          <DetailCell
            icon={cfg.icon}
            iconCls={isAdmin
              ? 'text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-gold'
              : 'text-emerald-500 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400'}
            label="Nivel de Acceso"
            value={cfg.label}
          />
        </div>
      </div>

      {/* ── Permisos del Rol ─────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-gray-200 dark:border-white/[0.07] bg-white dark:bg-mi-900 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-white/[0.05] flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-mi-50 text-sm">Permisos del Rol</h3>
            <p className="text-xs text-gray-500 dark:text-mi-400 mt-0.5">Módulos a los que tienes acceso según tu rol asignado.</p>
          </div>
          <span className={`inline-flex items-center gap-1.5 text-xs font-mono font-medium px-2.5 py-1 rounded-lg ${cfg.badgeCls}`}>
            {cfg.icon}
            {role}
          </span>
        </div>

        <div className="divide-y divide-gray-50 dark:divide-white/[0.03]">
          {MODULES.map((mod) => {
            const level = mod.level[role] ?? 'none'
            return (
              <div key={mod.label}
                className="flex items-center justify-between px-6 py-3.5 hover:bg-gray-50/60 dark:hover:bg-white/[0.02] transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-gray-400 dark:text-mi-500">{mod.icon}</span>
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-mi-100">{mod.label}</p>
                    <p className="text-xs text-gray-400 dark:text-mi-500">{mod.desc[role] ?? mod.desc.VIEWER}</p>
                  </div>
                </div>
                <div className="text-xs shrink-0 ml-4">
                  {levelBadge(level)}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Panel de Administración (solo ADMIN) ─────────────────────────── */}
      {isAdmin && (
        <div className="rounded-2xl border border-amber-200/60 dark:border-amber-800/30 bg-white dark:bg-mi-900 overflow-hidden">
          <div className="px-6 py-4 border-b border-amber-100 dark:border-amber-900/30 bg-amber-50/50 dark:bg-amber-950/10 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center text-amber-600 dark:text-gold">
              <Crown size={16} />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 dark:text-mi-50 text-sm flex items-center gap-2">
                Gestión de Usuarios
                <span className="text-[10px] font-mono text-amber-600 dark:text-gold/80 bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 rounded-full">ADMIN</span>
              </h3>
              <p className="text-xs text-gray-500 dark:text-mi-400 mt-0.5">Asigna roles, cargos y dependencias a los usuarios del sistema.</p>
            </div>
            <ChevronRight size={16} className="text-gray-300 dark:text-mi-400" />
          </div>
          <UserManagementTable />
        </div>
      )}

    </div>
  )
}

// ── Sub-componente: celda de detalle ─────────────────────────────────────────

function DetailCell({
  icon, iconCls, label, value,
}: {
  icon: React.ReactNode
  iconCls: string
  label: string
  value: string
}) {
  return (
    <div className="p-5 flex flex-col items-center text-center gap-2 group hover:bg-white/60 dark:hover:bg-white/[0.02] transition-colors">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${iconCls} group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <h4 className="text-[10px] font-mono text-gray-400 dark:text-mi-500 uppercase tracking-widest">{label}</h4>
      <p className="text-sm font-semibold text-gray-900 dark:text-mi-100">{value}</p>
    </div>
  )
}
