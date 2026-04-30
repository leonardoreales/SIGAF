import type { Request, Response, NextFunction } from 'express'
import { listAssets }  from '../../application/assets/listAssets'
import { getAsset }    from '../../application/assets/getAsset'
import { createAsset } from '../../application/assets/createAsset'
import { updateAsset } from '../../application/assets/updateAsset'
import { deleteAsset } from '../../application/assets/deleteAsset'
import { getStats }    from '../../application/assets/getStats'

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await listAssets(req.query))
  } catch (err) { next(err) }
}

export async function getOne(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await getAsset(Number(req.params.id)))
  } catch (err) { next(err) }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    res.status(201).json(await createAsset(req.body))
  } catch (err) { next(err) }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await updateAsset(Number(req.params.id), req.body))
  } catch (err) { next(err) }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    await deleteAsset(Number(req.params.id))
    res.status(204).send()
  } catch (err) { next(err) }
}

export async function stats(_req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await getStats())
  } catch (err) { next(err) }
}
