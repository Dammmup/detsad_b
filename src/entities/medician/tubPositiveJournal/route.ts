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

// Get all tub positive journals (with filters)
router.get('/', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getAllTubPositiveJournals);

// Get tub positive journal by ID
router.get('/:id', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getTubPositiveJournalById);

// Create new tub positive journal
router.post('/', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), createTubPositiveJournal);

// Update tub positive journal
router.put('/:id', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), updateTubPositiveJournal);

// Delete tub positive journal
router.delete('/:id', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), deleteTubPositiveJournal);

// Get tub positive journals by child ID
router.get('/child/:childId', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getTubPositiveJournalsByChildId);

// Get tub positive journals by doctor ID
router.get('/doctor/:doctorId', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getTubPositiveJournalsByDoctorId);

// Get upcoming appointments
router.get('/appointments', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getUpcomingAppointments);

// Update tub positive journal status
router.patch('/:id/status', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), updateTubPositiveJournalStatus);

// Add recommendations to tub positive journal
router.patch('/:id/recommendations', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), addTubPositiveJournalRecommendations);

// Get tub positive journal statistics
router.get('/statistics', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getTubPositiveJournalStatistics);

export default router;