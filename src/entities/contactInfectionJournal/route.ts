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
import { authMiddleware } from '../../middlewares/authMiddleware';
import { authorizeRole } from '../../middlewares/authRole';

const router = express.Router();

// Get all contact infection journals (with filters)
router.get('/', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getAllContactInfectionJournals);

// Get contact infection journal by ID
router.get('/:id', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getContactInfectionJournalById);

// Create new contact infection journal
router.post('/', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), createContactInfectionJournal);

// Update contact infection journal
router.put('/:id', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), updateContactInfectionJournal);

// Delete contact infection journal
router.delete('/:id', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), deleteContactInfectionJournal);

// Get contact infection journals by child ID
router.get('/child/:childId', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getContactInfectionJournalsByChildId);

// Get contact infection journals by doctor ID
router.get('/doctor/:doctorId', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getContactInfectionJournalsByDoctorId);

// Get upcoming appointments
router.get('/appointments', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getUpcomingAppointments);

// Update contact infection journal status
router.patch('/:id/status', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), updateContactInfectionJournalStatus);

// Add recommendations to contact infection journal
router.patch('/:id/recommendations', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), addContactInfectionJournalRecommendations);

// Trace contacts
router.patch('/:id/trace', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), traceContacts);

// Get contact infection journal statistics
router.get('/statistics', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getContactInfectionJournalStatistics);

export default router;