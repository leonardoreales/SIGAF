import { pool } from './client'

export interface DistItem       { nombre: string; cantidad: number }
export interface AssetTotals {
  total:             number
  activos:           number
  bajas:             number
  valorBajas:        number
  enTraslado:        number
  revisionRequerida: number
  valorTotal:        number
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
  valor_bajas:        string
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
        COUNT(*)::int                                                                     AS total,
        COUNT(*) FILTER (WHERE status = 'ACTIVO')::int                                   AS activos,
        COUNT(*) FILTER (WHERE status IN ('BAJA', 'DADO_DE_BAJA'))::int                  AS bajas,
        COALESCE(SUM(reference_value) FILTER (WHERE status IN ('BAJA','DADO_DE_BAJA')), 0)::text
                                                                                         AS valor_bajas,
        COUNT(*) FILTER (WHERE status = 'EN_TRASLADO')::int                              AS en_traslado,
        COUNT(*) FILTER (
          WHERE status NOT IN ('BAJA','DADO_DE_BAJA')
            AND (plate IS NULL OR plate_status NOT IN ('OK','GENERADA'))
        )::int                                                                            AS revision_requerida,
        COALESCE(SUM(reference_value) FILTER (WHERE status NOT IN ('BAJA','DADO_DE_BAJA')), 0)::text
                                                                                         AS valor_total,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days')::int            AS nuevos_30d
      FROM assets
    `),
    pool.query<DistRow>(`
      SELECT COALESCE(cb.name, 'Sin edificio') AS nombre, COUNT(*)::int AS cantidad
      FROM assets a
      LEFT JOIN catalog_buildings cb ON a.building_id = cb.id
      WHERE a.status NOT IN ('BAJA', 'DADO_DE_BAJA')
      GROUP BY cb.name
      ORDER BY cantidad DESC
      LIMIT 6
    `),
    pool.query<DistRow>(`
      SELECT COALESCE(cat.name, 'Sin tipo') AS nombre, COUNT(*)::int AS cantidad
      FROM assets a
      LEFT JOIN catalog_asset_types cat ON a.asset_type_code = cat.code
      WHERE a.status NOT IN ('BAJA', 'DADO_DE_BAJA')
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
      valorBajas:        Number(t.valor_bajas),
      enTraslado:        Number(t.en_traslado),
      revisionRequerida: Number(t.revision_requerida),
      valorTotal:        Number(t.valor_total),
      nuevos30d:         Number(t.nuevos_30d),
    },
    porEdificio: edificiosRes.rows.map(r => ({ nombre: r.nombre, cantidad: Number(r.cantidad) })),
    porTipo:     tiposRes.rows.map(r =>     ({ nombre: r.nombre, cantidad: Number(r.cantidad) })),
  }
}

export async function getAdvancedStats(groupBy: string[], filters: any = {}): Promise<any[]> {
  const allowedGroupBy = {
    building:   "COALESCE(cb.name, 'Sin Edificio')",
    type:       "COALESCE(cat.name, 'Sin Tipo')",
    area:       "COALESCE(ca.name, 'Sin Área')",
    floor:      "COALESCE(a.floor, 'N/A')",
    location:   "COALESCE(a.location, 'Sin Ubicación')",
    status:     'a.status',
    criticality: 'a.criticality',
  }

  const columns = groupBy
    .filter(g => g in allowedGroupBy)
    .map(g => `${allowedGroupBy[g as keyof typeof allowedGroupBy]} as ${g}`)

  if (columns.length === 0) return []

  const groupByCols = groupBy
    .filter(g => g in allowedGroupBy)
    .map(g => allowedGroupBy[g as keyof typeof allowedGroupBy])

  let whereClause = "WHERE a.status NOT IN ('BAJA', 'DADO_DE_BAJA')"
  const params: any[] = []
  
  if (filters.buildingId) {
    params.push(filters.buildingId)
    whereClause += ` AND a.building_id = $${params.length}`
  }
  if (filters.buildingName) {
    params.push(filters.buildingName)
    whereClause += ` AND COALESCE(cb.name, 'Sin Edificio') = $${params.length}`
  }
  if (filters.areaName) {
    params.push(filters.areaName)
    whereClause += ` AND COALESCE(ca.name, 'Sin Área') = $${params.length}`
  }
  if (filters.floor) {
    params.push(filters.floor)
    whereClause += ` AND COALESCE(a.floor, 'N/A') = $${params.length}`
  }

  const query = `
    SELECT 
      ${columns.join(', ')},
      COUNT(*)::int as cantidad,
      SUM(COALESCE(a.reference_value, 0))::text as valor_total
    FROM assets a
    LEFT JOIN catalog_buildings cb ON a.building_id = cb.id
    LEFT JOIN catalog_asset_types cat ON a.asset_type_code = cat.code
    LEFT JOIN catalog_areas ca ON a.area_id = ca.id
    ${whereClause}
    GROUP BY ${groupByCols.join(', ')}
    ORDER BY cantidad DESC
  `

  const res = await pool.query(query, params)
  return res.rows.map(r => ({
    ...r,
    cantidad: Number(r.cantidad)
  }))
}
