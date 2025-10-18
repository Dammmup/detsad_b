import express from 'express';
import {
  getAllRents,
  getRentById,
  createRent,
  updateRent,
  deleteRent,
  markRentAsPaid,
  generateRentSheets
} from './controller';
import { authMiddleware } from '../../middlewares/authMiddleware';
import { authorizeRole } from '../../middlewares/authRole';

const router = express.Router();

// Получить все аренды (с фильтрами)
router.get('/', authMiddleware, authorizeRole(['admin', 'manager']), getAllRents);

// Получить аренду по ID
router.get('/:id', authMiddleware, authorizeRole(['admin', 'manager']), getRentById);

// Создать новую аренду
router.post('/', authMiddleware, authorizeRole(['admin', 'manager']), createRent);

// Обновить аренду
router.put('/:id', authMiddleware, authorizeRole(['admin', 'manager']), updateRent);

// Удалить аренду
router.delete('/:id', authMiddleware, authorizeRole(['admin', 'manager']), deleteRent);

// Отметить аренду как оплаченную
router.patch('/:id/mark-paid', authMiddleware, authorizeRole(['admin', 'manager']), markRentAsPaid);

// Сгенерировать арендные листы
router.post('/generate-sheets', authMiddleware, authorizeRole(['admin']), generateRentSheets);

export default router;