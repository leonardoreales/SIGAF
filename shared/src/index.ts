import { z } from 'zod'

// ── ENUMS ────────────────────────────────────────────────────────────────────

export const MaintenanceAreaSchema = z.enum([
  'INFRAESTRUCTURA',
  'SISTEMAS',
  'TRANSPORTE',
  'ACTIVOS_FIJOS',
])

export const CriticalitySchema = z.enum(['ALTO', 'MEDIO', 'BAJO'])

export const AssetStatusSchema = z.enum([
  'ACTIVO',
  'BAJA',
  'EN_TRASLADO',
  'EN_MANTENIMIENTO',
  'DADO_DE_BAJA',
])

export const PlateStatusSchema = z.enum([
  'OK',
  'GENERADA',
  'DUPLICADA',
  'GRUPO_ERRADO',
  'FORMATO_INVALIDO',
  'REQUIERE_REVISION',
])

export const AssetTypeCodeSchema = z.enum(['45', '55', '60', '65', '70', '75'])

// ── ASSET CRUD ───────────────────────────────────────────────────────────────

export const CreateAssetSchema = z.object({
  name:              z.string().min(1).max(300),
  description:       z.string().max(1000).optional(),
  assetTypeCode:     AssetTypeCodeSchema,
  pucAccount:        z.string().max(20).optional(),
  brand:             z.string().max(100).optional(),
  model:             z.string().max(100).optional(),
  serial:            z.string().max(200).optional(),
  quantity:          z.number().int().positive().default(1),
  referenceValue:    z.number().positive().optional(),
  cityCode:          z.string().length(1).default('1'),
  buildingId:        z.number().int().positive(),
  floor:             z.string().max(50).optional(),
  block:             z.string().max(50).optional(),
  location:          z.string().max(200).optional(),
  areaId:            z.number().int().positive().optional(),
  personId:          z.number().int().positive().optional(),
  responsableRaw:    z.string().max(300).optional(),
  status:            AssetStatusSchema.default('ACTIVO'),
  incorporationYear: z.number().int().min(1990).max(2100).optional(),
  maintenanceArea:   MaintenanceAreaSchema.optional(),
  criticality:       CriticalitySchema.default('BAJO'),
  notes:             z.string().optional(),
})

export const UpdateAssetSchema = z.object({
  name:              z.string().min(1).max(300).optional(),
  description:       z.string().max(1000).optional(),
  pucAccount:        z.string().max(20).optional(),
  brand:             z.string().max(100).optional(),
  model:             z.string().max(100).optional(),
  serial:            z.string().max(200).optional(),
  quantity:          z.number().int().positive().optional(),
  referenceValue:    z.number().positive().optional(),
  floor:             z.string().max(50).optional(),
  block:             z.string().max(50).optional(),
  location:          z.string().max(200).optional(),
  areaId:            z.number().int().positive().nullable().optional(),
  personId:          z.number().int().positive().nullable().optional(),
  responsableRaw:    z.string().max(300).optional(),
  status:            AssetStatusSchema.optional(),
  incorporationYear: z.number().int().min(1990).max(2100).optional(),
  maintenanceArea:   MaintenanceAreaSchema.nullable().optional(),
  criticality:       CriticalitySchema.optional(),
  notes:             z.string().optional(),
})

// ── FILTERS / PAGINATION ─────────────────────────────────────────────────────

export const AssetFilterSchema = z.object({
  page:     z.coerce.number().int().positive().default(1),
  limit:    z.coerce.number().int().min(1).max(200).default(50),
  q:        z.string().optional(),
  building: z.string().optional(),
  type:     AssetTypeCodeSchema.optional(),
  status:   AssetStatusSchema.optional(),
  year:     z.coerce.number().int().optional(),
  areaId:   z.coerce.number().int().positive().optional(),
})

// ── AUTH ─────────────────────────────────────────────────────────────────────

export const GoogleLoginSchema = z.object({
  idToken: z.string().min(1),
})

// ── TIPOS EXPORTADOS ─────────────────────────────────────────────────────────

