import express from 'express';
import {
  getAllFoodStaffHealthRecords,
  getFoodStaffHealthRecordById,
  createFoodStaffHealthRecord,
  updateFoodStaffHealthRecord,
  deleteFoodStaffHealthRecord,
  getFoodStaffHealthRecordsByStaffId,
  getFoodStaffHealthRecordsByDoctorId,
  getUpcomingMedicalCommissions,
  getUpcomingSanitaryMinimums,
  getUpcomingVaccinations,
  updateFoodStaffHealthRecordStatus,
  addFoodStaffHealthRecordRecommendations,
  getFoodStaffHealthStatistics
} from './controller';
import { authMiddleware } from '../../../middlewares/authMiddleware';
import { authorizeRole } from '../../../middlewares/authRole';

const router = express.Router();

const auth = [authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse'])] as const;

// Специфические GET-маршруты ПЕРЕД /:id
router.get('/', ...auth, getAllFoodStaffHealthRecords);
router.get('/commissions', ...auth, getUpcomingMedicalCommissions);
router.get('/sanitary', ...auth, getUpcomingSanitaryMinimums);
router.get('/vaccinations', ...auth, getUpcomingVaccinations);
router.get('/statistics', ...auth, getFoodStaffHealthStatistics);
router.get('/staff/:staffId', ...auth, getFoodStaffHealthRecordsByStaffId);
router.get('/doctor/:doctorId', ...auth, getFoodStaffHealthRecordsByDoctorId);
router.get('/:id', ...auth, getFoodStaffHealthRecordById);

router.post('/', ...auth, createFoodStaffHealthRecord);
router.put('/:id', ...auth, updateFoodStaffHealthRecord);
router.delete('/:id', ...auth, deleteFoodStaffHealthRecord);
router.patch('/:id/status', ...auth, updateFoodStaffHealthRecordStatus);
router.patch('/:id/recommendations', ...auth, addFoodStaffHealthRecordRecommendations);

export default router;
