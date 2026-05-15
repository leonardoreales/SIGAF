import {
  Monitor, LayoutGrid, FlaskConical, ShieldCheck, Truck, Tv2, ChevronLeft, ChevronRight,
  PcCase, Laptop, Keyboard, Mouse, Printer, Server, Smartphone, Tablet,
  AudioLines, Mic, Headphones, Speaker, Lightbulb, Wifi, Router, Projector,
  Armchair, Sofa, Table, Camera, Phone, Archive
} from 'lucide-react'
import type { Asset } from '../../lib/api'
import SkeletonTable from '../../components/ui/SkeletonTable'

// ── Type icon map ─────────────────────────────────────────────────────────────

export const TYPE_ICONS: Record<string, React.ElementType> = {
  EQUIPO_COMPUTO: Monitor,
  MOBILIARIO:     LayoutGrid,
  EQUIPO_LAB:     FlaskConical,
  EQUIPO_MEDICO:  ShieldCheck,
  VEHICULO:       Truck,
  AUDIOVISUAL:    Tv2,
}

const STATUS_LABELS: Record<string, string> = {
  ACTIVO:           'Activo',
  EN_MANTENIMIENTO: 'En mantenimiento',
  EN_TRASLADO:      'En traslado',
  BAJA:             'Baja',
  DADO_DE_BAJA:     'Dado de baja',
}

function fmtCOP(v: string | null | undefined) {
  if (!v) return '—'
  const n = Number(v)
  if (isNaN(n) || n === 0) return '—'
  return new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP', maximumFractionDigits: 0,
    notation: 'compact', compactDisplay: 'short',
  }).format(n)
}

// ── Asset type icon (dark Navy bg + gold icon) ────────────────────────────────

export function getSmartIcon(name: string | null | undefined, typeCode: string | null): React.ElementType {
  if (!name) return (typeCode && TYPE_ICONS[typeCode]) || LayoutGrid;
  const n = name.toLowerCase();
  
  if (n.includes('all in one')) return Monitor;
  if (n.includes('computador') && !n.includes('port')) return PcCase;
  if (n.includes('portátil') || n.includes('laptop')) return Laptop;
  if (n.includes('monitor') || n.includes('pantalla')) return Monitor;
  if (n.includes('teclado')) return Keyboard;
  if (n.includes('mouse') || n.includes('ratón') || n.includes('raton')) return Mouse;
  if (n.includes('impresora')) return Printer;
  if (n.includes('servidor')) return Server;
  if (n.includes('celular') || n.includes('smartphone')) return Smartphone;
  if (n.includes('tablet')) return Tablet;
  
  if (n.includes('interfaz de audio')) return AudioLines;
  if (n.includes('micrófono') || n.includes('microfono')) return Mic;
  if (n.includes('audífono') || n.includes('audifono') || n.includes('diadema')) return Headphones;
  if (n.includes('parlante') || n.includes('altavoz') || n.includes('cabina')) return Speaker;
  if (n.includes('iluminación') || n.includes('luz')) return Lightbulb;
  if (n.includes('cámara') || n.includes('camara')) return Camera;
  if (n.includes('punto de acceso') || n.includes('access point') || n.includes('wifi') || n.includes('wi-fi')) return Wifi;
  if (n.includes('switch') || n.includes('enrutador') || n.includes('router')) return Router;
  if (n.includes('proyector') || n.includes('video beam')) return Projector;
  if (n.includes('tv') || n.includes('televisor') || n.includes('televisión')) return Tv2;
  if (n.includes('teléfono') || n.includes('telefono')) return Phone;
  
  if (n.includes('silla') || n.includes('asiento')) return Armchair;
  if (n.includes('sofa') || n.includes('sofá') || n.includes('poltrona')) return Sofa;
  if (n.includes('mesa') || n.includes('escritorio')) return Table;
  if (n.includes('mueble') || n.includes('archivador') || n.includes('estante') || n.includes('gabinete')) return Archive;
  
  return (typeCode && TYPE_ICONS[typeCode]) || LayoutGrid;
}

