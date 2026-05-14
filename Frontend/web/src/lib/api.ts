// ── Types ─────────────────────────────────────────────────────────────────────

export interface AuthUser {
  email:       string
  name:        string
  picture:     string
  role:        string
  cargo:       string
  dependencia: string
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
  acquisitionDate:  string | null
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
    valorBajas:        number
    enTraslado:        number
    revisionRequerida: number
    valorTotal:        number
    nuevos30d:         number
  }
  porEdificio: Array<{ nombre: string; cantidad: number }>
  porTipo:     Array<{ nombre: string; cantidad: number }>
}

export type AssetAdvancedGroup =
  | 'building'
  | 'type'
  | 'area'
  | 'floor'
  | 'location'
  | 'status'
  | 'criticality'

export type AssetAdvancedStatsRow = Partial<Record<AssetAdvancedGroup, string>> & {
  cantidad:     number
  valor_total?: string | number
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
  advancedStats: (
    groupBy: AssetAdvancedGroup[],
    filters: Partial<Record<'buildingId' | 'buildingName' | 'areaName' | 'floor', string | number | undefined>> = {},
  ) => {
    const clean = Object.fromEntries(
      Object.entries({
        groupBy: groupBy.join(','),
        ...filters,
      }).filter(([, v]) => v !== undefined && v !== '')
    ) as Record<string, string>
    const qs = new URLSearchParams(clean).toString()
    return request<AssetAdvancedStatsRow[]>(`/assets/stats/advanced?${qs}`)
  },
}

export const apiSyncs = {
  list: () => request<SyncEvent[]>('/sync'),
}

