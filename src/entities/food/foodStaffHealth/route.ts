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


router.get('/', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getAllFoodStaffHealthRecords);


router.get('/:id', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getFoodStaffHealthRecordById);


router.post('/', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), createFoodStaffHealthRecord);


router.put('/:id', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), updateFoodStaffHealthRecord);


router.delete('/:id', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), deleteFoodStaffHealthRecord);


router.get('/staff/:staffId', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getFoodStaffHealthRecordsByStaffId);


router.get('/doctor/:doctorId', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getFoodStaffHealthRecordsByDoctorId);


router.get('/commissions', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getUpcomingMedicalCommissions);


router.get('/sanitary', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getUpcomingSanitaryMinimums);


router.get('/vaccinations', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getUpcomingVaccinations);


router.patch('/:id/status', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), updateFoodStaffHealthRecordStatus);


router.patch('/:id/recommendations', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), addFoodStaffHealthRecordRecommendations);


router.get('/statistics', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getFoodStaffHealthStatistics);

export default router;