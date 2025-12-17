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
import { authMiddleware } from '../../../middlewares/authMiddleware';
import { authorizeRole } from '../../../middlewares/authRole';

const router = express.Router();


router.get('/', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getAllMedicalJournals);


router.get('/statistics', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getMedicalJournalsStatistics);


router.get('/appointments', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getUpcomingAppointments);


router.get('/child/:childId/type/:type', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getMedicalJournalsByChildAndType);


router.get('/:id', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getMedicalJournalById);


router.post('/', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), createMedicalJournal);


router.put('/:id', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), updateMedicalJournal);


router.delete('/:id', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), deleteMedicalJournal);


router.patch('/:id/status', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), updateMedicalJournalStatus);


router.patch('/:id/recommendations', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), addMedicalJournalRecommendations);

export default router;