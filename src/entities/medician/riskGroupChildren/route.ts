import express from 'express';
import {
  getAllRiskGroupChildren,
  getRiskGroupChildById,
  createRiskGroupChild,
  updateRiskGroupChild,
  deleteRiskGroupChild,
  getRiskGroupChildrenByChildId,
  getRiskGroupChildrenByDoctorId,
  getUpcomingAssessments,
  updateRiskGroupChildStatus,
  addRiskGroupChildRecommendations,
  getRiskGroupChildStatistics
} from './controller';
import { authMiddleware } from '../../../middlewares/authMiddleware';
import { authorizeRole } from '../../../middlewares/authRole';

const router = express.Router();


router.get('/', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getAllRiskGroupChildren);


router.get('/:id', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getRiskGroupChildById);


router.post('/', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), createRiskGroupChild);


router.put('/:id', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), updateRiskGroupChild);


router.delete('/:id', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), deleteRiskGroupChild);


router.get('/child/:childId', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getRiskGroupChildrenByChildId);


router.get('/doctor/:doctorId', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getRiskGroupChildrenByDoctorId);


router.get('/assessments', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getUpcomingAssessments);


router.patch('/:id/status', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), updateRiskGroupChildStatus);


router.patch('/:id/recommendations', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), addRiskGroupChildRecommendations);


router.get('/statistics', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getRiskGroupChildStatistics);

export default router;