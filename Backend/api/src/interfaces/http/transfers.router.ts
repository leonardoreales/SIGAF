import { Router } from 'express'

const router = Router()

// TODO: módulo de traslados entre ubicaciones y responsables
router.all('*', (_req, res) => {
  res.status(501).json({ error: 'NOT_IMPLEMENTED', message: 'Módulo de traslados próximamente' })
})

export default router
