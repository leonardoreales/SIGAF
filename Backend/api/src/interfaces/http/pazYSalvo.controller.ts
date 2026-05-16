import type { Request, Response, NextFunction } from 'express'
import { listPazYSalvo }       from '../../application/pazYSalvo/listPazYSalvo'
import { listPazYSalvoPeople } from '../../application/pazYSalvo/listPazYSalvoPeople'
import { getPazYSalvo }        from '../../application/pazYSalvo/getPazYSalvo'
import { getPazYSalvoStats }   from '../../application/pazYSalvo/getPazYSalvoStats'
import { createPazYSalvo }     from '../../application/pazYSalvo/createPazYSalvo'
import { updatePazYSalvo }     from '../../application/pazYSalvo/updatePazYSalvo'
import { cancelPazYSalvo }     from '../../application/pazYSalvo/cancelPazYSalvo'

export async function list(req: Request, res: Response, next: NextFunction) {
  try { res.json(await listPazYSalvo(req.query)) } catch (e) { next(e) }
}

export async function listPeople(req: Request, res: Response, next: NextFunction) {
  try { res.json(await listPazYSalvoPeople(req.query)) } catch (e) { next(e) }
}

export async function getOne(req: Request, res: Response, next: NextFunction) {
  try { res.json(await getPazYSalvo(Number(req.params.id))) } catch (e) { next(e) }
}

export async function stats(_req: Request, res: Response, next: NextFunction) {
  try { res.json(await getPazYSalvoStats()) } catch (e) { next(e) }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const user = res.locals.user as { name?: string; email?: string } | undefined
    res.status(201).json(await createPazYSalvo(req.body, {
      name:  user?.name,
      email: user?.email,
    }))
  } catch (e) { next(e) }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try { res.json(await updatePazYSalvo(Number(req.params.id), req.body)) } catch (e) { next(e) }
}

export async function cancel(req: Request, res: Response, next: NextFunction) {
  try {
    const reason = typeof req.body?.reason === 'string' ? req.body.reason : undefined
    res.json(await cancelPazYSalvo(Number(req.params.id), reason))
  } catch (e) { next(e) }
}
