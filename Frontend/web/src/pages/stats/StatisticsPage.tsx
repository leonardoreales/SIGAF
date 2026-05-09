import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { 
  Building2, Layers, MapPin, Briefcase, 
  ChevronRight, ArrowLeft, BarChart3, Filter,
  TrendingUp, Box, Search, Download
} from 'lucide-react'
import { cn, fmtCOP } from '../../lib/utils'
import DistributionChart from '../dashboard/DistributionChart'

interface StatItem {
  building?: string
  floor?: string
  location?: string
  area?: string
  type?: string
  status?: string
  criticality?: string
  cantidad: number
  valor_total: string
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export default function StatisticsPage() {
  const [hierarchy, setHierarchy] = useState<{ type: string; value: string; label: string }[]>([])
  const [groupBy, setGroupBy] = useState<string>('building')
  const [searchTerm, setSearchTerm] = useState('')

  // Filtros dinámicos basados en la jerarquía
  const filters: Record<string, string | undefined> = {
    buildingName: hierarchy.find(h => h.type === 'building')?.value,
    floor:        hierarchy.find(h => h.type === 'floor')?.value,
    areaName:      hierarchy.find(h => h.type === 'area')?.value,
  }

  const { data: stats = [], isLoading, error } = useQuery<StatItem[]>({
    queryKey: ['advanced-stats', groupBy, hierarchy],
    queryFn: async () => {
      const params = new URLSearchParams({ groupBy })
      Object.entries(filters).forEach(([k, v]) => {
        if (v) params.append(k, v)
      })
      
      console.log('Fetching stats with:', params.toString())
      const res = await fetch(`${API_URL}/assets/stats/advanced?${params}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('sigaf_token')}` }
      })
      if (!res.ok) {
        const text = await res.text()
        console.error('Fetch error:', res.status, text)
        throw new Error(`Error ${res.status}: ${text || 'Fallo en la API'}`)
      }
      const data = await res.json()
      console.log('Fetched data:', data)
      return data
    }
  })

  // Datos filtrados por búsqueda local
  const filteredStats = stats.filter(s => {
    const val = String((s as any)[groupBy] || '').toLowerCase()
    return val.includes(searchTerm.toLowerCase())
  })

  const chartItems = filteredStats.map(s => ({
    nombre: (s as any)[groupBy] || 'Sin especificar',
    cantidad: s.cantidad
  }))

  const totalActivos = stats.reduce((acc, curr) => acc + curr.cantidad, 0)
  const totalValor   = stats.reduce((acc, curr) => acc + parseFloat(curr.valor_total || '0'), 0)

  const handleDrillDown = (item: any) => {
    const value = item[groupBy]
    console.log('Drill down into:', groupBy, '=', value)
    if (!value || value === 'Sin especificar') return

    const newHierarchy = [...hierarchy, { type: groupBy, value: value, label: value }]
    setHierarchy(newHierarchy)

    // Lógica de progresión natural
    if (groupBy === 'building') setGroupBy('floor')
    else if (groupBy === 'floor') setGroupBy('location')
    else if (groupBy === 'area') setGroupBy('building')
    else setGroupBy('type') 
  }

  const handleBack = () => {
    const newHierarchy = [...hierarchy]
    const last = newHierarchy.pop()
    setHierarchy(newHierarchy)
    if (last) setGroupBy(last.type)
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-1000">
      
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gold/10 rounded-xl border border-gold/20">
              <BarChart3 size={20} className="text-gold" />
            </div>
            <h1 className="text-3xl font-syne font-bold text-gray-800 dark:text-mi-100 tracking-tight">
              Análisis Inteligente
            </h1>
          </div>
          <p className="text-sm text-gray-500 dark:text-mi-500 ml-[52px]">
            Explora la estructura de activos de la institución en tiempo real.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-mi-500 group-focus-within:text-gold transition-colors" size={14} />
            <input 
              type="text" 
              placeholder={`Buscar ${groupBy}...`}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white/50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.08] rounded-xl text-xs focus:ring-2 focus:ring-gold/20 focus:border-gold outline-none transition-all w-48 lg:w-64"
            />
          </div>
          <button className="p-2.5 bg-white/50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.08] rounded-xl text-gray-500 dark:text-mi-400 hover:text-gold transition-all">
            <Download size={16} />
          </button>
        </div>
      </div>

      {/* ── Feedback Visual ────────────────────────────────────────── */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-500 text-sm animate-in shake duration-500">
          <Box size={18} />
          <span>{error instanceof Error ? error.message : 'Error al conectar con la API'}</span>
        </div>
      )}
      
      {isLoading && (
        <div className="flex items-center gap-2 text-gold animate-pulse text-xs font-mono">
          <span className="live-dot" />
          <span>Cargando datos institucionales...</span>
        </div>
      )}

      {/* ── Selector de Dimensión & Breadcrumbs ─────────────────────── */}
      <div className="flex flex-col gap-4">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <button 
            onClick={() => { setHierarchy([]); setGroupBy('building'); }}
            className={cn(
              "shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] transition-all border",
              hierarchy.length === 0 
                ? "bg-mi-900 border-mi-800 text-gold shadow-lg shadow-gold/10" 
                : "bg-white/40 dark:bg-white/[0.02] border-gray-200 dark:border-white/[0.05] text-gray-400 dark:text-mi-400 hover:border-gold/30 hover:text-mi-200"
            )}
          >
            <Box size={14} />
            <span className="font-mono uppercase tracking-wider">Raíz</span>
          </button>

          {hierarchy.map((step, idx) => (
            <div key={idx} className="flex items-center gap-2 animate-in slide-in-from-left-4 duration-500" style={{ animationDelay: `${idx * 100}ms` }}>
              <ChevronRight size={14} className="text-gray-300 dark:text-mi-400" />
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gold/5 border border-gold/20 text-gold text-[12px] shadow-sm">
                <span className="opacity-50 uppercase font-mono text-[9px]">{step.type}:</span>
                <span className="font-semibold">{step.label}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Dimension Chips */}
        <div className="flex items-center gap-2">
          {[
            { id: 'building', label: 'Edificios', icon: Building2 },
            { id: 'area', label: 'Áreas', icon: Briefcase },
            { id: 'floor', label: 'Pisos', icon: Layers },
            { id: 'location', label: 'Ubicaciones', icon: MapPin },
            { id: 'type', label: 'Tipos', icon: Filter },
          ].map(dim => (
            <button
              key={dim.id}
              onClick={() => setGroupBy(dim.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-mono uppercase tracking-widest transition-all border",
                groupBy === dim.id 
                  ? "bg-gold text-mi-950 border-gold shadow-lg shadow-gold/20 scale-105 z-10" 
                  : "bg-white/50 dark:bg-white/[0.03] border-gray-200 dark:border-white/[0.08] text-gray-500 dark:text-mi-500 hover:border-gold/50 hover:text-gold"
              )}
            >
              <dim.icon size={13} />
              <span>{dim.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Dashboard Cards ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card-stats p-6 overflow-hidden relative group">
          <div className="absolute -right-4 -top-4 p-8 text-gold/[0.03] group-hover:text-gold/[0.08] transition-all duration-500">
            <TrendingUp size={120} strokeWidth={1} />
          </div>
          <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-gray-400 dark:text-mi-400 mb-2">
            Activos en Vista
          </p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-4xl font-syne font-bold text-gray-800 dark:text-mi-100">
              {totalActivos.toLocaleString('es-CO')}
            </h3>
            <span className="text-[10px] text-emerald-500 font-mono">+0.4%</span>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <div className="h-1 flex-1 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
               <div className="h-full bg-gold w-[65%]" />
            </div>
            <span className="text-[10px] font-mono text-gray-400 dark:text-mi-500">65% cap.</span>
          </div>
        </div>

        <div className="card-stats p-6 overflow-hidden relative group border-l-4 border-l-emerald-500">
          <div className="absolute -right-4 -top-4 p-8 text-emerald-500/[0.03] group-hover:text-emerald-500/[0.08] transition-all duration-500">
            <Briefcase size={120} strokeWidth={1} />
          </div>
          <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-gray-400 dark:text-mi-400 mb-2">
            Valoración Activa
          </p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-syne font-bold text-gray-800 dark:text-mi-100">
              {fmtCOP(totalValor)}
            </h3>
          </div>
          <p className="mt-4 text-[10px] text-gray-500 dark:text-mi-400">
            Basado en valor de adquisición reportado.
          </p>
        </div>

        <div className="card-stats p-6 overflow-hidden relative group">
          <div className="absolute -right-4 -top-4 p-8 text-mi-500/[0.03] group-hover:text-mi-500/[0.08] transition-all duration-500">
            <Layers size={120} strokeWidth={1} />
          </div>
          <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-gray-400 dark:text-mi-400 mb-2">
            Densidad de Datos
          </p>
          <h3 className="text-3xl font-syne font-bold text-gray-800 dark:text-mi-100">
            {stats.length} <span className="text-sm font-medium opacity-40">{groupBy}s</span>
          </h3>
          <p className="mt-4 text-[10px] text-gray-500 dark:text-mi-400">
            Promedio de {(totalActivos / (stats.length || 1)).toFixed(1)} activos por nodo.
          </p>
        </div>

        <div className="card-stats p-6 overflow-hidden relative group bg-gradient-to-br from-gold/5 to-transparent border-gold/10">
          <div className="absolute -right-4 -top-4 p-8 text-gold/10">
            <Filter size={120} strokeWidth={1} />
          </div>
          <p className="text-[10px] font-mono uppercase tracking-[0.2em] mb-2 text-gold">
            Dimensión Actual
          </p>
          <h3 className="text-3xl font-syne font-bold text-gray-800 dark:text-mi-100 capitalize">
            {groupBy}
          </h3>
          <div className="mt-4 flex items-center gap-1">
             <span className="live-dot" />
             <span className="text-[10px] font-mono text-gold uppercase tracking-tighter">Exploración Activa</span>
          </div>
        </div>
      </div>

      {/* ── Visualización Principal ───────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Gráfico de Barras */}
        <div className="space-y-4">
          <DistributionChart 
            title={`Distribución Proporcional de ${groupBy}`}
            items={chartItems.slice(0, 12)}
            loading={isLoading}
            color="bg-gold shadow-[0_0_12px_rgba(245,200,66,0.3)]"
          />
          
          <div className="grid grid-cols-2 gap-4">
             <div className="card p-4 flex flex-col items-center justify-center text-center gap-2 bg-emerald-500/5 border-emerald-500/10">
                <span className="text-[9px] font-mono uppercase tracking-widest text-emerald-500">Máximo</span>
                <span className="text-lg font-bold text-emerald-400">{chartItems[0]?.cantidad || 0}</span>
                <span className="text-[10px] text-gray-400 dark:text-mi-400 truncate w-full px-2">{chartItems[0]?.nombre}</span>
             </div>
             <div className="card p-4 flex flex-col items-center justify-center text-center gap-2 bg-mi-500/5 border-mi-500/10">
                <span className="text-[9px] font-mono uppercase tracking-widest text-mi-500">Mínimo</span>
                <span className="text-lg font-bold text-mi-400">{chartItems[chartItems.length-1]?.cantidad || 0}</span>
                <span className="text-[10px] text-gray-400 dark:text-mi-400 truncate w-full px-2">{chartItems[chartItems.length-1]?.nombre}</span>
             </div>
          </div>
        </div>

        {/* Tabla de Detalle con Drill-down */}
        <div className="card rounded-2xl overflow-hidden flex flex-col shadow-2xl shadow-black/20">
          <div className="p-6 border-b border-gray-100 dark:border-white/[0.05] bg-gray-50/30 dark:bg-white/[0.01] flex items-center justify-between">
            <div>
              <h3 className="text-[11px] font-mono tracking-[0.2em] uppercase text-gray-400 dark:text-mi-400 mb-1">
                Desglose Jerárquico
              </h3>
              <p className="text-[10px] text-gray-500 dark:text-mi-400">Haz clic en la flecha para profundizar en la estructura.</p>
            </div>
            {hierarchy.length > 0 && (
              <button 
                onClick={handleBack}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gold/10 text-gold text-[11px] hover:bg-gold/20 transition-all border border-gold/20 font-medium"
              >
                <ArrowLeft size={12} />
                <span>Volver Nivel</span>
              </button>
            )}
          </div>
          
          <div className="flex-1 overflow-auto max-h-[500px] custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 z-10 bg-white/95 dark:bg-[#0D1B4A]/95 backdrop-blur-md shadow-sm">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-mono uppercase tracking-widest text-gray-400 dark:text-mi-400">Nodo / Dimensión</th>
                  <th className="px-6 py-4 text-[10px] font-mono uppercase tracking-widest text-gray-400 dark:text-mi-400 text-right">Cantidad</th>
                  <th className="px-6 py-4 text-[10px] font-mono uppercase tracking-widest text-gray-400 dark:text-mi-400 text-right">Valor Est.</th>
                  <th className="px-6 py-4 text-[10px] font-mono uppercase tracking-widest text-gray-400 dark:text-mi-400 text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/[0.04]">
                {isLoading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-6 py-5"><div className="h-3 w-40 bg-gray-100 dark:bg-mi-800 rounded" /></td>
                      <td className="px-6 py-5"><div className="h-3 w-16 bg-gray-100 dark:bg-mi-800 rounded ml-auto" /></td>
                      <td className="px-6 py-5"><div className="h-3 w-24 bg-gray-100 dark:bg-mi-800 rounded ml-auto" /></td>
                      <td className="px-6 py-5"><div className="h-4 w-4 bg-gray-100 dark:bg-mi-800 rounded-full mx-auto" /></td>
                    </tr>
                  ))
                ) : filteredStats.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center gap-3 opacity-30">
                        <Search size={40} />
                        <p className="text-sm">No se encontraron resultados para "{searchTerm}"</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredStats.map((item, idx) => (
                    <tr 
                      key={idx} 
                      className="group hover:bg-gray-50/80 dark:hover:bg-white/[0.03] transition-all cursor-default"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                           <div className="w-1.5 h-1.5 rounded-full bg-gold/40 group-hover:bg-gold transition-colors" />
                           <span className="text-[13px] text-gray-700 dark:text-mi-100 font-medium truncate max-w-[200px]" title={(item as any)[groupBy]}>
                            {(item as any)[groupBy] || 'Sin especificar'}
                           </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-[12px] font-mono font-bold text-gray-800 dark:text-mi-300">
                          {item.cantidad.toLocaleString('es-CO')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-[11px] font-mono text-gray-500 dark:text-mi-500">
                          {fmtCOP(parseFloat(item.valor_total || '0'))}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {(['building', 'floor', 'area'].includes(groupBy)) && (item as any)[groupBy] !== 'Sin especificar' ? (
                          <button 
                            onClick={() => handleDrillDown(item)}
                            className="p-2 rounded-xl text-gray-300 dark:text-mi-500 hover:text-gold dark:hover:text-gold hover:bg-gold/10 border border-transparent hover:border-gold/20 transition-all shadow-sm active:scale-95"
                            title="Explorar este nodo"
                          >
                            <ChevronRight size={18} />
                          </button>
                        ) : (
                          <div className="w-8 h-8 mx-auto flex items-center justify-center opacity-10">
                            <Box size={14} />
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          <div className="p-4 bg-gray-50/50 dark:bg-white/[0.02] border-t border-gray-100 dark:border-white/[0.05] text-[10px] text-gray-400 dark:text-mi-500 font-mono text-center uppercase tracking-widest">
            Mostrando {filteredStats.length} de {stats.length} resultados totales
          </div>
        </div>

      </div>

      {/* ── Módulos Dinámicos de Contexto ────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <div className="card p-6 border-gold/10 hover:border-gold/30 transition-all group overflow-hidden relative">
          <div className="absolute right-0 bottom-0 p-4 opacity-[0.03] group-hover:opacity-10 transition-opacity">
            <Building2 size={80} />
          </div>
          <h4 className="text-[10px] font-mono uppercase tracking-widest text-gold mb-4">Información de Nivel</h4>
          <p className="text-[13px] text-gray-600 dark:text-mi-200 leading-relaxed">
            Actualmente te encuentras analizando la distribución por <span className="text-gold font-bold">{groupBy}</span>. 
            {hierarchy.length > 0 ? (
              <> Filtrado por: <span className="italic">{hierarchy.map(h => h.label).join(' > ')}</span>.</>
            ) : (
              <> Estás viendo el panorama global de la institución.</>
            )}
          </p>
        </div>

        <div className="card p-6 border-mi-500/10 hover:border-mi-500/30 transition-all group overflow-hidden relative">
          <div className="absolute right-0 bottom-0 p-4 opacity-[0.03] group-hover:opacity-10 transition-opacity">
            <Layers size={80} />
          </div>
          <h4 className="text-[10px] font-mono uppercase tracking-widest text-mi-500 mb-4">Tendencia de Activos</h4>
          <div className="flex items-center gap-4">
             <div className="text-2xl font-bold text-gray-800 dark:text-mi-100">
               {((totalActivos / 14000) * 100).toFixed(1)}%
             </div>
             <div className="text-[10px] text-gray-500 dark:text-mi-400 leading-tight">
               Representación del total del inventario maestro (aprox. 14k activos).
             </div>
          </div>
        </div>

        <div className="card p-6 border-emerald-500/10 hover:border-emerald-500/30 transition-all group overflow-hidden relative">
          <div className="absolute right-0 bottom-0 p-4 opacity-[0.03] group-hover:opacity-10 transition-opacity">
            <MapPin size={80} />
          </div>
          <h4 className="text-[10px] font-mono uppercase tracking-widest text-emerald-500 mb-4">Sugerencia de Análisis</h4>
          <p className="text-[11px] text-gray-500 dark:text-mi-300 italic">
            "Prueba cambiar a la dimensión de 'Áreas' para ver cómo se distribuye la carga operativa entre las facultades y departamentos."
          </p>
        </div>

      </div>

    </div>
  )
}
