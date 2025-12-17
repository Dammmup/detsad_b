import express from 'express';
import {
  getAllContactInfectionJournals,
  getContactInfectionJournalById,
  createContactInfectionJournal,
  updateContactInfectionJournal,
  deleteContactInfectionJournal,
  getContactInfectionJournalsByChildId,
  getContactInfectionJournalsByDoctorId,
  getUpcomingAppointments,
  updateContactInfectionJournalStatus,
  addContactInfectionJournalRecommendations,
  traceContacts,
  getContactInfectionJournalStatistics
} from './controller';
import { authMiddleware } from '../../../middlewares/authMiddleware';
import { authorizeRole } from '../../../middlewares/authRole';

const router = express.Router();


router.get('/', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getAllContactInfectionJournals);


router.get('/:id', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getContactInfectionJournalById);


router.post('/', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), createContactInfectionJournal);


router.put('/:id', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), updateContactInfectionJournal);


router.delete('/:id', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), deleteContactInfectionJournal);


router.get('/child/:childId', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getContactInfectionJournalsByChildId);


router.get('/doctor/:doctorId', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getContactInfectionJournalsByDoctorId);


router.get('/appointments', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getUpcomingAppointments);


router.patch('/:id/status', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), updateContactInfectionJournalStatus);


router.patch('/:id/recommendations', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), addContactInfectionJournalRecommendations);


router.patch('/:id/trace', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), traceContacts);


router.get('/statistics', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getContactInfectionJournalStatistics);

export default router;