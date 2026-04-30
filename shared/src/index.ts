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
