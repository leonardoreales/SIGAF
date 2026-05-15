import type { LucideIcon } from 'lucide-react'
import {
  Inbox, Clock, CheckCircle2, PenLine, Loader2,
  ShieldCheck, FileText, Send, XCircle, AlertTriangle,
} from 'lucide-react'
import type { TransferRequestStatus } from './api'

export interface StatusMeta {
  label:    string
  icon:     LucideIcon
  badgeCls: string
  color:    'blue' | 'amber' | 'emerald' | 'purple' | 'red' | 'cyan' | 'gray'
  isDone?:  boolean
  isError?: boolean
  isBusy?:  boolean
}

export const TRANSFER_REQUEST_STATUS: Record<TransferRequestStatus, StatusMeta> = {
  RECIBIDA: {
    label:    'Recibida',
    icon:     Inbox,
    color:    'blue',
    badgeCls: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/50',
  },
  PENDIENTE_GESTION_ACTIVOS_FIJOS: {
    label:    'Pendiente gestión',
    icon:     Clock,
    color:    'amber',
    badgeCls: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/50',
  },
  REVISION: {
    label:    'En revisión',
    icon:     Clock,
    color:    'amber',
    badgeCls: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/50',
  },
  APROBADA: {
    label:    'Aprobada',
    icon:     CheckCircle2,
    color:    'emerald',
    badgeCls: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/50',
  },
  FIRMA_SOLICITADA: {
    label:    'Firma solicitada',
    icon:     Send,
    color:    'purple',
    badgeCls: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/50',
  },
  FIRMA_EN_PROCESO: {
    label:    'Firmando…',
    icon:     Loader2,
    color:    'purple',
    badgeCls: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/50',
    isBusy:   true,
  },
  FIRMADA: {
    label:    'Firmada',
    icon:     ShieldCheck,
    color:    'emerald',
    badgeCls: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/50',
    isDone:   true,
  },
  PDF_GENERADO: {
    label:    'PDF generado',
    icon:     FileText,
    color:    'emerald',
    badgeCls: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/50',
    isDone:   true,
  },
  RESPUESTA_ENVIANDO: {
    label:    'Enviando respuesta',
    icon:     Send,
    color:    'cyan',
    badgeCls: 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-300 dark:border-cyan-800/50',
    isBusy:   true,
  },
  RESPUESTA_ENVIADA: {
    label:    'Respuesta enviada',
    icon:     CheckCircle2,
    color:    'emerald',
    badgeCls: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/50',
    isDone:   true,
  },
  RECHAZADA: {
    label:    'Rechazada',
    icon:     XCircle,
    color:    'red',
    badgeCls: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800/50',
    isError:  true,
  },
  ERROR_FIRMA: {
    label:    'Error firma',
    icon:     XCircle,
    color:    'red',
    badgeCls: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800/50',
    isError:  true,
  },
  ERROR_ENVIO_RESPUESTA: {
    label:    'Error respuesta',
    icon:     XCircle,
    color:    'red',
    badgeCls: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800/50',
    isError:  true,
  },
  REQUIERE_REVISION_MANUAL: {
    label:    'Revisión manual',
    icon:     AlertTriangle,
    color:    'amber',
    badgeCls: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/50',
    isError:  true,
  },
}