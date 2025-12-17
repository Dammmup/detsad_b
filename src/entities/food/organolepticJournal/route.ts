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
import { authMiddleware } from '../../../middlewares/authMiddleware';
import { authorizeRole } from '../../../middlewares/authRole';

const router = express.Router();


router.get('/', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getAllOrganolepticJournals);


router.get('/:id', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getOrganolepticJournalById);


router.post('/', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), createOrganolepticJournal);


router.put('/:id', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), updateOrganolepticJournal);


router.delete('/:id', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), deleteOrganolepticJournal);


router.get('/child/:childId', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getOrganolepticJournalsByChildId);


router.get('/inspector/:inspectorId', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getOrganolepticJournalsByInspectorId);


router.get('/inspections', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getUpcomingInspections);


router.patch('/:id/status', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), updateOrganolepticJournalStatus);


router.patch('/:id/recommendations', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), addOrganolepticJournalRecommendations);


router.get('/statistics', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getOrganolepticJournalStatistics);

export default router;