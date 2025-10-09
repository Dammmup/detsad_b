import express from 'express';
import { 
  getAllReports,
  getReportById,
  createReport,
  updateReport,
  deleteReport,
  generateReport,
  sendReport,
  getReportsByType,
  getRecentReports
} from './controller';
import { authMiddleware } from '../../middlewares/authMiddleware';
import { authorizeRole } from '../../middlewares/authRole';

const router = express.Router();

// Получить все отчеты (с фильтрами)
router.get('/', authMiddleware, getAllReports);

// Получить последние отчеты
router.get('/recent', authMiddleware, getRecentReports);

// Получить отчеты по типу
router.get('/type/:type', authMiddleware, getReportsByType);

// Получить отчет по ID
router.get('/:id', authMiddleware, getReportById);

// Создать новый отчет
router.post('/', authMiddleware, authorizeRole(['admin', 'manager']), createReport);

// Обновить отчет
router.put('/:id', authMiddleware, authorizeRole(['admin', 'manager']), updateReport);

// Удалить отчет
router.delete('/:id', authMiddleware, authorizeRole(['admin', 'manager']), deleteReport);

// Сгенерировать отчет
router.post('/:id/generate', authMiddleware, authorizeRole(['admin', 'manager']), generateReport);

// Отправить отчет
router.post('/:id/send', authMiddleware, authorizeRole(['admin', 'manager']), sendReport);

export default router;