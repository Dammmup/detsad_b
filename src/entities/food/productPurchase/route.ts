import { Router } from 'express';
import { productPurchaseController } from './controller';
import { authMiddleware } from '../../../middlewares/authMiddleware';

const router = Router();

router.use(authMiddleware);

// CRUD
router.get('/', (req, res, next) => productPurchaseController.getAll(req, res, next));
router.get('/suppliers', (req, res, next) => productPurchaseController.getSuppliers(req, res, next));
router.get('/stats', (req, res, next) => productPurchaseController.getStats(req, res, next));
router.get('/:id', (req, res, next) => productPurchaseController.getById(req, res, next));
router.post('/', (req, res, next) => productPurchaseController.create(req, res, next));
router.delete('/:id', (req, res, next) => productPurchaseController.delete(req, res, next));

// История по продукту
router.get('/product/:productId/history', (req, res, next) => productPurchaseController.getProductHistory(req, res, next));

export default router;
