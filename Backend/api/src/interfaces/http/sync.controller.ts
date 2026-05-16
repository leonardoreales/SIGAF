import type { Request, Response, NextFunction } from 'express'
import jwt                                      from 'jsonwebtoken'
import { AppError }                             from '../../shared/errors'
import { notifySync, getLastSync, listSyncs }              from '../../application/sync/notifySyncUseCase'
import { sseManager }                           from '../../infrastructure/sse/SseManager'
import { createTransferRequest }               from '../../application/transferRequests/createTransferRequest'
import { completeTransferRequestSignature }     from '../../application/transferRequests/completeTransferRequestSignature'
import { completePazYSalvoSignature }           from '../../application/pazYSalvo/completePazYSalvoSignature'
import * as transferRequestRepo                 from '../../infrastructure/db/transferRequestRepository'
import { insertSignatureInDoc }                 from '../../infrastructure/google/docsSignatureService'

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

// POST /sync/transfer-request — n8n envía una solicitud de traslado parseada del DOCX
export async function ingestTransferRequest(req: Request, res: Response, next: NextFunction) {
  try {
    const secret = process.env.SYNC_SECRET
    if (!secret) return next(new AppError(500, 'SYNC_SECRET no configurado', 'CONFIG_ERROR'))

    if (req.headers['x-sync-secret'] !== secret) {
      return next(new AppError(401, 'Secreto de sincronización inválido', 'UNAUTHORIZED'))
    }

    const request = await createTransferRequest(req.body)
    res.status(201).json({ ok: true, request })
  } catch (err) { next(err) }
}

// POST /sync/transfer-request/sign-result — n8n informa resultado del Flujo 2
export async function transferRequestSignResult(req: Request, res: Response, next: NextFunction) {
  try {
    const secret = process.env.N8N_SIGN_RESULT_SECRET || process.env.SYNC_SECRET
    if (!secret) return next(new AppError(500, 'N8N_SIGN_RESULT_SECRET/SYNC_SECRET no configurado', 'CONFIG_ERROR'))

    if (req.headers['x-sigaf-sign-result-secret'] !== secret) {
      return next(new AppError(401, 'Secreto de resultado de firma inválido', 'UNAUTHORIZED'))
    }

    const result = await completeTransferRequestSignature(req.body)
    res.json(result)
  } catch (err) { next(err) }
}

// POST /sync/paz-y-salvo/firma-completada — n8n informa resultado de firma del acta de devolución
export async function pazYSalvoFirmaCompletada(req: Request, res: Response, next: NextFunction) {
  try {
    const secret = process.env.N8N_SIGN_RESULT_SECRET || process.env.SYNC_SECRET
    if (!secret) return next(new AppError(500, 'N8N_SIGN_RESULT_SECRET/SYNC_SECRET no configurado', 'CONFIG_ERROR'))

    if (req.headers['x-sigaf-sign-result-secret'] !== secret) {
      return next(new AppError(401, 'Secreto de resultado de firma inválido', 'UNAUTHORIZED'))
    }

    const result = await completePazYSalvoSignature(req.body)
    res.json(result)
  } catch (err) { next(err) }
}

// GET /sync/transfer-request/:requestNumber — n8n consulta una solicitud sin JWT
export async function getTransferRequestForSync(req: Request, res: Response, next: NextFunction) {
  try {
    const secret = process.env.N8N_SIGN_RESULT_SECRET || process.env.N8N_SIGN_REQUEST_SECRET || process.env.SYNC_SECRET
    if (!secret) return next(new AppError(500, 'Secreto de firma no configurado', 'CONFIG_ERROR'))

    const received = req.headers['x-sigaf-sign-result-secret'] || req.headers['x-sigaf-sign-request-secret']
    if (received !== secret) {
      return next(new AppError(401, 'Secreto de firma inválido', 'UNAUTHORIZED'))
    }

    res.json(await transferRequestRepo.findByRequestNumber(req.params.requestNumber))
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

// POST /sync/sign-document — n8n llama aquí para insertar firma institucional en Google Doc (reemplaza Apps Script)
export async function signDocument(req: Request, res: Response, next: NextFunction) {
  try {
    const secret = process.env.SIGN_DOCUMENT_SECRET
    if (!secret) return next(new AppError(500, 'SIGN_DOCUMENT_SECRET no configurado', 'CONFIG_ERROR'))

    const received = (req.headers['x-sigaf-sign-result-secret'] as string | undefined) ?? req.body?.secret
    if (received !== secret) {
      return next(new AppError(401, 'Secreto de firma de documento inválido', 'UNAUTHORIZED'))
    }

    const { googleDocId, signatureImageFileId, anchorText, eventId, sigafRequestId } = req.body

    if (!googleDocId) return next(new AppError(400, 'googleDocId requerido', 'VALIDATION_ERROR'))
    if (!signatureImageFileId) return next(new AppError(400, 'signatureImageFileId requerido', 'VALIDATION_ERROR'))

    const result = await insertSignatureInDoc({
      googleDocId,
      signatureImageFileId,
      anchorText: anchorText || 'FIRMA DEL RESPONSABLE ACTIVOS FIJOS',
      eventId: eventId || '',
      sigafRequestId: sigafRequestId || '',
    })

    res.json({ ...result, status: 'SIGNED' })
  } catch (err) { next(err) }
}

// GET /sync — lista el historial de sincronizaciones
export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const events = await listSyncs()
    res.json(events)
  } catch (err) { next(err) }
}
