import express from 'express';
import {
  getAllTubPositiveJournals,
  getTubPositiveJournalById,
  createTubPositiveJournal,
  updateTubPositiveJournal,
  deleteTubPositiveJournal,
  getTubPositiveJournalsByChildId,
  getTubPositiveJournalsByDoctorId,
  getUpcomingAppointments,
  updateTubPositiveJournalStatus,
  addTubPositiveJournalRecommendations,
  getTubPositiveJournalStatistics
} from './controller';
import { authMiddleware } from '../../../middlewares/authMiddleware';
import { authorizeRole } from '../../../middlewares/authRole';

const router = express.Router();


router.get('/', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getAllTubPositiveJournals);


router.get('/:id', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getTubPositiveJournalById);


router.post('/', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), createTubPositiveJournal);


router.put('/:id', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), updateTubPositiveJournal);


router.delete('/:id', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), deleteTubPositiveJournal);


router.get('/child/:childId', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getTubPositiveJournalsByChildId);


router.get('/doctor/:doctorId', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getTubPositiveJournalsByDoctorId);


router.get('/appointments', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getUpcomingAppointments);


router.patch('/:id/status', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), updateTubPositiveJournalStatus);


router.patch('/:id/recommendations', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), addTubPositiveJournalRecommendations);


router.get('/statistics', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getTubPositiveJournalStatistics);

export default router;