export type AssetStatus      = z.infer<typeof AssetStatusSchema>
export type PlateStatus      = z.infer<typeof PlateStatusSchema>
export type AssetTypeCode    = z.infer<typeof AssetTypeCodeSchema>
export type MaintenanceArea  = z.infer<typeof MaintenanceAreaSchema>
export type Criticality      = z.infer<typeof CriticalitySchema>
export type CreateAsset      = z.infer<typeof CreateAssetSchema>
export type UpdateAsset      = z.infer<typeof UpdateAssetSchema>
export type AssetFilter      = z.infer<typeof AssetFilterSchema>
export type GoogleLogin      = z.infer<typeof GoogleLoginSchema>

// ── TRANSFERS ─────────────────────────────────────────────────────────────────

export const TransferStatusSchema = z.enum([
  'PENDIENTE',
  'EN_PROCESO',
  'COMPLETADO',
  'CANCELADO',
])

export const TransferReasonSchema = z.enum([
  'REUBICACION',
  'MANTENIMIENTO',
  'DONACION',
  'PRESTAMO',
  'ACTUALIZACION_RESPONSABLE',
  'OTRO',
])

export const CreateTransferSchema = z.object({
  assetId:         z.number().int().positive(),
  destBuildingId:  z.number().int().positive(),
  destAreaId:      z.number().int().positive().optional(),
  destPersonId:    z.number().int().positive().optional(),
  destResponsible: z.string().max(300).optional(),
  destFloor:       z.string().max(50).optional(),
  destBlock:       z.string().max(50).optional(),
  destLocation:    z.string().max(200).optional(),
  reason:          TransferReasonSchema.optional(),
  requestedBy:     z.string().max(300).optional(),
  notes:           z.string().optional(),
  scheduledAt:     z.string().optional(),
})

export const UpdateTransferSchema = z.object({
  status:          TransferStatusSchema.optional(),
  destBuildingId:  z.number().int().positive().optional(),
  destAreaId:      z.number().int().positive().nullable().optional(),
  destPersonId:    z.number().int().positive().nullable().optional(),
  destResponsible: z.string().max(300).optional(),
  destFloor:       z.string().max(50).optional(),
  destBlock:       z.string().max(50).optional(),
  destLocation:    z.string().max(200).optional(),
  reason:          TransferReasonSchema.optional(),
  requestedBy:     z.string().max(300).optional(),
  notes:           z.string().optional(),
  scheduledAt:     z.string().nullable().optional(),
})

export const TransferFilterSchema = z.object({
  page:           z.coerce.number().int().positive().default(1),
  limit:          z.coerce.number().int().min(1).max(200).default(50),
  q:              z.string().optional(),
  status:         TransferStatusSchema.optional(),
  originBuilding: z.coerce.number().int().optional(),
  destBuilding:   z.coerce.number().int().optional(),
})

export type TransferStatus = z.infer<typeof TransferStatusSchema>
export type TransferReason = z.infer<typeof TransferReasonSchema>
export type CreateTransfer = z.infer<typeof CreateTransferSchema>
export type UpdateTransfer = z.infer<typeof UpdateTransferSchema>
export type TransferFilter = z.infer<typeof TransferFilterSchema>

// ── USERS ─────────────────────────────────────────────────────────────────────

export const RoleSchema = z.enum(['ADMIN', 'ACTIVOS_FIJOS', 'COMPRAS', 'VIEWER'])

export const UpdateUserSchema = z.object({
  role:        RoleSchema.optional(),
  cargo:       z.string().min(2).max(200).optional(),
  dependencia: z.string().min(2).max(200).optional(),
  isActive:    z.boolean().optional(),
})

export type Role       = z.infer<typeof RoleSchema>
export type UpdateUser = z.infer<typeof UpdateUserSchema>

// ── TRANSFER REQUESTS ────────────────────────────────────────────────────────

export const TransferRequestStatusSchema = z.enum([
  'RECIBIDA',
  'REVISION',
  'APROBADA',
  'FIRMADA',
  'RECHAZADA',
])

export const TransferRequestItemStatusSchema = z.enum([
  'PENDIENTE',
  'EMPAREJADO',
  'TRASLADADO',
  'ERROR',
])

const TransferRequestItemSchema = z.object({
  plateRaw:  z.string().max(30).optional(),
  nameRaw:   z.string().max(300).optional(),
  serialRaw: z.string().max(200).optional(),
  quantity:  z.number().int().positive().default(1),
})

