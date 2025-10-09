import express from 'express';
import { generateDocument, downloadGeneratedDocument } from './controller';
import { authMiddleware } from '../../../middlewares/authMiddleware';
import { authorizeRole } from '../../../middlewares/authRole';

const router = express.Router();

// Generate document
router.post('/', authMiddleware, authorizeRole(['admin', 'teacher', 'assistant']), generateDocument);

// Download generated document
router.get('/:id/download', authMiddleware, authorizeRole(['admin', 'teacher', 'assistant']), downloadGeneratedDocument);

export default router;