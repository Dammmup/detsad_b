import express from 'express';
import { 
  getAllHealthPassports,
  getHealthPassportById,
  getHealthPassportByChildId,
  createHealthPassport,
  updateHealthPassport,
  deleteHealthPassport,
  addVaccination,
  addDoctorExamination,
  addChronicDisease,
  addAllergy,
  removeChronicDisease,
  removeAllergy,
  getUpcomingVaccinations,
  getHealthPassportStatistics
} from './controller';
import { authMiddleware } from '../../../middlewares/authMiddleware';
import { authorizeRole } from '../../../middlewares/authRole';

const router = express.Router();

// Get all health passports (with filters)
router.get('/', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getAllHealthPassports);

// Get health passport by ID
router.get('/:id', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getHealthPassportById);

// Get health passport by child ID
router.get('/child/:childId', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getHealthPassportByChildId);

// Create new health passport
router.post('/', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), createHealthPassport);

// Update health passport
router.put('/:id', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), updateHealthPassport);

// Delete health passport
router.delete('/:id', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), deleteHealthPassport);

// Add vaccination
router.post('/:id/vaccination', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), addVaccination);

// Add doctor examination
router.post('/:id/examination', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), addDoctorExamination);

// Add chronic disease
router.post('/:id/disease', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), addChronicDisease);

// Add allergy
router.post('/:id/allergy', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), addAllergy);

// Remove chronic disease
router.delete('/:id/disease', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), removeChronicDisease);

// Remove allergy
router.delete('/:id/allergy', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), removeAllergy);

// Get upcoming vaccinations
router.get('/vaccinations/upcoming', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getUpcomingVaccinations);

// Get health passport statistics
router.get('/statistics', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getHealthPassportStatistics);

export default router;