export const CreateTransferRequestSchema = z.object({
  subject:      z.string().optional(),
  senderEmail:  z.string().email().optional(),
  receivedAt:   z.string().optional(),
  rawText:      z.string().optional(),
  docxDriveUrl: z.string().optional(),
  formData:     z.record(z.unknown()).optional(),
  items:        z.array(TransferRequestItemSchema).default([]),
  signatures:   z.object({
    entrega:  z.string().nullable().optional(),
    recibe:   z.string().nullable().optional(),
    autoriza: z.string().nullable().optional(),
  }).optional(),
})

export const UpdateTransferRequestSchema = z.object({
  status:             TransferRequestStatusSchema.optional(),
  notes:              z.string().optional(),
  signatureEntrega:   z.string().optional(),
  signatureRecibe:    z.string().optional(),
  signatureAutoriza:  z.string().optional(),
  signedBy:           z.string().optional(),
})

export const TransferRequestFilterSchema = z.object({
  page:   z.coerce.number().int().positive().default(1),
  limit:  z.coerce.number().int().min(1).max(200).default(50),
  q:      z.string().optional(),
  status: TransferRequestStatusSchema.optional(),
})

export type TransferRequestStatus     = z.infer<typeof TransferRequestStatusSchema>
export type TransferRequestItemStatus = z.infer<typeof TransferRequestItemStatusSchema>
export type CreateTransferRequest     = z.infer<typeof CreateTransferRequestSchema>
export type UpdateTransferRequest     = z.infer<typeof UpdateTransferRequestSchema>
export type TransferRequestFilter     = z.infer<typeof TransferRequestFilterSchema>

// ── WRITEOFFS (BAJAS) ────────────────────────────────────────────────────────

export const WriteoffStatusSchema = z.enum(['BORRADOR', 'EN_REVISION', 'COMPLETADA', 'RECHAZADA'])

export const WriteoffReasonSchema = z.enum([
  'DAÑO',
  'OBSOLESCENCIA',
  'DETERIORO_MOBILIARIO',
  'CAMBIO_MOBILIARIO',
  'REEMPLAZO_MOBILIARIO',
  'VENTA_VEHICULOS',
  'DESUSO',
  'BAJA',
])

export const WriteoffFilterSchema = z.object({
  page:     z.coerce.number().int().positive().default(1),
  limit:    z.coerce.number().int().min(1).max(200).default(50),
  q:        z.string().optional(),
  building: z.string().optional(),
  reason:   z.string().optional(),
  status:   z.string().optional(),
})

export const CreateWriteoffActSchema = z.object({
  actaNumber:       z.string().max(20),
  date:             z.string().optional(),
  building:         z.string().max(100).optional(),
  reason:           z.string().max(60),
  status:           WriteoffStatusSchema.default('COMPLETADA'),
  authorizedBy:     z.string().max(300).optional(),
  authorizedByRole: z.string().max(200).optional(),
  responsible:      z.string().max(300).optional(),
  responsibleRole:  z.string().max(200).optional(),
  notes:            z.string().optional(),
})

export const UpdateWriteoffActSchema = z.object({
  status:  WriteoffStatusSchema.optional(),
  notes:   z.string().optional(),
})

export type WriteoffStatus      = z.infer<typeof WriteoffStatusSchema>
export type WriteoffReason      = z.infer<typeof WriteoffReasonSchema>
export type WriteoffFilter      = z.infer<typeof WriteoffFilterSchema>
export type CreateWriteoffAct   = z.infer<typeof CreateWriteoffActSchema>
export type UpdateWriteoffAct   = z.infer<typeof UpdateWriteoffActSchema>

// ── RECEPCIONES — Reglas de serial por tipo ──────────────────────────────────

export type SerialRule = 'required' | 'optional' | 'disabled'

// Keyed by AssetTypeCode ('45'|'55'|'60'|'65'|'70'|'75')
export const ASSET_TYPE_SERIAL_RULES: Record<string, SerialRule> = {
  '45': 'optional',   // EQUIPO MÉDICO Y CIENTÍFICO
  '55': 'required',   // MAQUINARIA Y EQUIPO
  '60': 'required',   // EQUIPOS DE TRANSPORTE, TRACCIÓN Y ELEVACIÓN
  '65': 'disabled',   // MUEBLES, ENSERES Y EQUIPO DE OFICINA
  '70': 'required',   // EQUIPOS DE COMUNICACIÓN Y COMPUTACIÓN
  '75': 'disabled',   // PLANTAS, DUCTOS Y TÚNELES
}
