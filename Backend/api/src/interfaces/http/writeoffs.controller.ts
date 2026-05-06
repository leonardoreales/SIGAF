import type { Request, Response, NextFunction } from 'express'
import { listWriteoffs }    from '../../application/writeoffs/listWriteoffs'
import { getWriteoff }      from '../../application/writeoffs/getWriteoff'
import { getWriteoffStats } from '../../application/writeoffs/getWriteoffStats'
import { createWriteoff }   from '../../application/writeoffs/createWriteoff'
import { updateWriteoff }   from '../../application/writeoffs/updateWriteoff'

export async function list(req: Request, res: Response, next: NextFunction) {
  try { res.json(await listWriteoffs(req.query)) } catch (e) { next(e) }
}

export async function getOne(req: Request, res: Response, next: NextFunction) {
  try { res.json(await getWriteoff(Number(req.params.id))) } catch (e) { next(e) }
}

export async function stats(_req: Request, res: Response, next: NextFunction) {
  try { res.json(await getWriteoffStats()) } catch (e) { next(e) }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try { res.status(201).json(await createWriteoff(req.body)) } catch (e) { next(e) }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try { res.json(await updateWriteoff(Number(req.params.id), req.body)) } catch (e) { next(e) }
}
