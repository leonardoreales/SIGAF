import type { Request, Response, NextFunction } from 'express'
import { listTransferRequests }    from '../../application/transferRequests/listTransferRequests'
import { getTransferRequest }      from '../../application/transferRequests/getTransferRequest'
import { updateTransferRequest }   from '../../application/transferRequests/updateTransferRequest'
import { getTransferRequestStats } from '../../application/transferRequests/getTransferRequestStats'

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await listTransferRequests(req.query))
  } catch (err) { next(err) }
}

export async function getOne(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await getTransferRequest(Number(req.params.id)))
  } catch (err) { next(err) }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await updateTransferRequest(Number(req.params.id), req.body))
  } catch (err) { next(err) }
}

export async function stats(_req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await getTransferRequestStats())
  } catch (err) { next(err) }
}
