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


router.get('/', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getAllProductCertificates);


router.get('/:id', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getProductCertificateById);


router.post('/', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), createProductCertificate);


router.put('/:id', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), updateProductCertificate);


router.delete('/:id', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), deleteProductCertificate);


router.get('/product/:productId', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getProductCertificatesByProductId);


router.get('/inspector/:inspectorId', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getProductCertificatesByInspectorId);


router.get('/expiring', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getExpiringSoon);


router.patch('/:id/approve', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), approveProductCertificate);


router.patch('/:id/reject', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), rejectProductCertificate);


router.patch('/:id/status', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), updateProductCertificateStatus);


router.patch('/:id/recommendations', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), addProductCertificateRecommendations);


router.get('/statistics', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getProductCertificateStatistics);

export default router;