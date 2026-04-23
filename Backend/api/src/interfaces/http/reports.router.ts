import { Router } from 'express'

const router = Router()

// TODO: exportación de reportes (Excel, PDF) para auditoría
router.all('*', (_req, res) => {
  res.status(501).json({ error: 'NOT_IMPLEMENTED', message: 'Módulo de reportes próximamente' })
})

export default router
