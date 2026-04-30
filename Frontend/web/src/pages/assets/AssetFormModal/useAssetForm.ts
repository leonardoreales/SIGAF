import { useState, useEffect } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import type { FormEvent } from 'react'
import { apiAssets, ApiError } from '../../../lib/api'

// ── Tipos públicos ─────────────────────────────────────────────────────────────

export interface AssetFormValues {
  name:              string
  assetTypeCode:     string
  pucAccount:        string
  brand:             string
  model:             string
  serial:            string
  quantity:          string
  buildingId:        string
  floor:             string
  block:             string
  location:          string
  areaId:            string
  personId:          string
  responsableRaw:    string
  status:            string
  incorporationYear: string
  referenceValue:    string
  maintenanceArea:   string
  criticality:       string
  notes:             string
}

export type ChangeField = (field: keyof AssetFormValues, value: string) => void

// ── Valores iniciales ──────────────────────────────────────────────────────────

const EMPTY: AssetFormValues = {
  name:              '',
  assetTypeCode:     '',
  pucAccount:        '',
  brand:             '',
  model:             '',
  serial:            '',
  quantity:          '1',
  buildingId:        '',
  floor:             '',
  block:             '',
  location:          '',
  areaId:            '',
  personId:          '',
  responsableRaw:    '',
  status:            'ACTIVO',
  incorporationYear: '',
  referenceValue:    '',
  maintenanceArea:   '',
  criticality:       'BAJO',
  notes:             '',
}

// ── Conversores de payload ─────────────────────────────────────────────────────

function toCreatePayload(v: AssetFormValues) {
  return {
    name:              v.name,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    assetTypeCode:     v.assetTypeCode as any,
    pucAccount:        v.pucAccount        || undefined,
    brand:             v.brand             || undefined,
    model:             v.model             || undefined,
    serial:            v.serial            || undefined,
    quantity:          Number(v.quantity)  || 1,
    referenceValue:    v.referenceValue    ? Number(v.referenceValue) : undefined,
    cityCode:          '1',                          // única sede: Barranquilla
    buildingId:        Number(v.buildingId),
    floor:             v.floor             || undefined,
    block:             v.block             || undefined,
    location:          v.location          || undefined,
    areaId:            v.areaId    ? Number(v.areaId)    : undefined,
    personId:          v.personId  ? Number(v.personId)  : undefined,
    responsableRaw:    v.responsableRaw    || undefined,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    status:            v.status as any,
    incorporationYear: v.incorporationYear ? Number(v.incorporationYear) : undefined,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    maintenanceArea:   (v.maintenanceArea  || undefined) as any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    criticality:       (v.criticality      || 'BAJO') as any,
    notes:             v.notes             || undefined,
  }
}

function toUpdatePayload(v: AssetFormValues) {
  return {
    name:              v.name              || undefined,
    pucAccount:        v.pucAccount        || undefined,
    brand:             v.brand             || undefined,
    model:             v.model             || undefined,
    serial:            v.serial            || undefined,
    quantity:          Number(v.quantity)  || 1,
    referenceValue:    v.referenceValue    ? Number(v.referenceValue) : undefined,
    floor:             v.floor             || undefined,
    block:             v.block             || undefined,
    location:          v.location          || undefined,
    areaId:            v.areaId    ? Number(v.areaId)    : null,
    personId:          v.personId  ? Number(v.personId)  : null,
    responsableRaw:    v.responsableRaw    || undefined,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    status:            v.status as any,
    incorporationYear: v.incorporationYear ? Number(v.incorporationYear) : undefined,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    maintenanceArea:   v.maintenanceArea ? (v.maintenanceArea as any) : null,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    criticality:       (v.criticality || 'BAJO') as any,
    notes:             v.notes             || undefined,
  }
}

// ── Hook ───────────────────────────────────────────────────────────────────────

interface Options {
  assetId: number | null
  onSaved: () => void
}

export function useAssetForm({ assetId, onSaved }: Options) {
  const [values, setValues] = useState<AssetFormValues>(EMPTY)
  const [error,  setError]  = useState<string | null>(null)

  // En modo editar: carga el activo para pre-poblar el form
  const { data: asset, isLoading: loadingAsset } = useQuery({
    queryKey: ['asset', assetId],
    queryFn:  () => apiAssets.get(assetId!),
    enabled:  assetId !== null,
  })

  // Hidrata el form cuando llegan los datos del activo
  useEffect(() => {
    if (!asset) return
    setValues({
      name:              asset.name              ?? '',
      assetTypeCode:     asset.assetTypeCode     ?? '',
      pucAccount:        asset.pucAccount        ?? '',
      brand:             asset.brand             ?? '',
      model:             asset.model             ?? '',
      serial:            asset.serial            ?? '',
      quantity:          String(asset.quantity   ?? 1),
      buildingId:        String(asset.buildingId ?? ''),
      floor:             asset.floor             ?? '',
      block:             asset.block             ?? '',
      location:          asset.location          ?? '',
      areaId:            String(asset.areaId     ?? ''),
      personId:          String(asset.personId   ?? ''),
      responsableRaw:    asset.responsableRaw    ?? '',
      status:            asset.status            ?? 'ACTIVO',
      incorporationYear: String(asset.incorporationYear ?? ''),
      referenceValue:    asset.referenceValue    ?? '',
      maintenanceArea:   asset.maintenanceArea   ?? '',
      criticality:       asset.criticality       ?? 'BAJO',
      notes:             asset.notes             ?? '',
    })
  }, [asset])

  // Mutación dual: crea o actualiza según assetId
  const { mutateAsync, isPending: isSaving } = useMutation({
    mutationFn: (vals: AssetFormValues) =>
      assetId
        ? apiAssets.update(assetId, toUpdatePayload(vals))
        : apiAssets.create(toCreatePayload(vals)),
    onSuccess: () => onSaved(),
    onError:   (err) => {
      setError(err instanceof ApiError ? err.message : 'Error al guardar el activo')
    },
  })

  const onChange: ChangeField = (field, value) => {
    setError(null)
    setValues(v => ({ ...v, [field]: value }))
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    await mutateAsync(values).catch(() => { /* error expuesto en estado */ })
  }

  return {
    values,
    onChange,
    onSubmit,
    isLoading: assetId !== null && loadingAsset,
    isSaving,
    error,
  }
}
