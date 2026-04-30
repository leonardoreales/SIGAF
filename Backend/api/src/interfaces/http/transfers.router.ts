import { Router } from 'express'
import * as controller from './transfers.controller'

const router = Router()

router.get('/stats', controller.stats)   // debe ir antes de /:id
router.get('/',      controller.list)
router.get('/:id',   controller.getOne)
router.post('/',     controller.create)
router.put('/:id',   controller.update)

export default router
