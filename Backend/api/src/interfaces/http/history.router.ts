import { Router } from 'express'

const router = Router()

// TODO: historial de eventos por activo (traslados, bajas, modificaciones)
router.all('*', (_req, res) => {
  res.status(501).json({ error: 'NOT_IMPLEMENTED', message: 'Módulo de historial próximamente' })
})

export default router
