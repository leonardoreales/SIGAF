import { Router }     from 'express'
import * as controller from './sync.controller'

const router = Router()

router.post('/notify', controller.notify)
router.get('/events',  controller.events)

export default router
