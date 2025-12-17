import express from 'express';
import {
  getAllMantouxJournals,
  getMantouxJournalById,
  createMantouxJournal,
  updateMantouxJournal,
  deleteMantouxJournal,
  getMantouxJournalsByChildId,
  getMantouxJournalsByDoctorId,
  getUpcomingAppointments,
  updateMantouxJournalStatus,
  addMantouxJournalRecommendations,
  getMantouxJournalStatistics
} from './controller';
import { authMiddleware } from '../../../middlewares/authMiddleware';
import { authorizeRole } from '../../../middlewares/authRole';

const router = express.Router();


router.get('/', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getAllMantouxJournals);


router.get('/:id', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getMantouxJournalById);


router.post('/', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), createMantouxJournal);


router.put('/:id', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), updateMantouxJournal);


router.delete('/:id', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), deleteMantouxJournal);


router.get('/child/:childId', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getMantouxJournalsByChildId);


router.get('/doctor/:doctorId', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getMantouxJournalsByDoctorId);


router.get('/appointments', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getUpcomingAppointments);


router.patch('/:id/status', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), updateMantouxJournalStatus);


router.patch('/:id/recommendations', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), addMantouxJournalRecommendations);


router.get('/statistics', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getMantouxJournalStatistics);

export default router;