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

// Get all infectious diseases journals (with filters)
router.get('/', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getAllInfectiousDiseasesJournals);

// Get infectious diseases journal by ID
router.get('/:id', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getInfectiousDiseasesJournalById);

// Create new infectious diseases journal
router.post('/', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), createInfectiousDiseasesJournal);

// Update infectious diseases journal
router.put('/:id', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), updateInfectiousDiseasesJournal);

// Delete infectious diseases journal
router.delete('/:id', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), deleteInfectiousDiseasesJournal);

// Get infectious diseases journals by child ID
router.get('/child/:childId', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getInfectiousDiseasesJournalsByChildId);

// Get infectious diseases journals by doctor ID
router.get('/doctor/:doctorId', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getInfectiousDiseasesJournalsByDoctorId);

// Get upcoming appointments
router.get('/appointments', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getUpcomingAppointments);

// Update infectious diseases journal status
router.patch('/:id/status', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), updateInfectiousDiseasesJournalStatus);

// Add recommendations to infectious diseases journal
router.patch('/:id/recommendations', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), addInfectiousDiseasesJournalRecommendations);

// Get infectious diseases journal statistics
router.get('/statistics', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getInfectiousDiseasesJournalStatistics);

export default router;