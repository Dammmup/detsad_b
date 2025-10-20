import express from 'express';
import multer from 'multer';
import path from 'path';
import {
  getAllDocuments,
  getDocumentById,
  createDocument,
 updateDocument,
  deleteDocument,
  searchDocuments,
  getDocumentsByCategory,
  downloadDocument
} from './controller';
import { authMiddleware } from '../../middlewares/authMiddleware';
import { authorizeRole } from '../../middlewares/authRole';

// Настройка multer для загрузки файлов
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/documents/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

const router = express.Router();

// Маршруты для шаблонов документов

// Получить все документы (с фильтрами)
router.get('/', authMiddleware, getAllDocuments);

// Поиск документов
router.get('/search', authMiddleware, searchDocuments);

// Получить документы по категории
router.get('/category/:category', authMiddleware, getDocumentsByCategory);

// Получить документ по ID
router.get('/:id', authMiddleware, getDocumentById);

// Создать новый документ
router.post('/', authMiddleware, authorizeRole(['admin', 'manager', 'teacher', 'assistant']), upload.single('file'), createDocument);

// Обновить документ
router.put('/:id', authMiddleware, authorizeRole(['admin', 'manager', 'teacher', 'assistant']), updateDocument);

// Удалить документ
router.delete('/:id', authMiddleware, authorizeRole(['admin', 'manager', 'teacher', 'assistant']), deleteDocument);

// Скачать документ
router.get('/:id/download', authMiddleware, downloadDocument);

export default router;