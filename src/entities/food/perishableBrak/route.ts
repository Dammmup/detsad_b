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


router.get('/', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getAllPerishableBraks);


router.get('/:id', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getPerishableBrakById);


router.post('/', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), createPerishableBrak);


router.put('/:id', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), updatePerishableBrak);


router.delete('/:id', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), deletePerishableBrak);


router.get('/product/:productId', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getPerishableBraksByProductId);


router.get('/inspector/:inspectorId', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getPerishableBraksByInspectorId);


router.get('/expired', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getExpiredProducts);


router.patch('/:id/dispose', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), markPerishableBrakAsDisposed);


router.patch('/:id/status', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), updatePerishableBrakStatus);


router.patch('/:id/recommendations', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), addPerishableBrakRecommendations);


router.get('/statistics', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getPerishableBrakStatistics);

export default router;