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
import { authMiddleware } from '../../middlewares/authMiddleware';
import { authorizeRole } from '../../middlewares/authRole';

const router = express.Router();

// Get all product certificates (with filters)
router.get('/', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getAllProductCertificates);

// Get product certificate by ID
router.get('/:id', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getProductCertificateById);

// Create new product certificate
router.post('/', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), createProductCertificate);

// Update product certificate
router.put('/:id', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), updateProductCertificate);

// Delete product certificate
router.delete('/:id', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), deleteProductCertificate);

// Get product certificates by product ID
router.get('/product/:productId', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getProductCertificatesByProductId);

// Get product certificates by inspector ID
router.get('/inspector/:inspectorId', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getProductCertificatesByInspectorId);

// Get expiring soon certificates
router.get('/expiring', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getExpiringSoon);

// Approve product certificate
router.patch('/:id/approve', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), approveProductCertificate);

// Reject product certificate
router.patch('/:id/reject', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), rejectProductCertificate);

// Update product certificate status
router.patch('/:id/status', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), updateProductCertificateStatus);

// Add recommendations to product certificate
router.patch('/:id/recommendations', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), addProductCertificateRecommendations);

// Get product certificate statistics
router.get('/statistics', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getProductCertificateStatistics);

export default router;