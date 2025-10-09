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
import { authMiddleware } from '../../middlewares/authMiddleware';
import { authorizeRole } from '../../middlewares/authRole';

const router = express.Router();

// Get all mantoux journals (with filters)
router.get('/', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getAllMantouxJournals);

// Get mantoux journal by ID
router.get('/:id', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getMantouxJournalById);

// Create new mantoux journal
router.post('/', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), createMantouxJournal);

// Update mantoux journal
router.put('/:id', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), updateMantouxJournal);

// Delete mantoux journal
router.delete('/:id', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), deleteMantouxJournal);

// Get mantoux journals by child ID
router.get('/child/:childId', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getMantouxJournalsByChildId);

// Get mantoux journals by doctor ID
router.get('/doctor/:doctorId', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getMantouxJournalsByDoctorId);

// Get upcoming appointments
router.get('/appointments', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getUpcomingAppointments);

// Update mantoux journal status
router.patch('/:id/status', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), updateMantouxJournalStatus);

// Add recommendations to mantoux journal
router.patch('/:id/recommendations', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), addMantouxJournalRecommendations);

// Get mantoux journal statistics
router.get('/statistics', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getMantouxJournalStatistics);

export default router;