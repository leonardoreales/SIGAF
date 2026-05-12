import { useState, useEffect } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import {
  X, Pencil, Check,
  Monitor, LayoutGrid, FlaskConical, ShieldCheck, Truck, Tv2,
  Layers, Tag, MapPin, User, FileText,
  Building, Mail, Hash, Download, Plus, Lock,
} from 'lucide-react'
import { apiAssets, apiCatalogs, ApiError } from '../../lib/api'
import type { Asset, Building as BuildingT, Area, Person } from '../../lib/api'

// ── Constants ─────────────────────────────────────────────────────────────────

import { getSmartIcon } from './AssetsTable'

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  ACTIVO:           'Activo',
  EN_MANTENIMIENTO: 'En mantenimiento',
  EN_TRASLADO:      'En traslado',
  BAJA:             'Baja',
  DADO_DE_BAJA:     'Dado de baja',
}

const STATUS_OPTIONS = [
  { value: 'ACTIVO',           label: 'Activo' },
  { value: 'EN_MANTENIMIENTO', label: 'En mantenimiento' },
  { value: 'EN_TRASLADO',      label: 'En traslado' },
  { value: 'BAJA',             label: 'Baja' },
]

const MAINTENANCE_OPTIONS = [
  { value: '',                 label: 'Sin definir' },
  { value: 'INFRAESTRUCTURA', label: 'Infraestructura' },
  { value: 'SISTEMAS',        label: 'Sistemas' },
  { value: 'TRANSPORTE',      label: 'Transporte' },
  { value: 'ACTIVOS_FIJOS',   label: 'Activos Fijos' },
]

const CRITICALITY_OPTIONS = [
  { value: 'BAJO',  label: 'Bajo' },
  { value: 'MEDIO', label: 'Medio' },
  { value: 'ALTO',  label: 'Alto' },
]

const YEAR_OPTIONS = ['2022', '2023', '2024', '2025', '2026']

// ── Formatter ─────────────────────────────────────────────────────────────────

function fmtCOP(v: string | null | undefined) {
  if (!v) return '—'
  const n = Number(v)
  if (isNaN(n) || n === 0) return '—'
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)
}

// ── Draft type ────────────────────────────────────────────────────────────────

