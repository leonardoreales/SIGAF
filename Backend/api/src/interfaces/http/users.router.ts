import { Router } from 'express'
import { requireRole } from '../../shared/middleware/requireRole'
import * as controller from './users.controller'

const router = Router()

router.get('/',             requireRole('ADMIN'), controller.list)
router.put('/:email',       requireRole('ADMIN'), controller.update)

export default router
