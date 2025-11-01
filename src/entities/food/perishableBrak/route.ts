import express from 'express';
import { 
  getAllPerishableBraks,
  getPerishableBrakById,
  createPerishableBrak,
  updatePerishableBrak,
  deletePerishableBrak,
  getPerishableBraksByProductId,
  getPerishableBraksByInspectorId,
  getExpiredProducts,
  markPerishableBrakAsDisposed,
  updatePerishableBrakStatus,
  addPerishableBrakRecommendations,
  getPerishableBrakStatistics
} from './controller';
import { authMiddleware } from '../../../middlewares/authMiddleware';
import { authorizeRole } from '../../../middlewares/authRole';

const router = express.Router();

// Get all perishable braks (with filters)
router.get('/', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getAllPerishableBraks);

// Get perishable brak by ID
router.get('/:id', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getPerishableBrakById);

// Create new perishable brak
router.post('/', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), createPerishableBrak);

// Update perishable brak
router.put('/:id', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), updatePerishableBrak);

// Delete perishable brak
router.delete('/:id', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), deletePerishableBrak);

// Get perishable braks by product ID
router.get('/product/:productId', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getPerishableBraksByProductId);

// Get perishable braks by inspector ID
router.get('/inspector/:inspectorId', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getPerishableBraksByInspectorId);

// Get expired products
router.get('/expired', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getExpiredProducts);

// Mark perishable brak as disposed
router.patch('/:id/dispose', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), markPerishableBrakAsDisposed);

// Update perishable brak status
router.patch('/:id/status', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), updatePerishableBrakStatus);

// Add recommendations to perishable brak
router.patch('/:id/recommendations', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), addPerishableBrakRecommendations);

// Get perishable brak statistics
router.get('/statistics', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getPerishableBrakStatistics);

export default router;