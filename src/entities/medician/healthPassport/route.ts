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


router.get('/', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getAllHealthPassports);


router.get('/:id', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getHealthPassportById);


router.get('/child/:childId', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getHealthPassportByChildId);


router.post('/', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), createHealthPassport);


router.put('/:id', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), updateHealthPassport);


router.delete('/:id', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), deleteHealthPassport);


router.post('/:id/vaccination', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), addVaccination);


router.post('/:id/examination', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), addDoctorExamination);


router.post('/:id/disease', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), addChronicDisease);


router.post('/:id/allergy', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), addAllergy);


router.delete('/:id/disease', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), removeChronicDisease);


router.delete('/:id/allergy', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), removeAllergy);


router.get('/vaccinations/upcoming', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getUpcomingVaccinations);


router.get('/statistics', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getHealthPassportStatistics);

export default router;