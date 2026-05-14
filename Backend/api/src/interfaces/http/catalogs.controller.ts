import type { Request, Response, NextFunction } from 'express'
import {
  CreateBuildingSchema, UpdateBuildingSchema,
  CreateAssetTypeSchema, UpdateAssetTypeSchema,
  CreateAreaSchema, UpdateAreaSchema,
  CreatePersonSchema, UpdatePersonSchema,
} from '@sigaf/shared'
import { listBuildings }       from '../../application/catalogs/listBuildings'
import { listAssetTypes }      from '../../application/catalogs/listAssetTypes'
import { listAreas }           from '../../application/catalogs/listAreas'
import { listAreasByBuilding } from '../../application/catalogs/listAreasByBuilding'
import { listPeople }          from '../../application/catalogs/listPeople'
import { listAllBuildings }    from '../../application/catalogs/listAllBuildings'
import { createBuilding }      from '../../application/catalogs/createBuilding'
import { updateBuilding }      from '../../application/catalogs/updateBuilding'
import { deleteBuilding }      from '../../application/catalogs/deleteBuilding'
import { listAllAssetTypes }   from '../../application/catalogs/listAllAssetTypes'
import { createAssetType }     from '../../application/catalogs/createAssetType'
import { updateAssetType }     from '../../application/catalogs/updateAssetType'
import { deleteAssetType }     from '../../application/catalogs/deleteAssetType'
import { listAllAreas }        from '../../application/catalogs/listAllAreas'
import { createArea }          from '../../application/catalogs/createArea'
import { updateArea }          from '../../application/catalogs/updateArea'
import { deleteArea }          from '../../application/catalogs/deleteArea'
import { listAllPeople }       from '../../application/catalogs/listAllPeople'
import { createPerson }        from '../../application/catalogs/createPerson'
import { updatePerson }        from '../../application/catalogs/updatePerson'
import { deletePerson }        from '../../application/catalogs/deletePerson'

// ── Public read endpoints ─────────────────────────────────────────────────────

export async function buildings(_req: Request, res: Response, next: NextFunction) {
  try { res.json(await listBuildings()) } catch (err) { next(err) }
}

export async function assetTypes(_req: Request, res: Response, next: NextFunction) {
  try { res.json(await listAssetTypes()) } catch (err) { next(err) }
}

export async function areas(_req: Request, res: Response, next: NextFunction) {
  try { res.json(await listAreas()) } catch (err) { next(err) }
}

export async function areasByBuilding(req: Request, res: Response, next: NextFunction) {
  try {
    const buildingId = Number(req.params.buildingId)
    res.json(await listAreasByBuilding(buildingId))
  } catch (err) { next(err) }
}

export async function people(_req: Request, res: Response, next: NextFunction) {
  try { res.json(await listPeople()) } catch (err) { next(err) }
}

// ── Admin: Buildings ──────────────────────────────────────────────────────────

export async function adminBuildings(_req: Request, res: Response, next: NextFunction) {
  try { res.json(await listAllBuildings()) } catch (err) { next(err) }
}

export async function adminCreateBuilding(req: Request, res: Response, next: NextFunction) {
  try {
    const data = CreateBuildingSchema.parse(req.body)
    res.status(201).json(await createBuilding(data))
  } catch (err) { next(err) }
}

export async function adminUpdateBuilding(req: Request, res: Response, next: NextFunction) {
  try {
    const id   = Number(req.params.id)
    const data = UpdateBuildingSchema.parse(req.body)
    res.json(await updateBuilding(id, data))
  } catch (err) { next(err) }
}

export async function adminDeleteBuilding(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id)
    res.json(await deleteBuilding(id))
  } catch (err) { next(err) }
}

// ── Admin: Asset Types ────────────────────────────────────────────────────────

export async function adminAssetTypes(_req: Request, res: Response, next: NextFunction) {
  try { res.json(await listAllAssetTypes()) } catch (err) { next(err) }
}

export async function adminCreateAssetType(req: Request, res: Response, next: NextFunction) {
  try {
    const data = CreateAssetTypeSchema.parse(req.body)
    res.status(201).json(await createAssetType(data))
  } catch (err) { next(err) }
}

export async function adminUpdateAssetType(req: Request, res: Response, next: NextFunction) {
  try {
    const { code } = req.params
    const data     = UpdateAssetTypeSchema.parse(req.body)
    res.json(await updateAssetType(code, data))
  } catch (err) { next(err) }
}

export async function adminDeleteAssetType(req: Request, res: Response, next: NextFunction) {
  try {
    const { code } = req.params
    res.json(await deleteAssetType(code))
  } catch (err) { next(err) }
}

// ── Admin: Areas ──────────────────────────────────────────────────────────────

export async function adminAreas(_req: Request, res: Response, next: NextFunction) {
  try { res.json(await listAllAreas()) } catch (err) { next(err) }
}

export async function adminCreateArea(req: Request, res: Response, next: NextFunction) {
  try {
    const data = CreateAreaSchema.parse(req.body)
    res.status(201).json(await createArea(data))
  } catch (err) { next(err) }
}

export async function adminUpdateArea(req: Request, res: Response, next: NextFunction) {
  try {
    const id   = Number(req.params.id)
    const data = UpdateAreaSchema.parse(req.body)
    res.json(await updateArea(id, data))
  } catch (err) { next(err) }
}

export async function adminDeleteArea(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id)
    res.json(await deleteArea(id))
  } catch (err) { next(err) }
}

// ── Admin: People ─────────────────────────────────────────────────────────────

export async function adminPeople(_req: Request, res: Response, next: NextFunction) {
  try { res.json(await listAllPeople()) } catch (err) { next(err) }
}

export async function adminCreatePerson(req: Request, res: Response, next: NextFunction) {
  try {
    const data = CreatePersonSchema.parse(req.body)
    res.status(201).json(await createPerson(data))
  } catch (err) { next(err) }
}

export async function adminUpdatePerson(req: Request, res: Response, next: NextFunction) {
  try {
    const id   = Number(req.params.id)
    const data = UpdatePersonSchema.parse(req.body)
    res.json(await updatePerson(id, data))
  } catch (err) { next(err) }
}

export async function adminDeletePerson(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id)
    res.json(await deletePerson(id))
  } catch (err) { next(err) }
}