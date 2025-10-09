import express from 'express';
import { 
  getAllMedicalJournals,
  getMedicalJournalById,
  createMedicalJournal,
  updateMedicalJournal,
  deleteMedicalJournal,
  getMedicalJournalsByChildAndType,
  getUpcomingAppointments,
  updateMedicalJournalStatus,
  addMedicalJournalRecommendations,
  getMedicalJournalsStatistics
} from './controller';
import { authMiddleware } from '../../middlewares/authMiddleware';
import { authorizeRole } from '../../middlewares/authRole';

const router = express.Router();

// Получить все медицинские записи (с фильтрами)
router.get('/', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getAllMedicalJournals);

// Получить статистику медицинских записей
router.get('/statistics', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getMedicalJournalsStatistics);

// Получить предстоящие записи
router.get('/appointments', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getUpcomingAppointments);

// Получить медицинские записи по ребенку и типу
router.get('/child/:childId/type/:type', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getMedicalJournalsByChildAndType);

// Получить медицинскую запись по ID
router.get('/:id', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getMedicalJournalById);

// Создать новую медицинскую запись
router.post('/', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), createMedicalJournal);

// Обновить медицинскую запись
router.put('/:id', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), updateMedicalJournal);

// Удалить медицинскую запись
router.delete('/:id', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), deleteMedicalJournal);

// Обновить статус медицинской записи
router.patch('/:id/status', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), updateMedicalJournalStatus);

// Добавить рекомендации к медицинской записи
router.patch('/:id/recommendations', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), addMedicalJournalRecommendations);

export default router;