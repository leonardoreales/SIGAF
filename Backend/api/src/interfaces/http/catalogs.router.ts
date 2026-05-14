import { Router } from 'express'
import * as controller from './catalogs.controller'
import { requireRole } from '../../shared/middleware/requireRole'

const router = Router()

// ── Public read (authenticate already applied in index.ts) ────────────────────
router.get('/buildings',                     controller.buildings)
router.get('/asset-types',                   controller.assetTypes)
router.get('/areas/by-building/:buildingId', controller.areasByBuilding)
router.get('/areas',                         controller.areas)
router.get('/people',                        controller.people)

// ── Admin CRUD — ADMIN only ───────────────────────────────────────────────────
const admin = requireRole('ADMIN')

router.get   ('/admin/buildings',        admin, controller.adminBuildings)
router.post  ('/admin/buildings',        admin, controller.adminCreateBuilding)
router.put   ('/admin/buildings/:id',    admin, controller.adminUpdateBuilding)
router.delete('/admin/buildings/:id',    admin, controller.adminDeleteBuilding)

router.get   ('/admin/asset-types',      admin, controller.adminAssetTypes)
router.post  ('/admin/asset-types',      admin, controller.adminCreateAssetType)
router.put   ('/admin/asset-types/:code',admin, controller.adminUpdateAssetType)
router.delete('/admin/asset-types/:code',admin, controller.adminDeleteAssetType)

router.get   ('/admin/areas',            admin, controller.adminAreas)
router.post  ('/admin/areas',            admin, controller.adminCreateArea)
router.put   ('/admin/areas/:id',        admin, controller.adminUpdateArea)
router.delete('/admin/areas/:id',        admin, controller.adminDeleteArea)

router.get   ('/admin/people',           admin, controller.adminPeople)
router.post  ('/admin/people',           admin, controller.adminCreatePerson)
router.put   ('/admin/people/:id',       admin, controller.adminUpdatePerson)
router.delete('/admin/people/:id',       admin, controller.adminDeletePerson)

export default router