type Draft = {
  name:              string
  pucAccount:        string
  brand:             string
  model:             string
  serial:            string
  quantity:          string
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

function toDraft(a: Asset): Draft {
  return {
    name:              a.name              ?? '',
    pucAccount:        a.pucAccount        ?? '',
    brand:             a.brand             ?? '',
    model:             a.model             ?? '',
    serial:            a.serial            ?? '',
    quantity:          String(a.quantity   ?? 1),
    floor:             a.floor             ?? '',
    block:             a.block             ?? '',
    location:          a.location          ?? '',
    areaId:            String(a.areaId     ?? ''),
    personId:          String(a.personId   ?? ''),
    responsableRaw:    a.responsableRaw    ?? '',
    status:            a.status            ?? 'ACTIVO',
    incorporationYear: String(a.incorporationYear ?? ''),
    referenceValue:    a.referenceValue    ?? '',
    maintenanceArea:   a.maintenanceArea   ?? '',
    criticality:       a.criticality       ?? 'BAJO',
    notes:             a.notes             ?? '',
  }
}

function toPayload(d: Draft) {
  return {
    name:              d.name              || undefined,
    pucAccount:        d.pucAccount        || undefined,
    brand:             d.brand             || undefined,
    model:             d.model             || undefined,
    serial:            d.serial            || undefined,
    quantity:          Number(d.quantity)  || 1,
    referenceValue:    d.referenceValue    ? Number(d.referenceValue) : undefined,
    floor:             d.floor             || undefined,
    block:             d.block             || undefined,
    location:          d.location          || undefined,
    areaId:            d.areaId            ? Number(d.areaId)    : null,
    personId:          d.personId          ? Number(d.personId)  : null,
    responsableRaw:    d.responsableRaw    || undefined,
    status:            d.status            as 'ACTIVO' | 'EN_MANTENIMIENTO' | 'EN_TRASLADO' | 'BAJA',
    incorporationYear: d.incorporationYear ? Number(d.incorporationYear) : undefined,
    maintenanceArea:   (d.maintenanceArea  || null) as 'INFRAESTRUCTURA' | 'SISTEMAS' | 'TRANSPORTE' | 'ACTIVOS_FIJOS' | null,
    criticality:       (d.criticality      || 'BAJO') as 'BAJO' | 'MEDIO' | 'ALTO',
    notes:             d.notes             || undefined,
  }
}

// ── Sub-components ────────────────────────────────────────────────────────────

type Mode = 'view' | 'edit'
type Tab  = 'general' | 'tecnica' | 'ubicacion' | 'asignacion' | 'documentos'

function TypeIconDark({ assetName, code, size = 64 }: { assetName?: string | null; code: string | null; size?: number }) {
  const IconComponent = getSmartIcon(assetName, code)
  const px = Math.max(18, Math.round(size * 0.5))
  return (
    <div style={{
      width: size, height: size, flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#E9C76E',
    }}>
      <IconComponent size={px} strokeWidth={1.5} />
    </div>
  )
}

// Dark field: label + view/edit control
function DF({
  label, value, mode, onChange, mono = false, locked = false,
  options, type = 'text', placeholder, span2 = false,
}: {
  label: string; value: string; mode: Mode;
  onChange?: (v: string) => void
  mono?: boolean; locked?: boolean
  options?: { value: string; label: string }[]
  type?: string; placeholder?: string; span2?: boolean
}) {
  const isEdit = mode === 'edit' && !locked
  const font   = mono ? '"JetBrains Mono", monospace' : 'inherit'
  const base: React.CSSProperties = {
    width: '100%', padding: '8px 12px',
    background: 'var(--modal-field-bg)',
    border: '1px solid var(--modal-field-border)',
    borderRadius: 8, color: 'var(--modal-field-color)',
    fontSize: 13, outline: 'none', fontFamily: font,
  }
  return (
    <div style={span2 ? { gridColumn: '1 / -1' } : {}}>
      <div style={{
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: 9, letterSpacing: '0.2em',
        color: 'var(--modal-label)',
        textTransform: 'uppercase', marginBottom: 6,
        display: 'flex', alignItems: 'center', gap: 5,
      }}>
        {label}
        {locked && mode === 'edit' && <Lock size={9} />}
      </div>
      {isEdit ? (
        options ? (
          <select value={value} onChange={e => onChange?.(e.target.value)} style={{ ...base, cursor: 'pointer' }}>
            {options.map(o => (
              <option key={o.value} value={o.value} style={{ background: 'var(--modal-opt-bg)' }}>{o.label}</option>
            ))}
          </select>
        ) : type === 'textarea' ? (
          <textarea value={value} onChange={e => onChange?.(e.target.value)} rows={3}
            placeholder={placeholder}
            style={{ ...base, resize: 'vertical', minHeight: 80, fontFamily: 'inherit' }} />
        ) : (
          <input value={value} onChange={e => onChange?.(e.target.value)}
            type={type} placeholder={placeholder} style={base} />
        )
      ) : (
        <div style={{
          fontSize: 13.5,
          color: value ? 'var(--modal-text)' : 'var(--modal-text-muted)',
          padding: '6px 0',
          borderBottom: '1px solid var(--modal-sep)',
          fontFamily: font, fontWeight: 500, minHeight: 28,
        }}>
          {value || '—'}
        </div>
      )}
    </div>
  )
}

function DSection({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
      <h3 style={{
        margin: 0,
        fontFamily: "'Syne', system-ui, sans-serif",
        fontSize: 11, fontWeight: 600,
        color: 'var(--modal-section-title)', letterSpacing: '0.2em', textTransform: 'uppercase',
      }}>
        {children}
      </h3>
      <div style={{ flex: 1, height: 1, background: 'var(--modal-section-line)' }} />
    </div>
  )
}

function DKPI({ label, value, accent = false, suffix }: {
  label: string; value: string | number | null; accent?: boolean; suffix?: string
}) {
  return (
    <div style={{
      background: accent
        ? 'linear-gradient(135deg, rgba(217,171,68,0.10), rgba(217,171,68,0.03))'
        : 'var(--modal-kpi-bg)',
      border: `1px solid ${accent ? 'rgba(217,171,68,0.30)' : 'var(--modal-card-border)'}`,
      borderRadius: 10, padding: 14,
    }}>
      <div style={{
        fontFamily: '"JetBrains Mono", monospace', fontSize: 9,
        letterSpacing: '0.2em', color: accent ? 'var(--modal-tab-active)' : 'var(--modal-label)',
        marginBottom: 8,
      }}>
        {label}
      </div>
      <div style={{ fontFamily: "'Syne', system-ui", fontSize: 18, fontWeight: 700, color: 'var(--modal-kpi-color)', letterSpacing: '-0.01em' }}>
        {value ?? '—'}
      </div>
      {suffix && <div style={{ fontSize: 11, color: 'var(--modal-kpi-suffix)', marginTop: 3 }}>{suffix}</div>}
    </div>
  )
}

// ── Tab content ───────────────────────────────────────────────────────────────

function TabGeneral({ asset, mode, draft, upd }: { asset: Asset; mode: Mode; draft: Draft; upd: (k: keyof Draft, v: string) => void }) {
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 22 }}>
        <DKPI label="VALOR DE REFERENCIA" value={fmtCOP(asset.referenceValue)} accent />
        <DKPI label="AÑO INCORPORACIÓN"   value={asset.incorporationYear ?? '—'} />
        <DKPI label="CANTIDAD"            value={asset.quantity} suffix={asset.quantity === 1 ? 'unidad' : 'unidades'} />
      </div>

      <DSection>Identificación</DSection>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 22 }}>
        <DF label="NOMBRE DEL ACTIVO" value={draft.name} mode={mode} onChange={v => upd('name', v)} span2 />
        <DF label="TIPO DE ACTIVO" value={asset.assetTypeName ?? '—'} mode={mode} locked />
        <DF label="CUENTA PUC" value={draft.pucAccount} mode={mode} onChange={v => upd('pucAccount', v)} mono />
      </div>

      <DSection>Estado y criticidad</DSection>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 22 }}>
        <DF
          label="ESTADO"
          value={mode === 'edit' ? draft.status : (STATUS_LABELS[draft.status] ?? draft.status)}
          mode={mode}
          options={STATUS_OPTIONS}
          onChange={v => upd('status', v)}
        />
        <DF
          label="CRITICIDAD"
          value={mode === 'edit' ? draft.criticality : draft.criticality}
          mode={mode}
          options={CRITICALITY_OPTIONS}
          onChange={v => upd('criticality', v)}
        />
        <DF
          label="ÁREA DE MTTO."
          value={mode === 'edit' ? draft.maintenanceArea : (draft.maintenanceArea || '—')}
          mode={mode}
          options={MAINTENANCE_OPTIONS}
          onChange={v => upd('maintenanceArea', v)}
        />
      </div>

      {(asset.notes || mode === 'edit') && (
        <>
          <DSection>Notas</DSection>
          <DF
            label="OBSERVACIONES"
            value={draft.notes} mode={mode} type="textarea"
            onChange={v => upd('notes', v)}
            placeholder="Observaciones, garantías, calibraciones…"
          />
        </>
      )}
    </div>
  )
}

