import express from 'express';
import {
  getAllProductCertificates,
  getProductCertificateById,
  createProductCertificate,
  updateProductCertificate,
  deleteProductCertificate,
  getProductCertificatesByProductId,
  getProductCertificatesByInspectorId,
  getExpiringSoon,
  approveProductCertificate,
  rejectProductCertificate,
  updateProductCertificateStatus,
  addProductCertificateRecommendations,
  getProductCertificateStatistics
} from './controller';
import { authMiddleware } from '../../../middlewares/authMiddleware';
import { authorizeRole } from '../../../middlewares/authRole';

const router = express.Router();

const auth = [authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse'])] as const;

// Специфические GET-маршруты ПЕРЕД /:id
router.get('/', ...auth, getAllProductCertificates);
router.get('/expiring', ...auth, getExpiringSoon);
router.get('/statistics', ...auth, getProductCertificateStatistics);
router.get('/product/:productId', ...auth, getProductCertificatesByProductId);
router.get('/inspector/:inspectorId', ...auth, getProductCertificatesByInspectorId);
router.get('/:id', ...auth, getProductCertificateById);

router.post('/', ...auth, createProductCertificate);
router.put('/:id', ...auth, updateProductCertificate);
router.delete('/:id', ...auth, deleteProductCertificate);
router.patch('/:id/approve', ...auth, approveProductCertificate);
router.patch('/:id/reject', ...auth, rejectProductCertificate);
router.patch('/:id/status', ...auth, updateProductCertificateStatus);
router.patch('/:id/recommendations', ...auth, addProductCertificateRecommendations);

export default router;
