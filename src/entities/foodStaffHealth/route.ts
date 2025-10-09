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
import { authMiddleware } from '../../middlewares/authMiddleware';
import { authorizeRole } from '../../middlewares/authRole';

const router = express.Router();

// Get all food staff health records (with filters)
router.get('/', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getAllFoodStaffHealthRecords);

// Get food staff health record by ID
router.get('/:id', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getFoodStaffHealthRecordById);

// Create new food staff health record
router.post('/', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), createFoodStaffHealthRecord);

// Update food staff health record
router.put('/:id', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), updateFoodStaffHealthRecord);

// Delete food staff health record
router.delete('/:id', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), deleteFoodStaffHealthRecord);

// Get food staff health records by staff ID
router.get('/staff/:staffId', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getFoodStaffHealthRecordsByStaffId);

// Get food staff health records by doctor ID
router.get('/doctor/:doctorId', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getFoodStaffHealthRecordsByDoctorId);

// Get upcoming medical commissions
router.get('/commissions', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getUpcomingMedicalCommissions);

// Get upcoming sanitary minimums
router.get('/sanitary', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getUpcomingSanitaryMinimums);

// Get upcoming vaccinations
router.get('/vaccinations', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getUpcomingVaccinations);

// Update food staff health record status
router.patch('/:id/status', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), updateFoodStaffHealthRecordStatus);

// Add recommendations to food staff health record
router.patch('/:id/recommendations', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), addFoodStaffHealthRecordRecommendations);

// Get food staff health statistics
router.get('/statistics', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getFoodStaffHealthStatistics);

export default router;