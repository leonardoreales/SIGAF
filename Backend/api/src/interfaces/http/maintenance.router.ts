import { Router } from 'express';
import * as controller from './maintenance.controller';
import multer from 'multer';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get('/',       controller.getSchedules);
router.get('/stats',  controller.getStats);
router.post('/',      controller.createSchedule);
router.post('/:id/execute', controller.executeMaintenance);
router.post('/import', upload.single('file'), controller.importExcel);

export default router;
