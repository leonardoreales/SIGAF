import type { Request, Response, NextFunction } from 'express'
import jwt                                      from 'jsonwebtoken'
import { AppError }                             from '../../shared/errors'
import { notifySync, getLastSync }              from '../../application/sync/notifySyncUseCase'
import { sseManager }                           from '../../infrastructure/sse/SseManager'

// POST /sync/notify — llamado por n8n tras insertar activos (autenticado por secreto compartido)
export async function notify(req: Request, res: Response, next: NextFunction) {
  try {
    const secret = process.env.SYNC_SECRET
    if (!secret) return next(new AppError(500, 'SYNC_SECRET no configurado', 'CONFIG_ERROR'))

    if (req.headers['x-sync-secret'] !== secret) {
      return next(new AppError(401, 'Secreto de sincronización inválido', 'UNAUTHORIZED'))
    }

    const { source_sheet, insertados, fallidos, placas_generadas } = req.body

    if (!source_sheet || typeof source_sheet !== 'string') {
      return next(new AppError(400, 'source_sheet requerido', 'VALIDATION_ERROR'))
    }

    const event = await notifySync({
      source_sheet,
      insertados:       Number(insertados)              || 0,
      fallidos:         Number(fallidos)                || 0,
      placas_generadas: Array.isArray(placas_generadas) ? placas_generadas : [],
    })

    res.json({ ok: true, event_id: event.id, clients_notified: sseManager.connectedCount })
  } catch (err) { next(err) }
}

// GET /sync/events?token=<jwt> — stream SSE para el frontend (autenticado por JWT en query param)
export async function events(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.query.token as string | undefined
    if (!token) return next(new AppError(401, 'Token requerido', 'UNAUTHORIZED'))

    try {
      jwt.verify(token, process.env.JWT_SECRET!)
    } catch {
      return next(new AppError(401, 'Token inválido o expirado', 'UNAUTHORIZED'))
    }

    sseManager.connect(res)

    const last = await getLastSync()
    if (last) {
      res.write(`event: sync:last\ndata: ${JSON.stringify(last)}\n\n`)
    }

    res.write(`event: connected\ndata: ${JSON.stringify({ clients: sseManager.connectedCount })}\n\n`)
  } catch (err) { next(err) }
}
