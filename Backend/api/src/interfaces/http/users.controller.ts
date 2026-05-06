import type { Request, Response, NextFunction } from 'express'
import { listUsers }  from '../../application/users/listUsers'
import { updateUser } from '../../application/users/updateUser'

export async function list(_req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await listUsers())
  } catch (err) { next(err) }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await updateUser(decodeURIComponent(req.params.email), req.body))
  } catch (err) { next(err) }
}