export const apiCatalogs = {
  // Public read (active only)
  buildings:        () => request<Building[]>('/catalogs/buildings'),
  assetTypes:       () => request<AssetType[]>('/catalogs/asset-types'),
  areas:            () => request<Area[]>('/catalogs/areas'),
  areasByBuilding:  (buildingId: number) => request<Area[]>(`/catalogs/areas/by-building/${buildingId}`),
  people:           () => request<Person[]>('/catalogs/people'),

  // Admin CRUD (includes inactive)
  admin: {
    buildings:          () => request<Building[]>('/catalogs/admin/buildings'),
    createBuilding:     (data: { cityCode: string; code: string; name: string }) =>
      request<Building>('/catalogs/admin/buildings', { method: 'POST', body: JSON.stringify(data) }),
    updateBuilding:     (id: number, data: Partial<{ cityCode: string; code: string; name: string; active: boolean }>) =>
      request<Building>(`/catalogs/admin/buildings/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteBuilding:     (id: number) =>
      request<Building>(`/catalogs/admin/buildings/${id}`, { method: 'DELETE' }),

    assetTypes:         () => request<AssetType[]>('/catalogs/admin/asset-types'),
    createAssetType:    (data: { code: string; name: string }) =>
      request<AssetType>('/catalogs/admin/asset-types', { method: 'POST', body: JSON.stringify(data) }),
    updateAssetType:    (code: string, data: Partial<{ name: string; active: boolean }>) =>
      request<AssetType>(`/catalogs/admin/asset-types/${code}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteAssetType:    (code: string) =>
      request<AssetType>(`/catalogs/admin/asset-types/${code}`, { method: 'DELETE' }),

    areas:              () => request<Area[]>('/catalogs/admin/areas'),
    createArea:         (data: { name: string }) =>
      request<Area>('/catalogs/admin/areas', { method: 'POST', body: JSON.stringify(data) }),
    updateArea:         (id: number, data: Partial<{ name: string; active: boolean }>) =>
      request<Area>(`/catalogs/admin/areas/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteArea:         (id: number) =>
      request<Area>(`/catalogs/admin/areas/${id}`, { method: 'DELETE' }),

    people:             () => request<Person[]>('/catalogs/admin/people'),
    createPerson:       (data: { fullName: string; email?: string; areaId?: number }) =>
      request<Person>('/catalogs/admin/people', { method: 'POST', body: JSON.stringify(data) }),
    updatePerson:       (id: number, data: Partial<{ fullName: string; email: string; areaId: number | null; active: boolean }>) =>
      request<Person>(`/catalogs/admin/people/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deletePerson:       (id: number) =>
      request<Person>(`/catalogs/admin/people/${id}`, { method: 'DELETE' }),
  },
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

// ── Transfer Requests ─────────────────────────────────────────────────────────

export type TransferRequestStatus =
  | 'RECIBIDA'
  | 'PENDIENTE_GESTION_ACTIVOS_FIJOS'
  | 'REVISION'
  | 'APROBADA'
  | 'FIRMA_SOLICITADA'
  | 'FIRMA_EN_PROCESO'
  | 'FIRMADA'
  | 'PDF_GENERADO'
  | 'RESPUESTA_ENVIANDO'
  | 'RESPUESTA_ENVIADA'
  | 'RECHAZADA'
  | 'ERROR_FIRMA'
  | 'ERROR_ENVIO_RESPUESTA'
  | 'REQUIERE_REVISION_MANUAL'
export type TransferRequestItemStatus = 'PENDIENTE' | 'EMPAREJADO' | 'TRASLADADO' | 'ERROR'

export interface TransferRequestItem {
  id:          number
  requestId:   number
  assetId:     number | null
  assetPlate:  string | null
  assetName:   string | null
  plateRaw:    string | null
  nameRaw:     string | null
  serialRaw:   string | null
  quantity:    number
  matched:     boolean
  transferId:  number | null
  status:      TransferRequestItemStatus
  notes:       string | null
}

export interface TransferRequest {
  id:                  number
  requestNumber:       string
  subject:             string | null
  senderEmail:         string | null
  receivedAt:          string | null
  rawText:             string | null
  docxDriveUrl:        string | null
  formData:            Record<string, unknown> | null
  status:              TransferRequestStatus
  autoSigned:          boolean
  signatureEntrega:    string | null
  signatureRecibe:     string | null
  signatureAutoriza:   string | null
  signedAt:            string | null
  signedBy:            string | null
  notes:               string | null
  n8nWebhookSentAt:    string | null
  createdAt:           string
  updatedAt:           string
  // Agrupaciones calculadas en la query
  itemsCount:          number
  itemsMatched:        number
  items?:              TransferRequestItem[]
}

export interface TransferRequestListResponse {
  data: TransferRequest[]
  meta: { total: number; page: number; limit: number; pages: number }
}

export interface TransferRequestStats {
  total:                        number
  recibida:                     number
  pendienteGestionActivosFijos: number
  revision:                     number
  aprobada:                     number
  firmaSolicitada:              number
  firmaEnProceso:               number
  firmada:                      number
  pdfGenerado:                  number
  respuestaEnviando:            number
  respuestaEnviada:             number
  rechazada:                    number
  errorFirma:                   number
  errorEnvioRespuesta:          number
  requiereRevisionManual:       number
}

export interface UpdateTransferRequestPayload {
  status?:            TransferRequestStatus
  notes?:             string
  signatureEntrega?:  string
  signatureRecibe?:   string
  signatureAutoriza?: string
  signedBy?:          string
}

export interface SignTransferRequestPayload {
  requestedByName:       string
  requestedByEmail:      string
  signatureImageFileId?: string
  signatureAnchor?:      string
}

export const apiTransferRequests = {
  list: (params: Record<string, string | number | undefined>) => {
    const clean = Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== '')
    ) as Record<string, string>
    const qs = new URLSearchParams(clean).toString()
    return request<TransferRequestListResponse>(`/transfers/requests${qs ? `?${qs}` : ''}`)
  },
  get:    (id: number)                                         => request<TransferRequest>(`/transfers/requests/${id}`),
  update: (id: number, data: UpdateTransferRequestPayload)     => request<TransferRequest>(`/transfers/requests/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  stats:  ()                                                   => request<TransferRequestStats>('/transfers/requests/stats'),
  delete: (id: number)                                         => request<{ success: boolean }>(`/transfers/requests/${id}`, { method: 'DELETE' }),
  sign:   (id: number, data: SignTransferRequestPayload)        => request<{ ok: boolean; message: string }>(`/transfers/requests/${id}/sign`, { method: 'POST', body: JSON.stringify(data) }),
}

// ── Users ─────────────────────────────────────────────────────────────────────

export interface SystemUser {
  id:           number
  email:        string
  role:         string
  cargo:        string
  dependencia:  string
  name:         string | null
  isActive:     boolean
  lastLoginAt:  string | null
  createdAt:    string
  updatedAt:    string
}

export interface UpdateUserPayload {
  role?:        string
  cargo?:       string
  dependencia?: string
  isActive?:    boolean
}

export const apiUsers = {
  list:   () =>
    request<SystemUser[]>('/users'),
  update: (email: string, data: UpdateUserPayload) =>
    request<SystemUser>(`/users/${encodeURIComponent(email)}`, {
      method: 'PUT',
      body:   JSON.stringify(data),
    }),
}

// ── Writeoffs ─────────────────────────────────────────────────────────────────

export interface WriteoffAct {
  id:               number
  actaNumber:       string
  date:             string | null
  building:         string | null
  reason:           string
  status:           string
  totalItems:       number
  authorizedBy:     string | null
  authorizedByRole: string | null
  responsible:      string | null
  responsibleRole:  string | null
  notes:            string | null
  createdAt:        string
  matchedCount:     string
  notFoundCount:    string
  noRegistraCount:  string
  referenceValue:   string | null
}

export interface WriteoffItem {
  id:                  number
  itemNumber:          number
  plateSerial:         string | null
  noRegistra:          boolean
  assetId:             number | null
  description:         string | null
  assetType:           string | null
  brandModel:          string | null
  reconciledStatus:    string
  assetPlate:          string | null
  assetName:           string | null
  assetBrand:          string | null
  assetModel:          string | null
  assetReferenceValue: string | null
  assetCurrentStatus:  string | null
}

export interface WriteoffActDetail extends WriteoffAct {
  updatedAt: string
  items:     WriteoffItem[]
}

export interface WriteoffListResponse {
  data: WriteoffAct[]
  meta: { total: number; page: number; limit: number; pages: number }
}

export interface WriteoffStats {
  totalActs:     number
  totalItems:    number
  matchedItems:  number
  totalValue:    number
  byReason:      Array<{ reason: string; count: string | number }>
  byBuilding:    Array<{ building: string; count: string | number }>
  reconciliation: Array<{ status: string; count: number }>
}

export const apiWriteoffs = {
  list: (params: Record<string, string | number | undefined>) => {
    const clean = Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== '')
    ) as Record<string, string>
    const qs = new URLSearchParams(clean).toString()
    return request<WriteoffListResponse>(`/writeoffs${qs ? `?${qs}` : ''}`)
  },
  get:    (id: number)           => request<WriteoffActDetail>(`/writeoffs/${id}`),
  stats:  ()                     => request<WriteoffStats>('/writeoffs/stats'),
  create: (data: unknown)        => request<WriteoffActDetail>('/writeoffs', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: unknown) => request<WriteoffActDetail>(`/writeoffs/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
}
