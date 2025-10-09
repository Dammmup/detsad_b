import express from 'express';
import { 
  getAllDocuments,
  getDocumentById,
  createDocument,
  updateDocument,
  deleteDocument,
  searchDocuments,
  getDocumentsByCategory
} from './controller';
import { authMiddleware } from '../../middlewares/authMiddleware';
import { authorizeRole } from '../../middlewares/authRole';

const router = express.Router();

// Получить все документы (с фильтрами)
router.get('/', authMiddleware, getAllDocuments);

// Поиск документов
router.get('/search', authMiddleware, searchDocuments);

// Получить документы по категории
router.get('/category/:category', authMiddleware, getDocumentsByCategory);

// Получить документ по ID
router.get('/:id', authMiddleware, getDocumentById);

// Создать новый документ
router.post('/', authMiddleware, authorizeRole(['admin', 'manager', 'teacher', 'assistant']), createDocument);

// Обновить документ
router.put('/:id', authMiddleware, authorizeRole(['admin', 'manager', 'teacher', 'assistant']), updateDocument);

// Удалить документ
router.delete('/:id', authMiddleware, authorizeRole(['admin', 'manager', 'teacher', 'assistant']), deleteDocument);

export default router;