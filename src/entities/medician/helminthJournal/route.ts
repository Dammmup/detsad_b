import express from 'express';
import { 
  getAllHelminthJournals,
  getHelminthJournalById,
  createHelminthJournal,
  updateHelminthJournal,
  deleteHelminthJournal,
  getHelminthJournalsByChildId,
  getHelminthJournalsByDoctorId,
  getUpcomingAppointments,
  updateHelminthJournalStatus,
  addHelminthJournalRecommendations,
  getHelminthJournalStatistics
} from './controller';
import { authMiddleware } from '../../../middlewares/authMiddleware';
import { authorizeRole } from '../../../middlewares/authRole';

const router = express.Router();

// Get all helminth journals (with filters)
router.get('/', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getAllHelminthJournals);

// Get helminth journal by ID
router.get('/:id', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getHelminthJournalById);

// Create new helminth journal
router.post('/', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), createHelminthJournal);

// Update helminth journal
router.put('/:id', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), updateHelminthJournal);

// Delete helminth journal
router.delete('/:id', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), deleteHelminthJournal);

// Get helminth journals by child ID
router.get('/child/:childId', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getHelminthJournalsByChildId);

// Get helminth journals by doctor ID
router.get('/doctor/:doctorId', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getHelminthJournalsByDoctorId);

// Get upcoming appointments
router.get('/appointments', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getUpcomingAppointments);

// Update helminth journal status
router.patch('/:id/status', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), updateHelminthJournalStatus);

// Add recommendations to helminth journal
router.patch('/:id/recommendations', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), addHelminthJournalRecommendations);

// Get helminth journal statistics
router.get('/statistics', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getHelminthJournalStatistics);

export default router;