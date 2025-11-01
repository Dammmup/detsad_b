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

// Get all risk group children (with filters)
router.get('/', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getAllRiskGroupChildren);

// Get risk group child by ID
router.get('/:id', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getRiskGroupChildById);

// Create new risk group child
router.post('/', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), createRiskGroupChild);

// Update risk group child
router.put('/:id', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), updateRiskGroupChild);

// Delete risk group child
router.delete('/:id', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), deleteRiskGroupChild);

// Get risk group children by child ID
router.get('/child/:childId', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getRiskGroupChildrenByChildId);

// Get risk group children by doctor ID
router.get('/doctor/:doctorId', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getRiskGroupChildrenByDoctorId);

// Get upcoming assessments
router.get('/assessments', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getUpcomingAssessments);

// Update risk group child status
router.patch('/:id/status', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), updateRiskGroupChildStatus);

// Add recommendations to risk group child
router.patch('/:id/recommendations', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), addRiskGroupChildRecommendations);

// Get risk group child statistics
router.get('/statistics', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getRiskGroupChildStatistics);

export default router;