function TabTecnica({ asset, mode, draft, upd }: { asset: Asset; mode: Mode; draft: Draft; upd: (k: keyof Draft, v: string) => void }) {
  return (
    <div>
      <DSection>Especificaciones técnicas</DSection>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 22 }}>
        <DF label="MARCA"  value={draft.brand}  mode={mode} onChange={v => upd('brand', v)} />
        <DF label="MODELO" value={draft.model}  mode={mode} onChange={v => upd('model', v)} />
        <DF label="SERIAL" value={draft.serial} mode={mode} onChange={v => upd('serial', v)} mono />
        <DF label="CUENTA PUC" value={draft.pucAccount} mode={mode} onChange={v => upd('pucAccount', v)} mono />
      </div>

      <DSection>Información financiera</DSection>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <DF
          label="VALOR DE REFERENCIA"
          value={mode === 'edit' ? draft.referenceValue : fmtCOP(asset.referenceValue)}
          mode={mode}
          onChange={v => upd('referenceValue', v)}
          mono
        />
        <DF
          label="AÑO DE INCORPORACIÓN"
          value={mode === 'edit' ? draft.incorporationYear : String(asset.incorporationYear ?? '—')}
          mode={mode}
          options={mode === 'edit' ? [{ value: '', label: 'Inicial' }, ...YEAR_OPTIONS.map(y => ({ value: y, label: y }))] : undefined}
          onChange={v => upd('incorporationYear', v)}
        />
        <DF
          label="CANTIDAD"
          value={draft.quantity}
          mode={mode}
          type="number"
          onChange={v => upd('quantity', v)}
        />
        <DF label="ESTADO PLACA" value={asset.plateStatus ?? '—'} mode={mode} locked />
      </div>
    </div>
  )
}

