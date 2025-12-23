import express from 'express';
import {
    getAllProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    getExpiringProducts,
    getExpiredProducts,
    getLowStockProducts,
    getProductAlerts,
    decreaseProductStock,
    increaseProductStock,
    getProductCategories,
    getProductSuppliers
} from './controller';
import { authMiddleware } from '../../../middlewares/authMiddleware';
import { authorizeRole } from '../../../middlewares/authRole';

const router = express.Router();

// Получить все продукты
router.get('/', authMiddleware, getAllProducts);

// Служебные маршруты
router.get('/expiring', authMiddleware, getExpiringProducts);
router.get('/expired', authMiddleware, getExpiredProducts);
router.get('/low-stock', authMiddleware, getLowStockProducts);
router.get('/alerts', authMiddleware, getProductAlerts);
router.get('/categories', authMiddleware, getProductCategories);
router.get('/suppliers', authMiddleware, getProductSuppliers);

// Получить продукт по ID
router.get('/:id', authMiddleware, getProductById);

// Создать продукт
router.post('/', authMiddleware, authorizeRole(['admin', 'manager', 'cook']), createProduct);

// Обновить продукт
router.put('/:id', authMiddleware, authorizeRole(['admin', 'manager', 'cook']), updateProduct);

// Удалить продукт
router.delete('/:id', authMiddleware, authorizeRole(['admin', 'manager']), deleteProduct);

// Управление запасами
router.post('/:id/decrease-stock', authMiddleware, authorizeRole(['admin', 'manager', 'cook']), decreaseProductStock);
router.post('/:id/increase-stock', authMiddleware, authorizeRole(['admin', 'manager', 'cook']), increaseProductStock);

export default router;
