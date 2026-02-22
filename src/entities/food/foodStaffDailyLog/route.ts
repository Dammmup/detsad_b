import { Router } from 'express';
import { foodStaffDailyLogController } from './controller';
import { authMiddleware } from '../../../middlewares/authMiddleware';
import { authorizeRole } from '../../../middlewares/authRole';

const router = Router();

router.use(authMiddleware);

router.get('/', authorizeRole(['admin', 'manager', 'doctor', 'nurse']), (req, res, next) => foodStaffDailyLogController.getAll(req, res, next));
router.post('/', authorizeRole(['admin', 'manager', 'doctor', 'nurse']), (req, res, next) => foodStaffDailyLogController.create(req, res, next));
router.put('/:id', authorizeRole(['admin', 'manager', 'doctor', 'nurse']), (req, res, next) => foodStaffDailyLogController.update(req, res, next));
router.delete('/:id', authorizeRole(['admin', 'manager', 'doctor', 'nurse']), (req, res, next) => foodStaffDailyLogController.delete(req, res, next));

export default router;
