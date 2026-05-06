import type { Request, Response, NextFunction } from 'express'
import { listTransfers }     from '../../application/transfers/listTransfers'
import { getTransfer }       from '../../application/transfers/getTransfer'
import { createTransfer }    from '../../application/transfers/createTransfer'
import { updateTransfer }    from '../../application/transfers/updateTransfer'
import { getTransferStats }  from '../../application/transfers/getTransferStats'

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await listTransfers(req.query))
  } catch (err) { next(err) }
}

export async function getOne(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await getTransfer(Number(req.params.id)))
  } catch (err) { next(err) }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    res.status(201).json(await createTransfer(req.body))
  } catch (err) { next(err) }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await updateTransfer(Number(req.params.id), req.body))
  } catch (err) { next(err) }
}

export async function stats(_req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await getTransferStats())
  } catch (err) { next(err) }
}
