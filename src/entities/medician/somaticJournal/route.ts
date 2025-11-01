import express from 'express';
import { 
  getAllSomaticJournals,
  getSomaticJournalById,
  createSomaticJournal,
  updateSomaticJournal,
  deleteSomaticJournal,
  getSomaticJournalsByChildId,
  getSomaticJournalsByDoctorId,
  getUpcomingAppointments,
  updateSomaticJournalStatus,
  addSomaticJournalRecommendations,
  getSomaticJournalStatistics
} from './controller';
import { authMiddleware } from '../../../middlewares/authMiddleware';
import { authorizeRole } from '../../../middlewares/authRole';

const router = express.Router();

// Get all somatic journals (with filters)
router.get('/', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getAllSomaticJournals);

// Get somatic journal by ID
router.get('/:id', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getSomaticJournalById);

// Create new somatic journal
router.post('/', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), createSomaticJournal);

// Update somatic journal
router.put('/:id', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), updateSomaticJournal);

// Delete somatic journal
router.delete('/:id', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), deleteSomaticJournal);

// Get somatic journals by child ID
router.get('/child/:childId', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getSomaticJournalsByChildId);

// Get somatic journals by doctor ID
router.get('/doctor/:doctorId', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getSomaticJournalsByDoctorId);

// Get upcoming appointments
router.get('/appointments', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getUpcomingAppointments);

// Update somatic journal status
router.patch('/:id/status', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), updateSomaticJournalStatus);

// Add recommendations to somatic journal
router.patch('/:id/recommendations', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), addSomaticJournalRecommendations);

// Get somatic journal statistics
router.get('/statistics', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getSomaticJournalStatistics);

export default router;