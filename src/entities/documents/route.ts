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


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/documents/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg',
  'image/png',
  'text/plain'
];

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
    files: 1
  },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Недопустимый тип файла'));
    }
  }
});

const router = express.Router();




router.get('/', authMiddleware, getAllDocuments);


router.get('/search', authMiddleware, searchDocuments);


router.get('/category/:category', authMiddleware, getDocumentsByCategory);


router.get('/:id', authMiddleware, getDocumentById);


router.post('/', authMiddleware, authorizeRole(['admin', 'manager', 'teacher', 'assistant']), upload.single('file'), createDocument);


router.put('/:id', authMiddleware, authorizeRole(['admin', 'manager', 'teacher', 'assistant']), updateDocument);


router.delete('/:id', authMiddleware, authorizeRole(['admin', 'manager', 'teacher', 'assistant']), deleteDocument);


router.get('/:id/download', authMiddleware, downloadDocument);

export default router;