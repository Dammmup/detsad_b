import express from 'express';
import {
  getAllTubPositiveJournals,
  getTubPositiveJournalById,
  createTubPositiveJournal,
  updateTubPositiveJournal,
  deleteTubPositiveJournal,
  getTubPositiveJournalsByChildId
} from './controller';
import { authMiddleware } from '../../../middlewares/authMiddleware';
import { authorizeRole } from '../../../middlewares/authRole';

const router = express.Router();

router.get('/', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getAllTubPositiveJournals);
router.get('/child/:childId', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getTubPositiveJournalsByChildId);
router.get('/:id', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getTubPositiveJournalById);
router.post('/', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), createTubPositiveJournal);
router.put('/:id', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), updateTubPositiveJournal);
router.delete('/:id', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), deleteTubPositiveJournal);

export default router;