import express from 'express';
import {
  getAllMantouxJournals,
  getMantouxJournalById,
  createMantouxJournal,
  updateMantouxJournal,
  deleteMantouxJournal,
  getMantouxJournalsByChildId
} from './controller';
import { authMiddleware } from '../../../middlewares/authMiddleware';
import { authorizeRole } from '../../../middlewares/authRole';

const router = express.Router();

router.get('/', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getAllMantouxJournals);
router.get('/child/:childId', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getMantouxJournalsByChildId);
router.get('/:id', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getMantouxJournalById);
router.post('/', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), createMantouxJournal);
router.put('/:id', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), updateMantouxJournal);
router.delete('/:id', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), deleteMantouxJournal);

export default router;