import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { X, FileText, CheckCircle2, Inbox, Mail, Calendar, User, Info, MapPin, Truck, AlertTriangle, PlayCircle, PenLine, ArrowRight } from 'lucide-react'
import { apiTransferRequests, type TransferRequestStatus } from '../../lib/api'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { toast } from 'sonner'

interface RequestDetailDrawerProps {
  requestId: number
  onClose: () => void
}

export default function RequestDetailDrawer({ requestId, onClose }: RequestDetailDrawerProps) {
  const [tab, setTab] = useState<'general' | 'activos' | 'documento' | 'trazabilidad'>('general')
  const queryClient = useQueryClient()

  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', fn)
    return () => document.removeEventListener('keydown', fn)
  }, [onClose])

  const { data: request, isLoading } = useQuery({
    queryKey: ['transferRequest', requestId],
    queryFn: () => apiTransferRequests.get(requestId),
  })

  const signMutation = useMutation({
    mutationFn: () => {
      const userStr = localStorage.getItem('sigaf_user')
      const user = userStr ? JSON.parse(userStr) : {}
      return apiTransferRequests.sign(requestId, {
        requestedByName: user.name || 'Leonardo Reales',
        requestedByEmail: user.email || 'leonardoreales@americana.edu.co'
      })
    },
    onSuccess: () => {
      toast.success('Solicitud de firma enviada a n8n')
      queryClient.invalidateQueries({ queryKey: ['transferRequest', requestId] })
      queryClient.invalidateQueries({ queryKey: ['transferRequests'] })
    },
    onError: (error: any) => {
      toast.error(`Error al solicitar firma: ${error.message}`)
    }
  })

  const updateMutation = useMutation({
    mutationFn: (data: { status: TransferRequestStatus }) => apiTransferRequests.update(requestId, data),
    onSuccess: () => {
      toast.success('Solicitud enviada a gestión')
      queryClient.invalidateQueries({ queryKey: ['transferRequest', requestId] })
      queryClient.invalidateQueries({ queryKey: ['transferRequests'] })
    },
    onError: (error: any) => {
      toast.error(`Error al actualizar estado: ${error.message}`)
    }
  })

  // Safe parsing of formData
  const formData = request?.formData as any || {}
  const movement = formData.movement || {}
  const items = request?.items || []
  const canSign = request
    ? ['PENDIENTE_GESTION_ACTIVOS_FIJOS', 'REVISION', 'APROBADA'].includes(request.status)
    : false

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '24px' }}>
      <div 
        onClick={onClose} 
        style={{ position: 'absolute', inset: 0, background: 'rgba(3,7,20,0.65)', backdropFilter: 'blur(6px)' }} 
        className="animate-fade-in"
      />
      <div 
        style={{
          position: 'relative', width: 'min(900px, 100vw - 48px)', height: '85vh',
          background: 'var(--modal-bg)', backgroundImage: 'var(--modal-bg-grad)',
          border: '1px solid var(--modal-border)', borderRadius: '20px',
          display: 'flex', flexDirection: 'column',
          boxShadow: 'var(--modal-shadow)',
          overflow: 'hidden'
        }}
        className="modal-panel animate-slide-up"
      >
        {/* ── Header ─────────────────────────────────────────── */}
        <div style={{ padding: '24px', borderBottom: '1px solid var(--modal-head-border)', background: 'var(--modal-head-bg)' }}>
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50/10 text-blue-400 flex items-center justify-center border border-blue-500/20 shrink-0 shadow-inner">
                <Inbox size={24} />
              </div>
              <div>
                <h2 className="font-syne font-bold text-xl text-gray-900 dark:text-mi-50 leading-tight">
                  {request ? request.requestNumber : 'Cargando...'}
                </h2>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-[11px] font-mono tracking-widest text-blue-500/80 uppercase">
                    Solicitud F-AF-039
                  </span>
                  {request && (
                    <span className={`inline-flex items-center gap-1 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                      request.status === 'RECIBIDA' ? 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800' :
                      ['APROBADA', 'FIRMADA', 'PDF_GENERADO', 'RESPUESTA_ENVIADA'].includes(request.status) ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800' :
                      ['ERROR_FIRMA', 'ERROR_ENVIO_RESPUESTA', 'RECHAZADA'].includes(request.status) ? 'bg-red-50 text-red-600 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800' :
                      'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800'
                    }`}>
                      {request.status === 'RECIBIDA' && <Inbox size={10} />}
                      {request.status === 'FIRMADA' && <CheckCircle2 size={10} />}
                      {request.status}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {request && request.status === 'RECIBIDA' && (
                <button
                  onClick={() => updateMutation.mutate({ status: 'PENDIENTE_GESTION_ACTIVOS_FIJOS' })}
                  disabled={updateMutation.isPending}
                  className="
                    flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold tracking-tight
                    bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/20
                    disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95
                  "
                >
                  {updateMutation.isPending ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <ArrowRight size={16} />
                  )}
                  Gestionar solicitud
                </button>
              )}
              {request && canSign && (
                <button
                  onClick={() => signMutation.mutate()}
                  disabled={signMutation.isPending}
                  className="
                    flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold tracking-tight
                    bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/20
                    disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95
                  "
                >
                  {signMutation.isPending ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <PenLine size={16} />
                  )}
                  Firmar Acta F-AF-039
                </button>
              )}
              <button 
                onClick={onClose} 
                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-900 dark:text-mi-400 dark:hover:text-white bg-gray-100 hover:bg-gray-200 dark:bg-white/[0.05] dark:hover:bg-white/[0.1] transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 -mb-[24px]">
            {([
              { id: 'general', label: 'Información General', icon: Info },
              { id: 'activos', label: 'Activos Detectados', icon: Truck },
              { id: 'documento', label: 'Acta Original', icon: FileText },
              { id: 'trazabilidad', label: 'Trazabilidad n8n', icon: PlayCircle },
            ] as const).map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`
                  flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all
                  ${tab === t.id 
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-mi-400 dark:hover:text-mi-200'
                  }
                `}
              >
                <t.icon size={15} />
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Body ───────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 thin-scroll-dark">
          {isLoading && (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-4" />
              <p>Cargando información de la solicitud...</p>
            </div>
          )}

          {!isLoading && request && tab === 'general' && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-gray-100 dark:border-white/[0.05] bg-white/50 dark:bg-white/[0.01]">
                  <h3 className="text-xs font-mono text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Mail size={14} /> Correo Origen
                  </h3>
                  <div className="space-y-2">
                    <p className="text-sm"><span className="text-gray-500">De:</span> <strong className="dark:text-mi-100">{request.senderEmail}</strong></p>
                    <p className="text-sm"><span className="text-gray-500">Asunto:</span> <span className="dark:text-mi-200">{request.subject}</span></p>
                    <p className="text-sm"><span className="text-gray-500">Recibido:</span> <span className="dark:text-mi-200">{format(new Date(request.receivedAt!), "d 'de' MMMM yyyy, HH:mm", { locale: es })}</span></p>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-gray-100 dark:border-white/[0.05] bg-white/50 dark:bg-white/[0.01]">
                  <h3 className="text-xs font-mono text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <MapPin size={14} /> Detalles del Movimiento
                  </h3>
                  <div className="space-y-2">
                    <p className="text-sm"><span className="text-gray-500">Tipo:</span> <strong className="dark:text-mi-100">{movement.movementType || 'No especificado'}</strong></p>
                    <p className="text-sm"><span className="text-gray-500">Destino:</span> <span className="dark:text-mi-200">{movement.destination || 'No especificado'}</span></p>
                    <p className="text-sm"><span className="text-gray-500">Fechas:</span> <span className="dark:text-mi-200">{movement.exitDateRaw} al {movement.returnDateRaw || 'No aplica'}</span></p>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-gray-100 dark:border-white/[0.05] bg-white/50 dark:bg-white/[0.01] md:col-span-2">
                  <h3 className="text-xs font-mono text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <User size={14} /> Personal Involucrado
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Solicitante</p>
                      <p className="text-sm font-medium dark:text-mi-100">{formData.solicitante || formData.authorizedPerson?.fullName || 'No detectado'}</p>
                      <p className="text-xs text-gray-500">{formData.dependencia || ''}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Responsable de los Activos</p>
                      <p className="text-sm font-medium dark:text-mi-100">{formData.assetResponsible?.fullName || 'No detectado'}</p>
                      <p className="text-xs text-gray-500">{formData.assetResponsible?.area || ''}</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-gray-100 dark:border-white/[0.05] bg-white/50 dark:bg-white/[0.01] md:col-span-2">
                  <h3 className="text-xs font-mono text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Info size={14} /> Motivo u Observaciones
                  </h3>
                  <p className="text-sm dark:text-mi-200 whitespace-pre-wrap">{formData.motivo || formData.observations || 'Sin observaciones'}</p>
                </div>
              </div>
            </div>
          )}

          {!isLoading && request && tab === 'activos' && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex justify-between items-center bg-gray-50 dark:bg-white/[0.02] p-4 rounded-xl border border-gray-100 dark:border-white/[0.05]">
                <div>
                  <p className="text-sm font-medium dark:text-mi-100">Activos extraídos del documento</p>
                  <p className="text-xs text-gray-500">El sistema intentó emparejar estos activos con el inventario actual.</p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold dark:text-mi-50">{items.length}</span>
                  <span className="text-xs text-gray-500 block">Total extraídos</span>
                </div>
              </div>

              <div className="rounded-xl border border-gray-100 dark:border-white/[0.05] overflow-hidden bg-white/50 dark:bg-white/[0.01]">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 dark:bg-white/[0.02] text-xs uppercase font-mono text-gray-500">
                    <tr>
                      <th className="px-4 py-3">Nombre / Descripción</th>
                      <th className="px-4 py-3">Placa DOCX</th>
                      <th className="px-4 py-3">Serial DOCX</th>
                      <th className="px-4 py-3 text-center">Cant.</th>
                      <th className="px-4 py-3">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                    {items.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors">
                        <td className="px-4 py-3 font-medium dark:text-mi-100">{item.nameRaw || 'Sin nombre'}</td>
                        <td className="px-4 py-3 font-mono text-xs dark:text-mi-300">{item.plateRaw || '-'}</td>
                        <td className="px-4 py-3 font-mono text-xs dark:text-mi-300">{item.serialRaw || '-'}</td>
                        <td className="px-4 py-3 text-center dark:text-mi-200">{item.quantity}</td>
                        <td className="px-4 py-3">
                          {item.matched ? (
                            <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full dark:bg-emerald-900/30 dark:text-emerald-400">
                              <CheckCircle2 size={10} /> Emparejado
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full dark:bg-amber-900/30 dark:text-amber-400">
                              <AlertTriangle size={10} /> Pendiente
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {items.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-gray-400 italic">No se encontraron activos en el documento.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {!isLoading && request && tab === 'documento' && (
            <div className="h-full flex flex-col space-y-4 animate-fade-in">
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-500">Vista previa del acta original enviada por correo.</p>
                <a 
                  href={request.docxDriveUrl || formData.document?.googleDocUrl || formData.document?.originalDriveUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-blue-500 hover:text-blue-600 font-medium flex items-center gap-1"
                >
                  Abrir en Google Drive <FileText size={14} />
                </a>
              </div>
              
              {request.docxDriveUrl || formData.document?.googleDocId ? (
                <div className="flex-1 rounded-xl border border-gray-200 dark:border-white/[0.1] overflow-hidden bg-white">
                  <iframe 
                    src={`https://docs.google.com/document/d/${formData.document?.googleDocId || formData.googleDocId}/preview`} 
                    className="w-full h-full border-0 min-h-[500px]"
                    title="Vista previa del documento"
                  />
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-gray-200 dark:border-white/[0.1] rounded-xl text-gray-400">
                  <FileText size={48} className="mb-4 opacity-20" />
                  <p>No hay vista previa disponible para este documento.</p>
                </div>
              )}
            </div>
          )}

          {!isLoading && request && tab === 'trazabilidad' && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 rounded-xl border border-blue-100 dark:border-blue-900/30 bg-blue-50 dark:bg-blue-950/20 text-sm dark:text-mi-200">
                <p>Este es el registro completo de lo que el motor de IA de n8n detectó durante la ingesta del correo. Es información de depuración para administradores.</p>
              </div>
              <div className="rounded-xl border border-gray-200 dark:border-white/[0.1] overflow-hidden bg-[#1E1E1E] p-4 text-xs font-mono text-green-400 overflow-x-auto thin-scroll">
                <pre>{JSON.stringify(formData, null, 2)}</pre>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
