import express from 'express';
import {
  getAllInfectiousDiseasesJournals,
  getInfectiousDiseasesJournalById,
  createInfectiousDiseasesJournal,
  updateInfectiousDiseasesJournal,
  deleteInfectiousDiseasesJournal,
  getInfectiousDiseasesJournalsByChildId
} from './controller';
import { authMiddleware } from '../../../middlewares/authMiddleware';
import { authorizeRole } from '../../../middlewares/authRole';

const router = express.Router();

router.get('/', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getAllInfectiousDiseasesJournals);
router.get('/child/:childId', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getInfectiousDiseasesJournalsByChildId);
router.get('/:id', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getInfectiousDiseasesJournalById);
router.post('/', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), createInfectiousDiseasesJournal);
router.put('/:id', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), updateInfectiousDiseasesJournal);
router.delete('/:id', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), deleteInfectiousDiseasesJournal);

export default router;