function TabUbicacion({ asset, mode, draft, upd, buildings, areas }: {
  asset: Asset; mode: Mode; draft: Draft; upd: (k: keyof Draft, v: string) => void
  buildings: BuildingT[]; areas: Area[]
}) {
  return (
    <div>
      <DSection>Ubicación física</DSection>

      {/* Building card */}
      <div style={{
        background: 'var(--modal-card-bg)', border: '1px solid var(--modal-card-border)',
        borderRadius: 12, padding: 16, marginBottom: 22,
        display: 'flex', alignItems: 'center', gap: 14,
      }}>
        <div style={{
          width: 48, height: 48, borderRadius: 12, flexShrink: 0,
          background: 'rgba(217,171,68,0.13)', color: '#E9C76E',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '1px solid rgba(217,171,68,0.25)',
        }}>
          <Building size={22} strokeWidth={1.6} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: 'var(--modal-text)', fontWeight: 600, fontSize: 14.5 }}>{asset.buildingName ?? '—'}</div>
          <div style={{ color: 'var(--modal-text-sub)', fontSize: 12, marginTop: 2 }}>
            {[asset.block && `Bloque ${asset.block}`, asset.floor && `Piso ${asset.floor}`, asset.location].filter(Boolean).join(' · ') || 'Sin ubicación específica'}
          </div>
          {asset.buildingCode && (
            <div style={{ color: 'var(--modal-text-dim)', fontSize: 11, marginTop: 3, fontFamily: '"JetBrains Mono", monospace' }}>
              {asset.buildingCode}
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 14, marginBottom: 22 }}>
        <DF label="EDIFICIO" value={asset.buildingName ?? '—'} mode={mode} locked />
        <DF label="BLOQUE"   value={draft.block} mode={mode} onChange={v => upd('block', v)} />
        <DF label="PISO"     value={draft.floor} mode={mode} onChange={v => upd('floor', v)} />
        <DF label="UBICACIÓN ESPECÍFICA" value={draft.location} mode={mode} onChange={v => upd('location', v)} placeholder="Ej. Oficina 305" span2 />
      </div>

      <DSection>Área administrativa</DSection>
      <DF
        label="ÁREA"
        value={mode === 'edit' ? draft.areaId : (asset.areaName ?? '—')}
        mode={mode}
        options={[{ value: '', label: 'Sin área' }, ...areas.map(a => ({ value: String(a.id), label: a.name }))]}
        onChange={v => upd('areaId', v)}
      />
    </div>
  )
}

