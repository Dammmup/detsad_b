import express from 'express';
import {
  getAllHelminthJournals,
  getHelminthJournalById,
  createHelminthJournal,
  updateHelminthJournal,
  deleteHelminthJournal,
  getHelminthJournalsByChildId
} from './controller';
import { authMiddleware } from '../../../middlewares/authMiddleware';
import { authorizeRole } from '../../../middlewares/authRole';

const router = express.Router();

router.get('/', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getAllHelminthJournals);
router.get('/child/:childId', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getHelminthJournalsByChildId);
router.get('/:id', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getHelminthJournalById);
router.post('/', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), createHelminthJournal);
router.put('/:id', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), updateHelminthJournal);
router.delete('/:id', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), deleteHelminthJournal);

export default router;