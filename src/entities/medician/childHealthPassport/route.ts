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
  getChildHealthPassportStatistics
} from './controller';
import { authMiddleware } from '../../../middlewares/authMiddleware';
import { authorizeRole } from '../../../middlewares/authRole';

const router = express.Router();

// Get all child health passports (with filters)
router.get('/', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getAllChildHealthPassports);

// Get child health passport by ID
router.get('/:id', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getChildHealthPassportById);

// Create new child health passport
router.post('/', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), createChildHealthPassport);

// Update child health passport
router.put('/:id', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), updateChildHealthPassport);

// Delete child health passport
router.delete('/:id', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), deleteChildHealthPassport);

// Get child health passports by child ID
router.get('/child/:childId', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getChildHealthPassportsByChildId);

// Update child health passport status
router.patch('/:id/status', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), updateChildHealthPassportStatus);

// Add recommendations to child health passport
router.patch('/:id/recommendations', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), addChildHealthPassportRecommendations);

// Get child health passport statistics
router.get('/statistics', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getChildHealthPassportStatistics);

export default router;