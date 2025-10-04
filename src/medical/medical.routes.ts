import express, { Router } from 'express';
import { medicalController } from './medical.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/auth';

const router: Router = express.Router();

// === Health Passports ===
router.get('/health-passports', authMiddleware, medicalController.getHealthPassports);
router.get('/health-passports/:id', authMiddleware, medicalController.getHealthPassportById);
router.post('/health-passports', authMiddleware, requireRole(['admin', 'manager', 'doctor', 'nurse']), medicalController.createHealthPassport);
router.put('/health-passports/:id', authMiddleware, requireRole(['admin', 'manager', 'doctor', 'nurse']), medicalController.updateHealthPassport);
router.delete('/health-passports/:id', authMiddleware, requireRole(['admin', 'manager', 'doctor', 'nurse']), medicalController.deleteHealthPassport);

// === Medical Journals ===
router.get('/medical-journals', authMiddleware, medicalController.getMedicalJournals);
router.get('/medical-journals/:id', authMiddleware, medicalController.getMedicalJournalById);
router.post('/medical-journals', authMiddleware, requireRole(['admin', 'manager', 'doctor', 'nurse']), medicalController.createMedicalJournal);
router.put('/medical-journals/:id', authMiddleware, requireRole(['admin', 'manager', 'doctor', 'nurse']), medicalController.updateMedicalJournal);
router.delete('/medical-journals/:id', authMiddleware, requireRole(['admin', 'manager', 'doctor', 'nurse']), medicalController.deleteMedicalJournal);

// === Mantoux Records ===
router.get('/mantoux-records', authMiddleware, medicalController.getMantouxRecords);
router.get('/mantoux-records/:id', authMiddleware, medicalController.getMantouxRecordById);
router.post('/mantoux-records', authMiddleware, requireRole(['admin', 'manager', 'doctor', 'nurse']), medicalController.createMantouxRecord);
router.put('/mantoux-records/:id', authMiddleware, requireRole(['admin', 'manager', 'doctor', 'nurse']), medicalController.updateMantouxRecord);
router.delete('/mantoux-records/:id', authMiddleware, requireRole(['admin', 'manager', 'doctor', 'nurse']), medicalController.deleteMantouxRecord);

// === Somatic Records ===
router.get('/somatic-records', authMiddleware, medicalController.getSomaticRecords);
router.get('/somatic-records/:id', authMiddleware, medicalController.getSomaticRecordById);
router.post('/somatic-records', authMiddleware, requireRole(['admin', 'manager', 'doctor', 'nurse']), medicalController.createSomaticRecord);
router.put('/somatic-records/:id', authMiddleware, requireRole(['admin', 'manager', 'doctor', 'nurse']), medicalController.updateSomaticRecord);
router.delete('/somatic-records/:id', authMiddleware, requireRole(['admin', 'manager', 'doctor', 'nurse']), medicalController.deleteSomaticRecord);

// === Helminth Records ===
router.get('/helminth-records', authMiddleware, medicalController.getHelminthRecords);
router.get('/helminth-records/:id', authMiddleware, medicalController.getHelminthRecordById);
router.post('/helminth-records', authMiddleware, requireRole(['admin', 'manager', 'doctor', 'nurse']), medicalController.createHelminthRecord);
router.put('/helminth-records/:id', authMiddleware, requireRole(['admin', 'manager', 'doctor', 'nurse']), medicalController.updateHelminthRecord);
router.delete('/helminth-records/:id', authMiddleware, requireRole(['admin', 'manager', 'doctor', 'nurse']), medicalController.deleteHelminthRecord);

// === Tub Positive Records ===
router.get('/tub-positive-records', authMiddleware, medicalController.getTubPositiveRecords);
router.get('/tub-positive-records/:id', authMiddleware, medicalController.getTubPositiveRecordById);
router.post('/tub-positive-records', authMiddleware, requireRole(['admin', 'manager', 'doctor', 'nurse']), medicalController.createTubPositiveRecord);
router.put('/tub-positive-records/:id', authMiddleware, requireRole(['admin', 'manager', 'doctor', 'nurse']), medicalController.updateTubPositiveRecord);
router.delete('/tub-positive-records/:id', authMiddleware, requireRole(['admin', 'manager', 'doctor', 'nurse']), medicalController.deleteTubPositiveRecord);

// === Infectious Disease Records ===
router.get('/infectious-disease-records', authMiddleware, medicalController.getInfectiousDiseaseRecords);
router.get('/infectious-disease-records/:id', authMiddleware, medicalController.getInfectiousDiseaseRecordById);
router.post('/infectious-disease-records', authMiddleware, requireRole(['admin', 'manager', 'doctor', 'nurse']), medicalController.createInfectiousDiseaseRecord);
router.put('/infectious-disease-records/:id', authMiddleware, requireRole(['admin', 'manager', 'doctor', 'nurse']), medicalController.updateInfectiousDiseaseRecord);
router.delete('/infectious-disease-records/:id', authMiddleware, requireRole(['admin', 'manager', 'doctor', 'nurse']), medicalController.deleteInfectiousDiseaseRecord);

// === Contact Infection Records ===
router.get('/contact-infection-records', authMiddleware, medicalController.getContactInfectionRecords);
router.get('/contact-infection-records/:id', authMiddleware, medicalController.getContactInfectionRecordById);
router.post('/contact-infection-records', authMiddleware, requireRole(['admin', 'manager', 'doctor', 'nurse']), medicalController.createContactInfectionRecord);
router.put('/contact-infection-records/:id', authMiddleware, requireRole(['admin', 'manager', 'doctor', 'nurse']), medicalController.updateContactInfectionRecord);
router.delete('/contact-infection-records/:id', authMiddleware, requireRole(['admin', 'manager', 'doctor', 'nurse']), medicalController.deleteContactInfectionRecord);

// === Risk Group Children ===
router.get('/risk-group-children', authMiddleware, medicalController.getRiskGroupChildren);
router.get('/risk-group-children/:id', authMiddleware, medicalController.getRiskGroupChildById);
router.post('/risk-group-children', authMiddleware, requireRole(['admin', 'manager', 'doctor', 'nurse']), medicalController.createRiskGroupChild);
router.put('/risk-group-children/:id', authMiddleware, requireRole(['admin', 'manager', 'doctor', 'nurse']), medicalController.updateRiskGroupChild);
router.delete('/risk-group-children/:id', authMiddleware, requireRole(['admin', 'manager', 'doctor', 'nurse']), medicalController.deleteRiskGroupChild);

// === Medical Statistics ===
router.get('/statistics', authMiddleware, requireRole(['admin', 'manager', 'doctor', 'nurse']), medicalController.getMedicalStatistics);

export default router;