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
import {
  getAllDishQualityRecords,
  getDishQualityRecordById,
  createDishQualityRecord,
  updateDishQualityRecord,
  deleteDishQualityRecord,
  deleteAllDishQualityRecords,
  generateDishQualityByMenu
} from './dishQualityController';
import { authMiddleware } from '../../../middlewares/authMiddleware';
import { authorizeRole } from '../../../middlewares/authRole';

const router = express.Router();

const roles = ['admin', 'manager', 'doctor', 'nurse', 'cook'];

// ===== Dish Quality Assessment Routes (used by frontend) =====
// These routes MUST come before /:id to avoid route conflicts

// Generate records from menu (POST /organoleptic-journal/generate-by-menu)
router.post('/generate-by-menu', authMiddleware, authorizeRole(roles), generateDishQualityByMenu);

// Get all dish quality records (GET /organoleptic-journal)
router.get('/', authMiddleware, authorizeRole(roles), getAllDishQualityRecords);

// Create a new dish quality record (POST /organoleptic-journal)
router.post('/', authMiddleware, authorizeRole(roles), createDishQualityRecord);

// Delete all dish quality records (DELETE /organoleptic-journal)
router.delete('/', authMiddleware, authorizeRole(roles), deleteAllDishQualityRecords);

// Get dish quality record by ID (GET /organoleptic-journal/:id)
router.get('/:id', authMiddleware, authorizeRole(roles), getDishQualityRecordById);

// Update dish quality record (PUT /organoleptic-journal/:id)
router.put('/:id', authMiddleware, authorizeRole(roles), updateDishQualityRecord);

// Delete dish quality record (DELETE /organoleptic-journal/:id)
router.delete('/:id', authMiddleware, authorizeRole(roles), deleteDishQualityRecord);

// ===== Product Inspection Routes (kept for future use) =====
// These use the original detailed product inspection model

router.get('/product-inspection/all', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getAllOrganolepticJournals);
router.get('/product-inspection/:id', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getOrganolepticJournalById);
router.post('/product-inspection', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), createOrganolepticJournal);
router.put('/product-inspection/:id', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), updateOrganolepticJournal);
router.delete('/product-inspection/:id', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), deleteOrganolepticJournal);
router.get('/product-inspection/child/:childId', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getOrganolepticJournalsByChildId);
router.get('/product-inspection/inspector/:inspectorId', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getOrganolepticJournalsByInspectorId);
router.get('/product-inspection/inspections', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getUpcomingInspections);
router.patch('/product-inspection/:id/status', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), updateOrganolepticJournalStatus);
router.patch('/product-inspection/:id/recommendations', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), addOrganolepticJournalRecommendations);
router.get('/product-inspection/statistics', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getOrganolepticJournalStatistics);

export default router;