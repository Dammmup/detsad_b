import express from 'express';
import { 
  getAllOrganolepticJournals,
  getOrganolepticJournalById,
  createOrganolepticJournal,
  updateOrganolepticJournal,
  deleteOrganolepticJournal,
  getOrganolepticJournalsByChildId,
  getOrganolepticJournalsByInspectorId,
  getUpcomingInspections,
  updateOrganolepticJournalStatus,
  addOrganolepticJournalRecommendations,
  getOrganolepticJournalStatistics
} from './controller';
import { authMiddleware } from '../../middlewares/authMiddleware';
import { authorizeRole } from '../../middlewares/authRole';

const router = express.Router();

// Get all organoleptic journals (with filters)
router.get('/', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getAllOrganolepticJournals);

// Get organoleptic journal by ID
router.get('/:id', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getOrganolepticJournalById);

// Create new organoleptic journal
router.post('/', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), createOrganolepticJournal);

// Update organoleptic journal
router.put('/:id', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), updateOrganolepticJournal);

// Delete organoleptic journal
router.delete('/:id', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), deleteOrganolepticJournal);

// Get organoleptic journals by child ID
router.get('/child/:childId', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getOrganolepticJournalsByChildId);

// Get organoleptic journals by inspector ID
router.get('/inspector/:inspectorId', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getOrganolepticJournalsByInspectorId);

// Get upcoming inspections
router.get('/inspections', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getUpcomingInspections);

// Update organoleptic journal status
router.patch('/:id/status', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), updateOrganolepticJournalStatus);

// Add recommendations to organoleptic journal
router.patch('/:id/recommendations', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), addOrganolepticJournalRecommendations);

// Get organoleptic journal statistics
router.get('/statistics', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getOrganolepticJournalStatistics);

export default router;