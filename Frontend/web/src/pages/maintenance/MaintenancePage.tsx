import React, { useState, useEffect, useRef } from 'react';
import { 
  Wrench, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Filter,
  Plus,
  MoreVertical,
  ArrowUpRight,
  ShieldCheck,
  FileText,
  Upload,
  Search,
  ChevronDown,
  X
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useRole } from '../../hooks/useRole';

// --- Types ---
interface MaintenanceTask {
  id: string;
  activityName: string;
  assetPlate?: string;
  maintenanceType: string;
  scheduledDate: string;
  status: string;
  criticality: 'Alto' | 'Medio' | 'Bajo';
  responsibleArea: string;
}

const AREAS = ['Todas', 'Infraestructura', 'Sistemas', 'Transporte'];

const MOCK_TASKS: MaintenanceTask[] = [
  {
    id: 'm1',
    activityName: 'Mantenimiento Preventivo Aire Acondicionado',
    assetPlate: 'INV-001',
    maintenanceType: 'Preventivo',
    scheduledDate: '2026-05-15',
    status: 'EJECUTADO',
    criticality: 'Alto',
    responsibleArea: 'Infraestructura',
  },
  {
    id: 'm2',
    activityName: 'Revisión Técnica Servidor Principal',
    assetPlate: 'SRV-042',
    maintenanceType: 'Técnico',
    scheduledDate: '2026-05-10',
    status: 'VENCIDO',
    criticality: 'Alto',
    responsibleArea: 'Sistemas',
  },
  {
    id: 'm3',
    activityName: 'Cambio de Aceite Camioneta Institucional',
    assetPlate: 'VEH-005',
    maintenanceType: 'Preventivo',
    scheduledDate: '2026-05-20',
    status: 'PROGRAMADO',
    criticality: 'Medio',
    responsibleArea: 'Transporte',
  }
];

