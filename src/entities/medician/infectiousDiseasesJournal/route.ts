import express from 'express';
import {
  getAllInfectiousDiseasesJournals,
  getInfectiousDiseasesJournalById,
  createInfectiousDiseasesJournal,
  updateInfectiousDiseasesJournal,
  deleteInfectiousDiseasesJournal,
  getInfectiousDiseasesJournalsByChildId,
  getInfectiousDiseasesJournalsByDoctorId,
  getUpcomingAppointments,
  updateInfectiousDiseasesJournalStatus,
  addInfectiousDiseasesJournalRecommendations,
  getInfectiousDiseasesJournalStatistics
} from './controller';
import { authMiddleware } from '../../../middlewares/authMiddleware';
import { authorizeRole } from '../../../middlewares/authRole';

const router = express.Router();


router.get('/', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getAllInfectiousDiseasesJournals);


router.get('/:id', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getInfectiousDiseasesJournalById);


router.post('/', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), createInfectiousDiseasesJournal);


router.put('/:id', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), updateInfectiousDiseasesJournal);


router.delete('/:id', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), deleteInfectiousDiseasesJournal);


router.get('/child/:childId', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getInfectiousDiseasesJournalsByChildId);


router.get('/doctor/:doctorId', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getInfectiousDiseasesJournalsByDoctorId);


router.get('/appointments', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getUpcomingAppointments);


router.patch('/:id/status', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), updateInfectiousDiseasesJournalStatus);


router.patch('/:id/recommendations', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), addInfectiousDiseasesJournalRecommendations);


router.get('/statistics', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getInfectiousDiseasesJournalStatistics);

export default router;