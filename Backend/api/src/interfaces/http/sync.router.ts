import { Router }     from 'express'
import * as controller from './sync.controller'
import { authenticate } from '../../shared/middleware/authenticate'

const router = Router()

router.post('/notify',            controller.notify)
router.post('/transfer-request',  controller.ingestTransferRequest)
router.get('/events',             controller.events)
router.get('/',                   authenticate, controller.list)

export default router
