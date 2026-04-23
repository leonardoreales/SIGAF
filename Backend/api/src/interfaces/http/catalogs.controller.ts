import type { Request, Response, NextFunction } from 'express'
import { listBuildings }  from '../../application/catalogs/listBuildings'
import { listAssetTypes } from '../../application/catalogs/listAssetTypes'
import { listAreas }      from '../../application/catalogs/listAreas'
import { listPeople }     from '../../application/catalogs/listPeople'

export async function buildings(_req: Request, res: Response, next: NextFunction) {
  try { res.json(await listBuildings()) } catch (err) { next(err) }
}

export async function assetTypes(_req: Request, res: Response, next: NextFunction) {
  try { res.json(await listAssetTypes()) } catch (err) { next(err) }
}

export async function areas(_req: Request, res: Response, next: NextFunction) {
  try { res.json(await listAreas()) } catch (err) { next(err) }
}

export async function people(_req: Request, res: Response, next: NextFunction) {
  try { res.json(await listPeople()) } catch (err) { next(err) }
}
