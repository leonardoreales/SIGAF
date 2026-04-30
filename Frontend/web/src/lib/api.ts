// ── Types ─────────────────────────────────────────────────────────────────────

export interface AuthUser {
  email:   string
  name:    string
  picture: string
}

export interface Asset {
  id:              number
  plate:           string | null
  plateStatus:     string
  name:            string
  description:     string | null
  assetTypeCode:   string | null
  assetTypeName:   string | null
  pucAccount:      string | null
  brand:           string | null
  model:           string | null
  serial:          string | null
  quantity:        number
  referenceValue:  string | null
  buildingId:      number | null
  buildingCode:    string | null
  buildingName:    string | null
  floor:           string | null
  block:           string | null
  location:        string | null
  areaId:          number | null
  areaName:        string | null
  personId:        number | null
  responsableRaw:  string | null
  status:          string
  incorporationYear: number | null
  maintenanceArea: string | null
  criticality:     string
  notes:           string | null
  createdAt:       string
  updatedAt:       string
}

export interface AssetListResponse {
  data: Asset[]
  meta: { total: number; page: number; limit: number; pages: number }
}

export interface Building  { id: number; cityCode: string; code: string; name: string; active: boolean }
export interface AssetType { code: string; name: string; active: boolean }
export interface Area      { id: number; name: string; active: boolean }
export interface Person    { id: number; fullName: string; email: string | null; areaId: number | null; active: boolean }

export interface SyncEvent {
  id:              number
  sourceSheet:     string
  insertados:      number
  fallidos:        number
  placasGeneradas: string[]
  createdAt:       string
}

export interface AssetStats {
  totales: {
    total:             number
    activos:           number
    bajas:             number
    enTraslado:        number
    revisionRequerida: number
    valorTotal:        string
    nuevos30d:         number
  }
  porEdificio: Array<{ nombre: string; cantidad: number }>
  porTipo:     Array<{ nombre: string; cantidad: number }>
}

// ── Client ────────────────────────────────────────────────────────────────────

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

export class ApiError extends Error {
  constructor(public status: number, message: string, public code?: string) {
    super(message)
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('sigaf_token')
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers as Record<string, string> ?? {}),
    },
  })

  if (res.status === 401) {
    localStorage.removeItem('sigaf_token')
    localStorage.removeItem('sigaf_user')
    window.location.replace('/login')
    throw new ApiError(401, 'Sesión expirada o token inválido')
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new ApiError(res.status, body.message ?? 'Error', body.error)
  }

  if (res.status === 204) return undefined as T
  return res.json()
}

// ── API namespaces ────────────────────────────────────────────────────────────

export const apiAuth = {
  loginWithGoogle: (idToken: string) =>
    request<{ token: string; user: AuthUser }>('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ idToken }),
    }),
}

export const apiAssets = {
  list: (params: Record<string, string | number | undefined>) => {
    const clean = Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== '')
    ) as Record<string, string>
    const qs = new URLSearchParams(clean).toString()
    return request<AssetListResponse>(`/assets${qs ? `?${qs}` : ''}`)
  },
  get:    (id: number) => request<Asset>(`/assets/${id}`),
  create: (data: unknown) =>
    request<Asset>('/assets', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: unknown) =>
    request<Asset>(`/assets/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) =>
    request<void>(`/assets/${id}`, { method: 'DELETE' }),
  stats: () => request<AssetStats>('/assets/stats'),
}

export const apiCatalogs = {
  buildings:  () => request<Building[]>('/catalogs/buildings'),
  assetTypes: () => request<AssetType[]>('/catalogs/asset-types'),
  areas:      () => request<Area[]>('/catalogs/areas'),
  people:     () => request<Person[]>('/catalogs/people'),
}

// ── Transfers ─────────────────────────────────────────────────────────────────

export type TransferStatus = 'PENDIENTE' | 'EN_PROCESO' | 'COMPLETADO' | 'CANCELADO'
export type TransferReason =
  | 'REUBICACION' | 'MANTENIMIENTO' | 'DONACION'
  | 'PRESTAMO'    | 'ACTUALIZACION_RESPONSABLE' | 'OTRO'

export interface Transfer {
  id:                     number
  transferNumber:         string
  assetId:                number
  assetPlate:             string | null
  assetName:              string
  assetTypeName:          string | null
  assetSerial:            string | null
  assetBrand:             string | null
  assetModel:             string | null
  assetReferenceValue:    string | null
  assetIncorporationYear: number | null

  originBuildingId:   number | null
  originBuildingName: string | null
  originAreaId:       number | null
  originAreaName:     string | null
  originResponsible:  string | null
  originFloor:        string | null
  originBlock:        string | null
  originLocation:     string | null

  destBuildingId:   number | null
  destBuildingName: string | null
  destAreaId:       number | null
  destAreaName:     string | null
  destPersonId:     number | null
  destPersonName:   string | null
  destResponsible:  string | null
  destFloor:        string | null
  destBlock:        string | null
  destLocation:     string | null

  status:       TransferStatus
  reason:       TransferReason | null
  requestedBy:  string | null
  notes:        string | null
  scheduledAt:  string | null
  completedAt:  string | null

  n8nNotified:      boolean
  n8nWebhookSentAt: string | null

  signatureOrigin: string | null
  signatureDest:   string | null
  signedAt:        string | null

  createdAt: string
  updatedAt: string
}

export interface TransferListResponse {
  data: Transfer[]
  meta: { total: number; page: number; limit: number; pages: number }
}

export interface TransferStats {
  total:      number
  pendiente:  number
  enProceso:  number
  completado: number
  cancelado:  number
}

export interface CreateTransferPayload {
  assetId:         number
  destBuildingId:  number
  destAreaId?:     number
  destPersonId?:   number
  destResponsible?: string
  destFloor?:      string
  destBlock?:      string
  destLocation?:   string
  reason?:         TransferReason
  requestedBy?:    string
  notes?:          string
  scheduledAt?:    string
}

export interface UpdateTransferPayload {
  status?:         TransferStatus
  destBuildingId?: number
  destAreaId?:     number | null
  destPersonId?:   number | null
  destResponsible?: string
  destFloor?:      string
  destBlock?:      string
  destLocation?:   string
  reason?:         TransferReason
  requestedBy?:    string
  notes?:          string
  scheduledAt?:    string | null
}

export const apiTransfers = {
  list: (params: Record<string, string | number | undefined>) => {
    const clean = Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== '')
    ) as Record<string, string>
    const qs = new URLSearchParams(clean).toString()
    return request<TransferListResponse>(`/transfers${qs ? `?${qs}` : ''}`)
  },
  get:    (id: number)                              => request<Transfer>(`/transfers/${id}`),
  create: (data: CreateTransferPayload)             => request<Transfer>('/transfers', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: UpdateTransferPayload) => request<Transfer>(`/transfers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  stats:  ()                                        => request<TransferStats>('/transfers/stats'),
}
