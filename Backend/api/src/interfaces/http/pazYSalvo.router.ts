import { Router } from 'express'
import * as controller from './pazYSalvo.controller'

const router = Router()

router.get('/stats',       controller.stats)
router.get('/people',      controller.listPeople)
router.get('/',            controller.list)
router.get('/:id',         controller.getOne)
router.post('/',           controller.create)
router.put('/:id',         controller.update)
router.post('/:id/cancel', controller.cancel)

export default router
