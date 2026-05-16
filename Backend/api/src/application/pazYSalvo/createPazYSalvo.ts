import axios from 'axios'
import crypto from 'crypto'
import { CreatePazYSalvoSchema } from '@sigaf/shared'
import * as repo from '../../infrastructure/db/pazYSalvoRepository'
import { pool } from '../../infrastructure/db/client'
import { AppError } from '../../shared/errors'
import { sseManager } from '../../infrastructure/sse/SseManager'

interface CreateRequester {
  id?:    number
  name?:  string
  email?: string
}

function buildHmac(body: string) {
  const secret = process.env.N8N_SIGN_HMAC_SECRET
  if (!secret) return undefined
  return `sha256=${crypto.createHmac('sha256', secret).update(body).digest('hex')}`
}

function buildCallbackUrl() {
  const baseUrl =
    process.env.SIGAF_API_URL ||
    process.env.BACKEND_PUBLIC_URL ||
    process.env.API_PUBLIC_URL ||
    process.env.PUBLIC_API_URL ||
    `http://localhost:${process.env.PORT || 3000}`

  return `${baseUrl.replace(/\/+$/, '')}/sync/paz-y-salvo/firma-completada`
}

/**
 * Flujo de un solo paso:
 * 1. Valida payload
 * 2. Verifica que no haya otro caso abierto para la misma persona
 * 3. Snapshot persona/área desde catalog_people
 * 4. Crea case + items en una transacción
 * 5. Dispatch webhook a n8n (asíncrono dentro del request)
 * 6. Marca n8n_dispatched o n8n_error según resultado
 * 7. Broadcast SSE
 */
export async function createPazYSalvo(rawData: unknown, requester?: CreateRequester) {
  const data = CreatePazYSalvoSchema.parse(rawData)

  // 1. Validar persona existe + obtener snapshot
  const { rows: people } = await pool.query<{
    id: number; full_name: string; identificacion: string | null;
    cargo: string | null; contract_end_date: Date | null;
    area_id: number | null; area_name: string | null;
  }>(
    `SELECT cp.id, cp.full_name, cp.identificacion, cp.cargo, cp.contract_end_date,
            ca.id AS area_id, ca.name AS area_name
       FROM catalog_people cp
       LEFT JOIN catalog_areas ca ON ca.id = cp.area_id
      WHERE cp.id = $1`,
    [data.personId],
  )
  if (!people[0]) {
    throw new AppError(404, `Funcionario ${data.personId} no encontrado en catalog_people`, 'NOT_FOUND')
  }
  if (!people[0].identificacion) {
    throw new AppError(
      400,
      'El funcionario no tiene identificación registrada. Ejecutar import_funcionarios.py para enriquecer el catálogo.',
      'PERSON_NOT_ENRICHED',
    )
  }
  const person = people[0]

  // 2. Validar no haya otro caso abierto
  const existing = await repo.findActiveCaseByPerson(data.personId)
  if (existing) {
    throw new AppError(
      409,
      `Ya existe un caso de paz y salvo abierto para esta persona: ${existing.actaNumber} (status: ${existing.status})`,
      'DUPLICATE_OPEN_CASE',
    )
  }

  // 3 + 4. Crear caso + items con snapshot
  const created = await repo.createWithItems({
    personId:          data.personId,
    motivoTerminacion: data.motivoTerminacion,
    observaciones:     data.observaciones,
    items:             data.items,
    contractEndDate:   person.contract_end_date
      ? new Date(person.contract_end_date).toISOString().slice(0, 10)
      : null,
    areaSnapshot:      person.area_name ?? null,
    initialStatus:     'FIRMA_SOLICITADA',
  }, requester?.id ?? null)

  // 5. Dispatch webhook a n8n. Cualquier fallo aquí queda registrado en n8n_error
  // y marca el caso como ERROR_FIRMA — el caso permanece en DB para retry manual.
  const webhookUrl = process.env.N8N_PAZ_Y_SALVO_WEBHOOK || process.env.N8N_SIGN_WEBHOOK
  if (!webhookUrl) {
    await repo.markN8nError(created.id, 'N8N_PAZ_Y_SALVO_WEBHOOK no configurado')
    throw new AppError(500, 'Webhook de n8n no configurado para paz y salvo', 'CONFIG_ERROR')
  }

  const eventId = `evt_${created.actaNumber}_SIGN_REQUESTED`
  const payload = {
    eventType:     'PAZ_Y_SALVO_SIGN_REQUESTED',
    eventId,
    sigafCaseId:   String(created.id),
    actaNumber:    created.actaNumber,
    fechaActa:     new Date().toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' }),
    motivo:        created.motivoTerminacion,

    funcionarioEntrega: {
      fullName:       person.full_name,
      identificacion: person.identificacion,
      cargo:          person.cargo ?? '',
      area:           person.area_name ?? '',
      contractEndDate: created.contractEndDate ?? null,
    },

    funcionarioRecibe: {
      fullName: requester?.name  ?? 'RESPONSABLE ACTIVOS FIJOS',
      email:    requester?.email ?? '',
    },

    observaciones: created.observaciones ?? '',

    items: (created.items as Array<{
      itemNumber: number; nameRaw: string | null; plateRaw: string | null;
      estadoFisico: string; notes: string | null;
    }>).map((it) => ({
      itemNumber:   it.itemNumber,
      name:         it.nameRaw ?? '',
      plate:        it.plateRaw ?? '',
      estadoFisico: it.estadoFisico,
      notes:        it.notes ?? '',
    })),

    signature: {
      signatureImageFileId: process.env.SIGAF_SIGNATURE_IMAGE_FILE_ID ?? '',
      signatureAnchor:      'FIRMA RESPONSABLE ACTIVOS FIJOS',
    },

    callback: {
      url:    buildCallbackUrl(),
      secret: process.env.N8N_SIGN_RESULT_SECRET || process.env.SYNC_SECRET || '',
    },
  }

  const body = JSON.stringify(payload)

  try {
    await axios.post(webhookUrl, payload, {
      headers: {
        'Content-Type':                  'application/json',
        'x-sigaf-sign-request-secret':   process.env.N8N_SIGN_REQUEST_SECRET || process.env.SYNC_SECRET || '',
        ...(buildHmac(body) ? { 'x-sigaf-signature': buildHmac(body) } : {}),
      },
      timeout: 30_000,
    })
    await repo.markN8nDispatched(created.id, eventId)
  } catch (err) {
    const message = (err as Error)?.message ?? 'unknown'
    await repo.markN8nError(created.id, `Webhook n8n falló: ${message}`)
    sseManager.broadcast('paz_y_salvo:updated', {
      id:          created.id,
      actaNumber:  created.actaNumber,
      status:      'ERROR_FIRMA',
      message:     'Falló dispatch a n8n',
    })
    throw new AppError(502, 'Error al conectar con el motor de firmas (n8n). El caso quedó en ERROR_FIRMA para retry manual.', 'EXTERNAL_ERROR')
  }

  // 7. Broadcast SSE para refrescar la lista en el frontend
  sseManager.broadcast('paz_y_salvo:created', {
    id:           created.id,
    actaNumber:   created.actaNumber,
    personName:   person.full_name,
    status:       'FIRMA_SOLICITADA',
    message:      'Acta generada y enviada al motor de firmas',
  })

  return repo.findById(created.id)
}
