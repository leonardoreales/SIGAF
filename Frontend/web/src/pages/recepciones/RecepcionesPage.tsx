import { useNavigate } from 'react-router-dom'
import {
  Plus, Package, Layers, ShieldCheck, Hash,
  ArrowRight, Info,
} from 'lucide-react'
import { cn } from '../../lib/utils'

// ── Guide card ────────────────────────────────────────────────────────────────

function GuideStep({
  step, icon: Icon, title, desc,
}: { step: number; icon: React.ElementType; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3.5">
      <div className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center font-syne font-bold text-xs bg-gradient-to-br from-gold/80 to-mi-400/80 text-mi-950">
        {step}
      </div>
      <div className="min-w-0 pt-0.5">
        <div className="flex items-center gap-2 mb-0.5">
          <Icon size={13} className="shrink-0 text-gray-400 dark:text-mi-500" />
          <p className="text-sm font-semibold text-gray-800 dark:text-mi-100">{title}</p>
        </div>
        <p className="text-xs text-gray-500 dark:text-mi-400 leading-relaxed">{desc}</p>
      </div>
    </div>
  )
}

// ── Stat card (stub) ──────────────────────────────────────────────────────────

function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub: string; color: string }) {
  return (
    <div className={cn(
      'flex flex-col gap-1 rounded-xl border px-4 py-3.5',
      'bg-white dark:bg-white/[0.02]',
      color,
    )}>
      <p className="text-xs text-gray-500 dark:text-mi-500">{label}</p>
      <p className="text-2xl font-syne font-bold text-gray-900 dark:text-mi-50">{value}</p>
      <p className="text-[11px] text-gray-400 dark:text-mi-400">{sub}</p>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function RecepcionesPage() {
  const navigate = useNavigate()

  return (
    <div className="space-y-7">

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-syne font-bold text-gray-900 dark:text-mi-50">
            Recepciones de Compras
          </h1>
          <p className="text-sm text-gray-500 dark:text-mi-400 mt-0.5">
            Registra los activos nuevos que entran desde el área de compras.
          </p>
        </div>
        <button
          onClick={() => navigate('/recepciones/nueva')}
          className="
            flex items-center gap-2 text-sm font-medium px-4 py-2.5 rounded-xl transition-colors shrink-0
            bg-gray-900 hover:bg-gray-800 text-white
            dark:bg-gold dark:hover:bg-gold-300 dark:text-mi-950 dark:font-semibold
          "
        >
          <Plus size={15} />
          Nueva Recepción
        </button>
      </div>

      {/* ── Stats (stub) ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          label="Total recepciones"
          value="—"
          sub="Disponible próximamente"
          color="border-gray-100 dark:border-white/[0.06]"
        />
        <StatCard
          label="Pendientes revisión"
          value="—"
          sub="Esperando activos fijos"
          color="border-amber-100 dark:border-amber-900/30"
        />
        <StatCard
          label="Verificadas"
          value="—"
          sub="Activos activados"
          color="border-emerald-100 dark:border-emerald-900/30"
        />
        <StatCard
          label="Activos ingresados"
          value="—"
          sub="Mes actual"
          color="border-blue-100 dark:border-blue-900/30"
        />
      </div>

      {/* ── Main content: empty state + guide ───────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5">

        {/* Empty state */}
        <div className="
          flex flex-col items-center justify-center gap-5 py-16
          rounded-2xl border border-dashed border-gray-200 dark:border-white/[0.07]
          bg-gray-50/40 dark:bg-white/[0.01]
          text-center
        ">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br from-mi-100 to-mi-50 dark:from-mi-800/60 dark:to-mi-900/60 shadow-inner">
            <Package size={24} className="text-mi-500 dark:text-mi-300" />
          </div>
          <div>
            <p className="text-base font-semibold text-gray-700 dark:text-mi-200">
              Sin recepciones registradas
            </p>
            <p className="text-sm text-gray-400 dark:text-mi-500 mt-1 max-w-xs mx-auto">
              Cuando registres tu primera recepción aparecerá aquí con su estado y seguimiento.
            </p>
          </div>
          <button
            onClick={() => navigate('/recepciones/nueva')}
            className="
              flex items-center gap-2 text-sm font-medium px-5 py-2.5 rounded-xl transition-colors
              bg-gray-900 dark:bg-mi-100 text-white dark:text-mi-900
              hover:opacity-90
            "
          >
            Registrar primera recepción
            <ArrowRight size={14} />
          </button>
        </div>

        {/* Guide panel */}
        <div className="
          rounded-2xl border border-gray-100 dark:border-white/[0.06]
          bg-white dark:bg-white/[0.02]
          p-5
        ">
          <div className="flex items-center gap-2 mb-5">
            <Info size={13} className="shrink-0 text-gray-400 dark:text-mi-500" />
            <p className="text-xs font-mono tracking-[0.15em] uppercase text-gray-400 dark:text-mi-400">
              Cómo funciona
            </p>
          </div>

          <div className="space-y-5">
            <GuideStep
              step={1}
              icon={Hash}
              title="Datos del lote"
              desc="Ingresa la Orden de Compra o Factura y el edificio donde llegan los activos. Estos datos aplican a toda la recepción."
            />
            <GuideStep
              step={2}
              icon={Layers}
              title="Ítems en la grilla"
              desc="Añade cada activo fila a fila. Usa Tab para moverte entre celdas y Enter para agregar una nueva fila. El campo Serial se adapta automáticamente según el tipo de activo."
            />
            <GuideStep
              step={3}
              icon={ShieldCheck}
              title="Enviar a revisión"
              desc="Al enviar, el equipo de Activos Fijos recibe una notificación y verifica cada ítem antes de activarlo en el inventario."
            />
          </div>

          {/* Serial rules quick ref */}
          <div className="mt-6 pt-5 border-t border-gray-100 dark:border-white/[0.06]">
            <p className="text-xs font-medium text-gray-500 dark:text-mi-400 mb-3">
              Reglas de serial por tipo
            </p>
            <div className="space-y-1.5 text-xs">
              {[
                { label: 'Equipos de cómputo',    rule: 'Requerido',    cls: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30' },
                { label: 'Maquinaria y equipo',   rule: 'Requerido',    cls: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30' },
                { label: 'Transporte',             rule: 'Requerido',    cls: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30' },
                { label: 'Equipo médico',          rule: 'Opcional',     cls: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30' },
                { label: 'Muebles y enseres',      rule: 'No aplica',    cls: 'text-gray-500 dark:text-mi-500 bg-gray-50 dark:bg-mi-800/40' },
                { label: 'Plantas / ductos',       rule: 'No aplica',    cls: 'text-gray-500 dark:text-mi-500 bg-gray-50 dark:bg-mi-800/40' },
              ].map(({ label, rule, cls }) => (
                <div key={label} className="flex items-center justify-between gap-2">
                  <span className="text-gray-600 dark:text-mi-300">{label}</span>
                  <span className={cn('px-1.5 py-0.5 rounded font-medium', cls)}>
                    {rule}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