export default function MaintenancePage() {
  const { isAdmin, isActivosFijos } = useRole();
  const [tasks, setTasks] = useState<MaintenanceTask[]>(MOCK_TASKS);
  const [loading, setLoading] = useState(true);
  const [selectedArea, setSelectedArea] = useState('Todas');
  const [isImporting, setIsImporting] = useState(false);
  const [selectedTask, setSelectedTask] = useState<MaintenanceTask | null>(null);
  const [showModal, setShowModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchMaintenance = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://localhost:3000/maintenance', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      setTasks(Array.isArray(data) && data.length > 0 ? data : MOCK_TASKS);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaintenance();
  }, []);

  const filteredTasks = Array.isArray(tasks) ? tasks.filter(task => 
    selectedArea === 'Todas' || task.responsibleArea === selectedArea
  ) : [];

  // Calcular KPIs dinámicamente según lo que se ve en la tabla
  const dynamicStats = React.useMemo(() => {
    const total = filteredTasks.length;
    const executed = filteredTasks.filter(t => t.status === 'EJECUTADO').length;
    const vencidos = filteredTasks.filter(t => t.status === 'VENCIDO').length;
    const programados = filteredTasks.filter(t => t.status === 'PROGRAMADO').length;
    
    const compliance = total > 0 ? Math.round((executed / total) * 100) : 0;
    
    return {
      compliance: `${compliance}%`,
      vencidos,
      total,
      programados
    };
  }, [filteredTasks]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('area', selectedArea === 'Todas' ? 'General' : selectedArea);

    try {
      const res = await fetch('http://localhost:3000/maintenance/import', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: formData
      });
      if (res.ok) {
        alert('Cronograma importado exitosamente');
        fetchMaintenance();
      } else {
        const err = await res.json();
        alert('Error: ' + (err.error || 'No se pudo importar'));
      }
    } catch (err) {
      console.error(err);
      alert('Error de conexión con el servidor');
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6 max-w-[1600px] mx-auto w-full animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 text-gray-400 dark:text-mi-500 mb-1">
          <Wrench size={14} />
          <span className="text-[11px] font-mono tracking-widest uppercase">Operaciones</span>
        </div>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white font-syne">
            Gestión de Mantenimiento
          </h1>
          <div className="flex items-center gap-3">
            {(isAdmin || isActivosFijos) && (
              <>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                  className="hidden" 
                  accept=".xlsx,.xls" 
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isImporting}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-white/[0.1] text-gray-700 dark:text-mi-100 rounded-xl font-semibold text-sm hover:bg-gray-50 dark:hover:bg-white/[0.05] transition-all shadow-sm"
                >
                  <Upload size={16} className={cn(isImporting && "animate-bounce")} />
                  {isImporting ? 'Procesando Excel...' : 'Importar Cronograma'}
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-gold text-mi-950 rounded-xl font-bold text-sm hover:bg-gold/90 transition-all shadow-lg shadow-gold/20 active:scale-95">
                  <Plus size={18} />
                  Programar
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Cumplimiento', value: dynamicStats.compliance, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
          { label: 'Tareas Vencidas', value: dynamicStats.vencidos.toString(), icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-500/10' },
          { label: 'Total Programado', value: dynamicStats.total.toString(), icon: Calendar, color: 'text-gold', bg: 'bg-gold/10' },
          { label: 'Sin Soporte', value: '0', icon: FileText, color: 'text-blue-500', bg: 'bg-blue-500/10' },
        ].map((stat, idx) => (
          <div 
            key={idx}
            className="p-5 rounded-2xl border border-gray-150 bg-white dark:border-white/[0.06] dark:bg-white/[0.02] flex items-center gap-4 group hover:border-gold/30 transition-all duration-300 shadow-sm"
          >
            <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110", stat.bg)}>
              <stat.icon className={stat.color} size={24} />
            </div>
            <div>
              <p className="text-[12px] text-gray-500 dark:text-mi-500 font-medium">{stat.label}</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col gap-4 rounded-2xl border border-gray-150 bg-white/50 dark:border-white/[0.06] dark:bg-white/[0.01] backdrop-blur-sm shadow-xl overflow-hidden">
        {/* Table Filters */}
        <div className="p-4 border-b border-gray-150 dark:border-white/[0.06] flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white font-syne">
              Cronograma de Actividades
            </h2>
            
            {/* Area Segmenter */}
            <div className="flex p-1 bg-gray-100 dark:bg-white/[0.05] rounded-xl border border-gray-200 dark:border-white/[0.05]">
              {AREAS.map(area => (
                <button
                  key={area}
                  onClick={() => setSelectedArea(area)}
                  className={cn(
                    "px-4 py-1.5 rounded-lg text-[12px] font-bold transition-all",
                    selectedArea === area 
                      ? "bg-white dark:bg-mi-800 text-gray-900 dark:text-white shadow-md" 
                      : "text-gray-500 dark:text-mi-500 hover:text-gray-700 dark:hover:text-mi-300"
                  )}
                >
                  {area}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <input 
                type="text" 
                placeholder="Buscar activo..."
                className="pl-9 pr-4 py-2 bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.08] rounded-xl text-[13px] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold/50 transition-all w-64"
              />
            </div>
            <button className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 dark:border-white/[0.1] text-[13px] text-gray-600 dark:text-mi-400 hover:bg-gray-50 dark:hover:bg-white/[0.05] transition-all">
              <Filter size={14} />
              <span>Filtros</span>
              <ChevronDown size={14} />
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 dark:bg-white/[0.02] text-[11px] font-mono text-gray-400 dark:text-mi-600 uppercase tracking-widest">
                <th className="px-6 py-4 font-semibold">Actividad / Activo</th>
                <th className="px-6 py-4 font-semibold">Tipo</th>
                <th className="px-6 py-4 font-semibold">Área Responsable</th>
                <th className="px-6 py-4 font-semibold text-center">Criticidad</th>
                <th className="px-6 py-4 font-semibold">Programación</th>
                <th className="px-6 py-4 font-semibold">Estado</th>
                <th className="px-6 py-4 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-2 text-gray-400">
                      <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
                      <span className="text-[13px] font-medium">Cargando mantenimientos...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-2 text-gray-400">
                      <AlertCircle size={32} strokeWidth={1.5} />
                      <span className="text-[13px] font-medium">No hay mantenimientos registrados en esta área</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTasks.map((task) => (
                  <tr 
                    key={task.id} 
                    className="group hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-all duration-200"
                  >
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-[14px] font-bold text-gray-900 dark:text-mi-100 group-hover:text-gold transition-colors leading-tight">
                          {task.activityName}
                        </span>
                        <span className="text-[11px] font-mono text-gray-400 dark:text-mi-600 uppercase tracking-tighter mt-1">
                          {task.assetPlate || 'SIN PLACA'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[12px] text-gray-600 dark:text-mi-400 font-medium">
                        {task.maintenanceType}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex px-2 py-0.5 rounded-lg bg-gray-100 dark:bg-mi-900 text-gray-600 dark:text-mi-400 text-[11px] font-bold">
                        {task.responsibleArea}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={cn(
                        "inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-tight",
                        task.criticality === 'Alto' ? "bg-red-500/10 text-red-500 border border-red-500/20" :
                        task.criticality === 'Medio' ? "bg-gold/10 text-gold border border-gold/20" : 
                        "bg-blue-500/10 text-blue-500 border border-blue-500/20"
                      )}>
                        {task.criticality || 'BAJO'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-[12px] text-gray-600 dark:text-mi-400 font-medium">
                        <Calendar size={13} className="text-gray-400" />
                        {task.scheduledDate}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border",
                        task.status === 'PROGRAMADO' ? "bg-blue-500/5 text-blue-500 border-blue-500/20" :
                        task.status === 'VENCIDO' ? "bg-red-500/5 text-red-500 border-red-500/20 animate-pulse" :
                        task.status === 'EJECUTADO' ? "bg-emerald-500/5 text-emerald-500 border-emerald-500/20" : 
                        "bg-gold/5 text-gold border-gold/20"
                      )}>
                        <div className={cn("w-1.5 h-1.5 rounded-full", 
                          task.status === 'PROGRAMADO' ? "bg-blue-500" :
                          task.status === 'VENCIDO' ? "bg-red-500" :
                          task.status === 'EJECUTADO' ? "bg-emerald-500" : "bg-gold"
                        )} />
                        {task.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        {(isAdmin || isActivosFijos) && (
                          <button 
                            onClick={() => { setSelectedTask(task); setShowModal(true); }}
                            title="Validar Soporte"
                            className="p-2 rounded-xl bg-gold/10 text-gold hover:bg-gold hover:text-mi-950 transition-all transform hover:scale-110"
                          >
                            <ShieldCheck size={16} />
                          </button>
                        )}
                        <button className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/[0.06] text-gray-400 dark:text-mi-600 transition-all">
                          <MoreVertical size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Mockup */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-mi-950 border border-gray-200 dark:border-white/[0.1] rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-gray-100 dark:border-white/[0.05] flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white font-syne">Ejecutar Mantenimiento</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 flex flex-col gap-4">
              <div>
                <p className="text-[11px] font-mono text-gray-400 dark:text-mi-600 uppercase mb-1">Activo</p>
                <p className="text-sm font-bold text-gray-900 dark:text-white">{selectedTask?.activityName}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-mono text-gray-400 dark:text-mi-600 uppercase">Fecha Real</label>
                  <input type="date" className="bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.08] rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-mono text-gray-400 dark:text-mi-600 uppercase">Ejecutor</label>
                  <select className="bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.08] rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white">
                    <option>Personal Propio</option>
                    <option>Proveedor Externo</option>
                  </select>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-mono text-gray-400 dark:text-mi-600 uppercase">Subir Soporte (PDF/JPG)</label>
                <div className="border-2 border-dashed border-gray-200 dark:border-white/[0.1] rounded-2xl p-8 flex flex-col items-center gap-2 cursor-pointer hover:border-gold transition-colors">
                  <Upload size={24} className="text-gray-300 dark:text-mi-700" />
                  <p className="text-[12px] text-gray-500 dark:text-mi-500">Arrastra o haz clic para subir</p>
                </div>
              </div>
            </div>
            <div className="p-6 bg-gray-50 dark:bg-white/[0.02] flex gap-3">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-white/[0.1] text-sm font-bold text-gray-600 dark:text-mi-400 hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-all">
                Cancelar
              </button>
              <button onClick={() => { alert('Función de ejecución en desarrollo'); setShowModal(false); }} className="flex-1 py-2.5 rounded-xl bg-gold text-mi-950 text-sm font-bold hover:bg-gold/90 transition-all shadow-lg shadow-gold/20">
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
