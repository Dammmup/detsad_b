import express from 'express';
import {
  getAllMedicalJournals,
  getMedicalJournalById,
  createMedicalJournal,
  updateMedicalJournal,
  deleteMedicalJournal,
  getMedicalJournalsByChildId
} from './controller';
import { authMiddleware } from '../../../middlewares/authMiddleware';
import { authorizeRole } from '../../../middlewares/authRole';

const router = express.Router();

router.get('/', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getAllMedicalJournals);
router.get('/child/:childId', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getMedicalJournalsByChildId);
router.get('/:id', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getMedicalJournalById);
router.post('/', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), createMedicalJournal);
router.put('/:id', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), updateMedicalJournal);
router.delete('/:id', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), deleteMedicalJournal);

export default router;