function TabAsignacion({ asset, mode, draft, upd, person, people }: {
  asset: Asset; mode: Mode; draft: Draft; upd: (k: keyof Draft, v: string) => void
  person: Person | null; people: Person[]
}) {
  return (
    <div>
      <DSection>Persona responsable</DSection>

      {person && (
        <div style={{
          background: 'var(--modal-card-bg)', border: '1px solid var(--modal-card-border)',
          borderRadius: 12, padding: 18,
          display: 'flex', gap: 16, alignItems: 'center', marginBottom: 22,
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12, flexShrink: 0,
            background: 'rgba(217,171,68,0.13)', color: '#E9C76E',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '1px solid rgba(217,171,68,0.25)',
          }}>
            <User size={22} strokeWidth={1.6} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: 'var(--modal-text)', fontFamily: "'Syne', system-ui", fontWeight: 600, fontSize: 15 }}>
              {person.fullName}
            </div>
            <div style={{ color: 'var(--modal-text-sub)', fontSize: 12, marginTop: 3 }}>{asset.areaName ?? ''}</div>
            <div style={{ display: 'flex', gap: 14, fontSize: 11.5, color: 'var(--modal-text-sub)', marginTop: 8, flexWrap: 'wrap' }}>
              {person.email && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  <Mail size={12} strokeWidth={1.5} /> {person.email}
                </span>
              )}
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: '"JetBrains Mono", monospace' }}>
                <Hash size={11} strokeWidth={1.5} /> ID {person.id}
              </span>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <DF
          label="PERSONA RESPONSABLE"
          value={mode === 'edit' ? draft.personId : (person?.fullName ?? '—')}
          mode={mode}
          options={[{ value: '', label: 'Sin asignar' }, ...people.map(p => ({ value: String(p.id), label: p.fullName }))]}
          onChange={v => upd('personId', v)}
        />
        <DF
          label="RESPONSABLE (TEXTO LIBRE)"
          value={draft.responsableRaw}
          mode={mode}
          onChange={v => upd('responsableRaw', v)}
          placeholder="Nombre como figura en el acta"
        />
      </div>
    </div>
  )
}

