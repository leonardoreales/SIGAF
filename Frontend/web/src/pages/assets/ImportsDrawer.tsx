import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { X, FileDown, CheckCircle2, AlertCircle, Clock, Database, ChevronRight } from 'lucide-react'
import { apiSyncs } from '../../lib/api'

interface ImportsDrawerProps {
  onClose: () => void
  onApplyFilter: (q: string) => void
}

export default function ImportsDrawer({ onClose, onApplyFilter }: ImportsDrawerProps) {
  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', fn)
    return () => document.removeEventListener('keydown', fn)
  }, [onClose])

  const { data: syncs, isLoading } = useQuery({
    queryKey: ['syncs'],
    queryFn: apiSyncs.list,
  })

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '24px' }}>
      <div 
        onClick={onClose} 
        style={{ position: 'absolute', inset: 0, background: 'rgba(3,7,20,0.65)', backdropFilter: 'blur(6px)' }} 
        className="animate-fade-in"
      />
      <div 
        style={{
          position: 'relative', width: 'min(600px, 100vw - 48px)', maxHeight: '85vh',
          background: 'var(--modal-bg)', backgroundImage: 'var(--modal-bg-grad)',
          border: '1px solid var(--modal-border)', borderRadius: '20px',
          display: 'flex', flexDirection: 'column',
          boxShadow: 'var(--modal-shadow)'
        }}
        className="modal-panel"
      >
        {/* Header */}
        <div style={{ padding: '24px', borderBottom: '1px solid var(--modal-head-border)', background: 'var(--modal-head-bg)' }}>
          <div className="flex justify-between items-start mb-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gold/10 text-gold flex items-center justify-center border border-gold/20 shrink-0">
                <FileDown size={20} />
              </div>
              <div>
                <h2 className="font-syne font-bold text-lg text-gray-900 dark:text-mi-50 leading-tight">Ingresos Automáticos</h2>
                <p className="text-[11px] font-mono tracking-widest text-gold/80 uppercase mt-1">Historial n8n</p>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-900 dark:text-mi-400 dark:hover:text-white bg-gray-100 hover:bg-gray-200 dark:bg-white/[0.05] dark:hover:bg-white/[0.1] transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 thin-scroll-dark">
          {isLoading && <p className="text-center text-gray-400 text-sm mt-10">Cargando historial...</p>}
          
          {syncs?.length === 0 && (
            <p className="text-center text-gray-500 dark:text-mi-500 text-sm mt-10 italic">
              No hay ingresos registrados aún.
            </p>
          )}

          {syncs?.map(sync => {
            const hasErrors = sync.fallidos > 0
            return (
              <div key={sync.id} className="border border-gray-200 dark:border-white/[0.08] rounded-xl overflow-hidden bg-white dark:bg-white/[0.02] shadow-sm transition-all hover:border-gold/30">
                <div className="p-4 border-b border-gray-100 dark:border-white/[0.04]">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-mi-100 break-all pr-2 leading-tight">
                      {sync.sourceSheet}
                    </h3>
                    {hasErrors ? (
                      <span className="shrink-0 flex items-center gap-1 text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 px-2 py-0.5 rounded-full">
                        <AlertCircle size={10} /> Obs
                      </span>
                    ) : (
                      <span className="shrink-0 flex items-center gap-1 text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 px-2 py-0.5 rounded-full">
                        <CheckCircle2 size={10} /> Ok
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-mi-400 font-mono mt-3">
                    <span className="flex items-center gap-1.5">
                      <Clock size={12} className="text-gray-400 dark:text-mi-500" /> 
                      {new Date(sync.createdAt).toLocaleDateString('es-CO', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit'})}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Database size={12} className="text-gray-400 dark:text-mi-500" /> 
                      <strong className="text-gray-700 dark:text-mi-300">{sync.insertados}</strong> insertados
                    </span>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-black/20 p-2 border-t border-gray-100 dark:border-white/[0.04]">
                  <button 
                    onClick={() => {
                      onApplyFilter(sync.sourceSheet)
                      onClose()
                    }}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 text-[12.5px] font-bold rounded-lg text-gray-700 dark:text-mi-300 hover:text-gold dark:hover:text-[#0D1B4A] hover:bg-gray-200 dark:hover:bg-gradient-to-r dark:hover:from-gold-300 dark:hover:to-gold-500 transition-all group"
                  >
                    <span>Aplicar Filtro en el Inventario</span>
                    <ChevronRight size={14} className="text-gray-400 dark:text-mi-400 group-hover:text-gold dark:group-hover:text-[#0D1B4A] transition-colors" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
