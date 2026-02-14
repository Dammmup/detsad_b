import express from 'express';
import {
  getAllChildHealthPassports,
  getChildHealthPassportById,
  createChildHealthPassport,
  updateChildHealthPassport,
  deleteChildHealthPassport,
  getChildHealthPassportsByChildId,
  updateChildHealthPassportStatus,
  addChildHealthPassportRecommendations,
  getChildHealthPassportStatistics,
  upsertChildHealthPassport
} from './controller';
import { authMiddleware } from '../../../middlewares/authMiddleware';
import { authorizeRole } from '../../../middlewares/authRole';

const router = express.Router();


router.get('/', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getAllChildHealthPassports);


router.get('/:id', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getChildHealthPassportById);


router.post('/', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), createChildHealthPassport);


router.put('/:id', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), updateChildHealthPassport);


router.delete('/:id', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), deleteChildHealthPassport);


router.post('/upsert', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), upsertChildHealthPassport);


router.get('/child/:childId', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getChildHealthPassportsByChildId);


router.patch('/:id/status', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), updateChildHealthPassportStatus);


router.patch('/:id/recommendations', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), addChildHealthPassportRecommendations);


router.get('/statistics', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getChildHealthPassportStatistics);

export default router;