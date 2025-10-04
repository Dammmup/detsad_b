import express, { Router } from 'express';
import { foodController } from './food-control.controller';

const router: Router = express.Router();

// === Detergent Logs ===
router.get('/detergent-logs', foodController.getDetergentLogs);
router.get('/detergent-logs/:id', foodController.getDetergentLogById);
router.post('/detergent-logs', foodController.createDetergentLog);
router.put('/detergent-logs/:id', foodController.updateDetergentLog);
router.delete('/detergent-logs/:id', foodController.deleteDetergentLog);

// === Food Staff Health ===
router.get('/food-staff-health', foodController.getFoodStaffHealthRecords);
router.get('/food-staff-health/:id', foodController.getFoodStaffHealthRecordById);
router.post('/food-staff-health', foodController.createFoodStaffHealthRecord);
router.put('/food-staff-health/:id', foodController.updateFoodStaffHealthRecord);
router.delete('/food-staff-health/:id', foodController.deleteFoodStaffHealthRecord);

// === Food Stock Logs ===
router.get('/food-stock-logs', foodController.getFoodStockLogs);
router.get('/food-stock-logs/:id', foodController.getFoodStockLogById);
router.post('/food-stock-logs', foodController.createFoodStockLog);
router.put('/food-stock-logs/:id', foodController.updateFoodStockLog);
router.delete('/food-stock-logs/:id', foodController.deleteFoodStockLog);

// === Organoleptic Records ===
router.get('/organoleptic-records', foodController.getOrganolepticRecords);
router.get('/organoleptic-records/:id', foodController.getOrganolepticRecordById);
router.post('/organoleptic-records', foodController.createOrganolepticRecord);
router.put('/organoleptic-records/:id', foodController.updateOrganolepticRecord);
router.delete('/organoleptic-records/:id', foodController.deleteOrganolepticRecord);

// === Perishable Brak ===
router.get('/perishable-brak', foodController.getPerishableBrakRecords);
router.get('/perishable-brak/:id', foodController.getPerishableBrakRecordById);
router.post('/perishable-brak', foodController.createPerishableBrakRecord);
router.put('/perishable-brak/:id', foodController.updatePerishableBrakRecord);
router.delete('/perishable-brak/:id', foodController.deletePerishableBrakRecord);

// === Product Certificates ===
router.get('/product-certificates', foodController.getProductCertificates);
router.get('/product-certificates/:id', foodController.getProductCertificateById);
router.post('/product-certificates', foodController.createProductCertificate);
router.put('/product-certificates/:id', foodController.updateProductCertificate);
router.delete('/product-certificates/:id', foodController.deleteProductCertificate);

// === Statistics ===
router.get('/food-control-statistics', foodController.getFoodControlStatistics);

// === Search ===
router.get('/food-control-search', foodController.searchRecordsByName);

export default router;