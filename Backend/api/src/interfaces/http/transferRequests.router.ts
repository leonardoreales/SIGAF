import { Router } from 'express'
import * as controller from './transferRequests.controller'

const router = Router()

// GET /stats debe ir antes de GET /:id para que 'stats' no se interprete como un id
router.get('/stats', controller.stats)
router.get('/',      controller.list)
router.get('/:id',   controller.getOne)
router.put('/:id',   controller.update)

export default router
