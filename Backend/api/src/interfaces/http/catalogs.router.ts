import { Router } from 'express'
import * as controller from './catalogs.controller'

const router = Router()

router.get('/buildings',   controller.buildings)
router.get('/asset-types', controller.assetTypes)
router.get('/areas',       controller.areas)
router.get('/people',      controller.people)

export default router