function AssetTypeIcon({ assetName, code, size = 36 }: { assetName?: string | null; code: string | null; size?: number }) {
  const IconComponent = getSmartIcon(assetName, code)
  const px = Math.max(16, Math.round(size * 0.55))
  return (
    <div style={{
      width: size, height: size, flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#E9C76E',
    }}>
      <IconComponent size={px} strokeWidth={1.7} />
    </div>
  )
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface Meta { total: number; page: number; limit: number; pages: number }

interface Props {
  data:         Asset[]
  meta:         Meta
  isLoading:    boolean
  searchQuery?: string
  viewingId?:   number | null
  onPageChange: (page: number) => void
  onView:       (id: number) => void
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function AssetsTable({ data, meta, isLoading, searchQuery, viewingId, onPageChange, onView }: Props) {
  const HEADERS = ['Placa', 'Activo', 'Tipo', 'Ubicación', 'Responsable', 'Valor', 'Estado', '']

  return (
    <div style={{
      background: 'var(--tbl-bg)',
      border: '1px solid var(--tbl-border)',
      borderRadius: 14,
      overflow: 'hidden',
      boxShadow: '0 1px 0 rgba(0,0,0,0.02), 0 4px 24px rgba(13,27,74,0.05)',
    }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>

          <thead>
            <tr style={{ background: 'var(--tbl-head-bg)', borderBottom: '1px solid var(--tbl-border)' }}>
              {HEADERS.map((h, i) => (
                <th key={i} style={{
                  textAlign: i === 5 ? 'right' : 'left',
                  padding: '11px 16px',
                  fontSize: 10, fontWeight: 600,
                  color: 'var(--tbl-text-sub)',
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  fontFamily: '"JetBrains Mono", monospace',
                  whiteSpace: 'nowrap',
                }}>{h}</th>
              ))}
            </tr>
          </thead>

          <tbody>
            {isLoading ? (
              <SkeletonTable cols={[80, 260, 100, 150, 150, 80, 72, 0]} rows={8} />
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={8} style={{
                  padding: '64px 16px', textAlign: 'center',
                  color: 'var(--tbl-text-sub)', fontSize: 13,
                }}>
                  {searchQuery
                    ? <><span style={{ color: 'var(--tbl-text)' }}>Sin resultados para </span><span style={{ fontFamily: '"JetBrains Mono", monospace' }}>"{searchQuery}"</span> — intenta con placa, nombre, serial o marca.</>
                    : 'No se encontraron activos con los filtros aplicados.'
                  }
                </td>
              </tr>
            ) : (
              data.map(asset => {
                const isSelected = asset.id === viewingId
                return (
                <tr
                  key={asset.id}
                  className={`row-fade${isSelected ? ' tbl-row-selected' : ''}`}
                  onClick={() => onView(asset.id)}
                  style={{ borderBottom: '1px solid var(--tbl-border)', cursor: 'pointer', transition: 'background 0.12s, box-shadow 0.12s' }}
                  onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'var(--tbl-row-hover)' }}
                  onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = '' }}
                >
                  {/* Placa */}
                  <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                    {asset.plate
                      ? <span className="plaqueta">{asset.plate}</span>
                      : <span style={{ color: 'var(--tbl-text-sub)', fontFamily: '"JetBrains Mono", monospace', fontSize: 11 }}>—</span>
                    }
                  </td>

                  {/* Activo — name + brand/model + type icon */}
                  <td style={{ padding: '12px 16px', maxWidth: 300 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <AssetTypeIcon assetName={asset.name} code={asset.assetTypeCode} size={36} />
                      <div style={{ minWidth: 0 }}>
                        <div style={{
                          color: 'var(--tbl-text)', fontWeight: 500, lineHeight: 1.3,
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          {asset.name}
                        </div>
                        {(asset.brand || asset.model) && (
                          <div style={{ fontSize: 11.5, color: 'var(--tbl-text-sub)', marginTop: 2 }}>
                            {[asset.brand, asset.model].filter(Boolean).join(' · ')}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Tipo */}
                  <td style={{ padding: '12px 16px', color: 'var(--tbl-text-sub)', fontSize: 12.5, whiteSpace: 'nowrap' }}>
                    {asset.assetTypeName ?? '—'}
                  </td>

                  {/* Ubicación */}
                  <td style={{ padding: '12px 16px', fontSize: 12.5 }}>
                    <div style={{ color: 'var(--tbl-text)', lineHeight: 1.3 }}>
                      {asset.buildingName?.split(' — ')[0] ?? '—'}
                    </div>
                    {(asset.floor || asset.location) && (
                      <div style={{ fontSize: 11, color: 'var(--tbl-text-sub)', marginTop: 2 }}>
                        {[asset.floor && `Piso ${asset.floor}`, asset.location].filter(Boolean).join(' · ')}
                      </div>
                    )}
                  </td>

                  {/* Responsable */}
                  <td style={{
                    padding: '12px 16px', fontSize: 12.5,
                    color: 'var(--tbl-text-sub)',
                    maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {asset.responsableRaw ?? '—'}
                  </td>

                  {/* Valor */}
                  <td style={{
                    padding: '12px 16px', textAlign: 'right',
                    fontFamily: '"JetBrains Mono", monospace',
                    fontSize: 12, color: 'var(--tbl-text)', whiteSpace: 'nowrap',
                  }}>
                    {fmtCOP(asset.referenceValue)}
                  </td>

                  {/* Estado */}
                  <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                    <span className={`s-pill s-pill-${asset.status}`}>
                      {STATUS_LABELS[asset.status] ?? asset.status}
                    </span>
                  </td>

                  {/* Arrow */}
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <ChevronRight size={14} style={{ color: 'var(--tbl-text-sub)', flexShrink: 0 }} />
                  </td>
                </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!isLoading && meta.pages > 1 && (
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '11px 16px',
          borderTop: '1px solid var(--tbl-border)',
          background: 'var(--tbl-foot-bg)',
          fontSize: 12, color: 'var(--tbl-text-sub)',
        }}>
          <span>
            Página {meta.page} de {meta.pages}
            {' · '}
            {meta.total.toLocaleString('es-CO')} registros
          </span>
          <div style={{ display: 'flex', gap: 4 }}>
            <button
              onClick={() => onPageChange(meta.page - 1)}
              disabled={meta.page <= 1}
              style={{
                width: 28, height: 28, borderRadius: 6,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'var(--tbl-bg)', border: '1px solid var(--tbl-border)',
                color: 'var(--tbl-text-sub)', cursor: meta.page <= 1 ? 'not-allowed' : 'pointer',
                opacity: meta.page <= 1 ? 0.4 : 1,
              }}
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={() => onPageChange(meta.page + 1)}
              disabled={meta.page >= meta.pages}
              style={{
                width: 28, height: 28, borderRadius: 6,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'var(--tbl-bg)', border: '1px solid var(--tbl-border)',
                color: 'var(--tbl-text-sub)', cursor: meta.page >= meta.pages ? 'not-allowed' : 'pointer',
                opacity: meta.page >= meta.pages ? 0.4 : 1,
              }}
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
