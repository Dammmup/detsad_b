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

const auth = [authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse'])] as const;

// Специфические GET-маршруты ПЕРЕД /:id
router.get('/', ...auth, getAllPerishableBraks);
router.get('/expired', ...auth, getExpiredProducts);
router.get('/statistics', ...auth, getPerishableBrakStatistics);
router.get('/product/:productId', ...auth, getPerishableBraksByProductId);
router.get('/inspector/:inspectorId', ...auth, getPerishableBraksByInspectorId);
router.get('/:id', ...auth, getPerishableBrakById);

router.post('/', ...auth, createPerishableBrak);
router.put('/:id', ...auth, updatePerishableBrak);
router.delete('/:id', ...auth, deletePerishableBrak);
router.patch('/:id/dispose', ...auth, markPerishableBrakAsDisposed);
router.patch('/:id/status', ...auth, updatePerishableBrakStatus);
router.patch('/:id/recommendations', ...auth, addPerishableBrakRecommendations);

export default router;
