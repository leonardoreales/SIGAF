import { google } from 'googleapis'
import type { docs_v1 } from 'googleapis'
import { AppError } from '../../shared/errors'

function buildAuth() {
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_OAUTH2_CLIENT_ID,
    process.env.GOOGLE_OAUTH2_CLIENT_SECRET,
  )
  auth.setCredentials({ refresh_token: process.env.GOOGLE_OAUTH2_REFRESH_TOKEN })
  return auth
}

export interface SignatureParams {
  googleDocId: string
  signatureImageFileId: string
  anchorText: string
  eventId: string
  sigafRequestId: string
}

export interface SignatureResult {
  ok: boolean
  signedGoogleDocId: string
  signedGoogleDocUrl: string
  anchorFound: string
  durationMs: number
}

function findAnchorCell(
  content: docs_v1.Schema$StructuralElement[],
  anchorText: string,
): { rowIndex: number; colIndex: number; table: docs_v1.Schema$Table; tableStartIndex: number } | null {
  const upper = anchorText.toUpperCase()
  for (const element of content) {
    if (!element.table) continue
    const rows = element.table.tableRows ?? []
    for (let r = 0; r < rows.length; r++) {
      const cells = rows[r].tableCells ?? []
      for (let c = 0; c < cells.length; c++) {
        const cellText = (cells[c].content ?? [])
          .flatMap((e) => e.paragraph?.elements ?? [])
          .map((e) => e.textRun?.content ?? '')
          .join('')
        if (cellText.toUpperCase().includes(upper)) {
          return { rowIndex: r, colIndex: c, table: element.table, tableStartIndex: element.startIndex! }
        }
      }
    }
  }
  return null
}

export async function insertSignatureInDoc(params: SignatureParams): Promise<SignatureResult> {
  const t0 = Date.now()
  const { googleDocId, signatureImageFileId, anchorText } = params

  if (!process.env.GOOGLE_OAUTH2_REFRESH_TOKEN) {
    throw new AppError(500, 'GOOGLE_OAUTH2_REFRESH_TOKEN no configurado', 'CONFIG_ERROR')
  }

  const auth = buildAuth()
  const docs = google.docs({ version: 'v1', auth })
  const drive = google.drive({ version: 'v3', auth })

  // Ensure the signature image is publicly readable so the Docs API can fetch it by URI.
  // The Docs API insertInlineImage downloads the URI server-side (no auth headers).
  try {
    await drive.permissions.create({
      fileId: signatureImageFileId,
      requestBody: { role: 'reader', type: 'anyone' },
    })
  } catch {
    // Permission may already exist — proceed; insertInlineImage will fail with clear error if not accessible
  }

  const doc = await docs.documents.get({ documentId: googleDocId })
  const content = doc.data.body?.content ?? []

  const anchor = findAnchorCell(content, anchorText)
  if (!anchor) {
    throw new AppError(
      422,
      `Ancla "${anchorText}" no encontrada en el documento ${googleDocId}`,
      'ANCHOR_NOT_FOUND',
    )
  }

  const { rowIndex, colIndex, table, tableStartIndex } = anchor
  if (rowIndex === 0) {
    throw new AppError(
      422,
      `Ancla "${anchorText}" está en la primera fila — no hay celda superior para insertar la firma`,
      'ANCHOR_FIRST_ROW',
    )
  }

  const targetCell = (table.tableRows ?? [])[rowIndex - 1].tableCells?.[colIndex]
  if (targetCell?.startIndex == null) {
    throw new AppError(
      422,
      `No se pudo determinar la posición de la celda de firma en ${googleDocId}`,
      'CELL_INDEX_ERROR',
    )
  }

  const imageUri = `https://drive.google.com/uc?id=${signatureImageFileId}&export=download`

  const cellContent = targetCell.content ?? []
  const hasContent = cellContent.some((se) =>
    (se.paragraph?.elements ?? []).some(
      (e) =>
        (e.textRun?.content ?? '').replace(/\n/g, '').length > 0 ||
        e.inlineObjectElement != null,
    ),
  )

  const requests: docs_v1.Schema$Request[] = []

  if (hasContent) {
    requests.push({
      deleteContentRange: {
        range: {
          startIndex: targetCell.startIndex! + 1,
          endIndex: targetCell.endIndex! - 1,
        },
      },
    })
  }

  requests.push({
    insertInlineImage: {
      location: { index: targetCell.startIndex! + 1 },
      uri: imageUri,
      objectSize: {
        height: { magnitude: 90, unit: 'PT' },
        width: { magnitude: 160, unit: 'PT' },
      },
    },
  })

  requests.push({
    updateParagraphStyle: {
      range: {
        startIndex: targetCell.startIndex! + 1,
        endIndex: targetCell.startIndex! + 2,
      },
      paragraphStyle: {
        alignment: 'CENTER',
        spaceAbove: { magnitude: 0, unit: 'PT' },
        spaceBelow: { magnitude: 0, unit: 'PT' },
      },
      fields: 'alignment,spaceAbove,spaceBelow',
    },
  })

  requests.push({
    updateTableCellStyle: {
      tableRange: {
        tableCellLocation: {
          tableStartLocation: { index: tableStartIndex },
          rowIndex: rowIndex - 1,
          columnIndex: colIndex,
        },
        rowSpan: 1,
        columnSpan: 1,
      },
      tableCellStyle: { contentAlignment: 'BOTTOM' },
      fields: 'contentAlignment',
    },
  })

  await docs.documents.batchUpdate({
    documentId: googleDocId,
    requestBody: { requests },
  })

  return {
    ok: true,
    signedGoogleDocId: googleDocId,
    signedGoogleDocUrl: `https://docs.google.com/document/d/${googleDocId}/edit`,
    anchorFound: anchorText,
    durationMs: Date.now() - t0,
  }
}
