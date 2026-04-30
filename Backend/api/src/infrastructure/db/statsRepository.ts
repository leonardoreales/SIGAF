import { pool } from './client'

export interface DistItem       { nombre: string; cantidad: number }
export interface AssetTotals {
  total:             number
  activos:           number
  bajas:             number
  enTraslado:        number
  revisionRequerida: number
  valorTotal:        string
  nuevos30d:         number
}
export interface AssetStatsResult {
  totales:     AssetTotals
  porEdificio: DistItem[]
  porTipo:     DistItem[]
}

interface TotalesRow {
  total:              string
  activos:            string
  bajas:              string
  en_traslado:        string
  revision_requerida: string
  valor_total:        string
  nuevos_30d:         string
}

interface DistRow {
  nombre:   string
  cantidad: string
}

export async function getAssetStats(): Promise<AssetStatsResult> {
  const [totalesRes, edificiosRes, tiposRes] = await Promise.all([
    pool.query<TotalesRow>(`
      SELECT
        COUNT(*)::int                                                               AS total,
        COUNT(*) FILTER (WHERE status = 'ACTIVO')::int                             AS activos,
        COUNT(*) FILTER (WHERE status = 'DADO_DE_BAJA')::int                       AS bajas,
        COUNT(*) FILTER (WHERE status = 'EN_TRASLADO')::int                        AS en_traslado,
        COUNT(*) FILTER (
          WHERE plate IS NULL
             OR plate_status NOT IN ('OK','GENERADA')
        )::int                                                                      AS revision_requerida,
        COALESCE(SUM(reference_value), 0)::text                                     AS valor_total,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days')::int      AS nuevos_30d
      FROM assets
    `),
    pool.query<DistRow>(`
      SELECT COALESCE(cb.name, 'Sin edificio') AS nombre, COUNT(*)::int AS cantidad
      FROM assets a
      LEFT JOIN catalog_buildings cb ON a.building_id = cb.id
      WHERE a.status != 'DADO_DE_BAJA'
      GROUP BY cb.name
      ORDER BY cantidad DESC
      LIMIT 6
    `),
    pool.query<DistRow>(`
      SELECT COALESCE(cat.name, 'Sin tipo') AS nombre, COUNT(*)::int AS cantidad
      FROM assets a
      LEFT JOIN catalog_asset_types cat ON a.asset_type_code = cat.code
      WHERE a.status != 'DADO_DE_BAJA'
      GROUP BY cat.name
      ORDER BY cantidad DESC
      LIMIT 8
    `),
  ])

  const t = totalesRes.rows[0]
  return {
    totales: {
      total:             Number(t.total),
      activos:           Number(t.activos),
      bajas:             Number(t.bajas),
      enTraslado:        Number(t.en_traslado),
      revisionRequerida: Number(t.revision_requerida),
      valorTotal:        t.valor_total,
      nuevos30d:         Number(t.nuevos_30d),
    },
    porEdificio: edificiosRes.rows.map(r => ({ nombre: r.nombre, cantidad: Number(r.cantidad) })),
    porTipo:     tiposRes.rows.map(r =>     ({ nombre: r.nombre, cantidad: Number(r.cantidad) })),
  }
}