function TabDocumentos() {
  return (
    <div>
      <DSection>Documentos asociados</DSection>
      <div style={{ display: 'grid', gap: 8 }}>
        <div style={{
          padding: 14, background: 'transparent',
          border: '1.5px dashed var(--modal-doc-border)', borderRadius: 10,
          color: 'var(--modal-doc-color)', fontSize: 13,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          cursor: 'pointer',
        }}>
          <Plus size={14} strokeWidth={1.6} /> Subir documento
        </div>
        <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--modal-doc-empty)', margin: '4px 0 0' }}>
          Los documentos asociados al activo aparecerán aquí.
        </p>
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

interface Props {
  assetId: number
  onClose: () => void
  onSaved: () => void
}

export default function AssetDrawer({ assetId, onClose, onSaved }: Props) {
  const [mode,      setMode]      = useState<Mode>('view')
  const [tab,       setTab]       = useState<Tab>('general')
  const [draft,     setDraft]     = useState<Draft | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Close on Escape
  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', fn)
    return () => document.removeEventListener('keydown', fn)
  }, [onClose])

  // Load asset
  const { data: asset, isLoading } = useQuery({
    queryKey: ['asset', assetId],
    queryFn:  () => apiAssets.get(assetId),
  })

  // Catalogs
  const { data: buildings = [] } = useQuery({ queryKey: ['catalog', 'buildings'], queryFn: apiCatalogs.buildings, staleTime: Infinity })
  const { data: areas      = [] } = useQuery({ queryKey: ['catalog', 'areas'],      queryFn: apiCatalogs.areas,      staleTime: Infinity })
  const { data: people     = [] } = useQuery({ queryKey: ['catalog', 'people'],     queryFn: apiCatalogs.people,     staleTime: Infinity })

  // Sync draft when asset loads
  useEffect(() => {
    if (asset) setDraft(toDraft(asset))
  }, [asset])

  // Save mutation
  const { mutateAsync, isPending: isSaving } = useMutation({
    mutationFn: (d: Draft) => apiAssets.update(assetId, toPayload(d)),
    onSuccess:  () => { setMode('view'); onSaved() },
    onError:    (err) => setSaveError(err instanceof ApiError ? err.message : 'Error al guardar'),
  })

  function handleSave() {
    if (!draft) return
    setSaveError(null)
    mutateAsync(draft).catch(() => {})
  }

  function cancelEdit() {
    if (asset) setDraft(toDraft(asset))
    setMode('view')
    setSaveError(null)
  }

  function upd(k: keyof Draft, v: string) {
    setSaveError(null)
    setDraft(d => d ? { ...d, [k]: v } : d)
  }

  const person = asset ? people.find(p => p.id === asset.personId) ?? null : null

  const TABS: { id: Tab; label: string; Icon: React.ElementType }[] = [
    { id: 'general',    label: 'General',    Icon: Layers   },
    { id: 'tecnica',    label: 'Técnica',    Icon: Tag      },
    { id: 'ubicacion',  label: 'Ubicación',  Icon: MapPin   },
    { id: 'asignacion', label: 'Asignación', Icon: User     },
    { id: 'documentos', label: 'Documentos', Icon: FileText },
  ]

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '24px' }}>
      {/* Backdrop */}
      <div
        className="drawer-backdrop"
        onClick={onClose}
        style={{ position: 'absolute', inset: 0, background: 'rgba(3,7,20,0.75)', backdropFilter: 'blur(6px)' }}
      />

      {/* Panel */}
      <div className="modal-panel" style={{
        position: 'relative',
        width: 'min(860px, calc(100vw - 48px))',
        height: 'auto',
        maxHeight: '90vh',
        borderRadius: 20,
        background: 'var(--modal-bg)',
        backgroundImage: 'var(--modal-bg-grad)',
        border: '1px solid var(--modal-border)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: 'var(--modal-shadow)',
      }}>

        {isLoading || !asset || !draft ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--modal-text-dim)', fontSize: 13 }}>
            Cargando…
          </div>
        ) : (
          <>
            {/* ── HEADER ──────────────────────────────────────── */}
            <div style={{
              padding: '20px 26px 16px',
              borderBottom: '1px solid var(--modal-head-border)',
              background: 'var(--modal-head-bg)',
              position: 'relative', flexShrink: 0,
            }}>
              {/* Double gold hairline */}
              <div style={{ position: 'absolute', top: 10, left: 26, right: 26, height: 1, background: 'var(--modal-hairline1)' }} />
              <div style={{ position: 'absolute', top: 13, left: 26, right: 26, height: 1, background: 'var(--modal-hairline2)' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 14, marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 10, letterSpacing: '0.26em', color: 'var(--modal-label-accent)', textTransform: 'uppercase' }}>
                    Hoja de Vida
                  </span>
                  <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--modal-dot-accent)', display: 'inline-block' }} />
                  <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 10, color: 'var(--modal-id-color)' }}>
                    ID #{asset.id}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {mode === 'view' ? (
                    <button
                      onClick={() => setMode('edit')}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '7px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
                        background: 'linear-gradient(135deg, #E9C76E, #BF8B30)',
                        color: '#0D1B4A', fontSize: 12.5, fontWeight: 700,
                        boxShadow: '0 4px 14px rgba(217,171,68,0.28)',
                      }}
                    >
                      <Pencil size={13} /> Editar
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={cancelEdit}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 6,
                          padding: '7px 12px', borderRadius: 8, cursor: 'pointer',
                          background: 'var(--modal-cancel-bg)', color: 'var(--modal-cancel-color)',
                          border: '1px solid var(--modal-cancel-border)', fontSize: 12.5, fontWeight: 500,
                        }}
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={isSaving}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 6,
                          padding: '7px 12px', borderRadius: 8, border: 'none', cursor: isSaving ? 'not-allowed' : 'pointer',
                          background: 'linear-gradient(135deg, #E9C76E, #BF8B30)',
                          color: '#0D1B4A', fontSize: 12.5, fontWeight: 600,
                          opacity: isSaving ? 0.7 : 1,
                        }}
                      >
                        <Check size={13} /> {isSaving ? 'Guardando…' : 'Guardar'}
                      </button>
                    </>
                  )}
                  <button
                    onClick={onClose}
                    style={{
                      width: 32, height: 32, borderRadius: 8,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'var(--modal-close-color)',
                      background: 'var(--modal-close-bg)', border: '1px solid var(--modal-close-border)',
                      cursor: 'pointer',
                    }}
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Hero: type icon + gold plate + name */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                <TypeIconDark assetName={asset.name} code={asset.assetTypeCode} size={64} />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <span className="plaqueta-hero" style={{ marginBottom: 8, display: 'inline-flex' }}>
                    {asset.plate ?? '—'}
                  </span>
                  <h2 style={{
                    fontFamily: "'Syne', system-ui, sans-serif",
                    fontSize: 21, fontWeight: 700, color: 'var(--modal-text)',
                    margin: '6px 0 0', lineHeight: 1.25, letterSpacing: '-0.01em',
                  }}>
                    {asset.name}
                  </h2>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                    <span style={{ fontSize: 12, color: 'var(--modal-text-sub)' }}>{asset.assetTypeName ?? '—'}</span>
                    <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--modal-text-dim)', display: 'inline-block' }} />
                    <span className={`s-pill-dk-${asset.status}`}>
                      {STATUS_LABELS[asset.status] ?? asset.status}
                    </span>
                    {asset.criticality && (
                      <span className={`crit-b crit-b-dk-${asset.criticality}`}>
                        Crit. {asset.criticality}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* ── TABS ────────────────────────────────────────── */}
            <div style={{ display: 'flex', padding: '0 16px', borderBottom: '1px solid var(--modal-tab-border)', flexShrink: 0, overflowX: 'auto' }}>
              {TABS.map(({ id, label, Icon }) => {
                const active = tab === id
                return (
                  <button
                    key={id}
                    onClick={() => setTab(id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '11px 14px',
                      fontSize: 12.5, fontWeight: active ? 600 : 500,
                      color: active ? 'var(--modal-tab-active)' : 'var(--modal-tab-inactive)',
                      background: 'none', border: 'none',
                      borderBottom: `2px solid ${active ? 'var(--modal-tab-active)' : 'transparent'}`,
                      cursor: 'pointer', whiteSpace: 'nowrap',
                      transition: 'color 0.15s',
                    }}
                  >
                    <Icon size={13} strokeWidth={1.6} /> {label}
                  </button>
                )
              })}
            </div>

            {/* ── BODY ────────────────────────────────────────── */}
            <div className="thin-scroll-dark" style={{ flex: 1, overflowY: 'auto', padding: '20px 26px' }}>
              {saveError && (
                <div style={{
                  background: 'rgba(220,38,38,0.12)', border: '1px solid rgba(220,38,38,0.3)',
                  borderRadius: 8, padding: '10px 14px', marginBottom: 16,
                  color: '#FCA5A5', fontSize: 13,
                }}>
                  {saveError}
                </div>
              )}

              {tab === 'general'    && <TabGeneral    asset={asset} mode={mode} draft={draft} upd={upd} />}
              {tab === 'tecnica'    && <TabTecnica    asset={asset} mode={mode} draft={draft} upd={upd} />}
              {tab === 'ubicacion'  && <TabUbicacion  asset={asset} mode={mode} draft={draft} upd={upd} buildings={buildings} areas={areas} />}
              {tab === 'asignacion' && <TabAsignacion asset={asset} mode={mode} draft={draft} upd={upd} person={person} people={people} />}
              {tab === 'documentos' && <TabDocumentos />}
            </div>

            {/* ── EDIT MODE FOOTER ────────────────────────────── */}
            {mode === 'edit' && (
              <div style={{
                padding: '10px 26px', flexShrink: 0,
                background: 'var(--modal-foot-bg)',
                borderTop: '1px solid var(--modal-foot-border)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                fontSize: 11.5, color: 'var(--modal-foot-text)',
              }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#E9C76E', boxShadow: '0 0 6px rgba(217,171,68,0.7)', display: 'inline-block' }} />
                  <strong style={{ color: '#E9C76E', fontWeight: 600 }}>Modo edición</strong>
                </span>
                <span style={{ fontFamily: '"JetBrains Mono", monospace' }}>Esc para cancelar</span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
