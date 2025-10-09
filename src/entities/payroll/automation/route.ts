import express from 'express';
import { 
  runPayrollAutomationController, 
  manualRunPayrollAutomationController,
  getPayrollAutomationSettings,
  updatePayrollAutomationSettings
} from './controller';
import { authMiddleware } from '../../../middlewares/authMiddleware';
import { authorizeRole } from '../../../middlewares/authRole';

const router = express.Router();

// Run payroll automation
router.post('/run', authMiddleware, authorizeRole(['admin']), runPayrollAutomationController);

// Manual run payroll automation
router.post('/manual-run', authMiddleware, authorizeRole(['admin']), manualRunPayrollAutomationController);

// Get payroll automation settings
router.get('/settings', authMiddleware, authorizeRole(['admin']), getPayrollAutomationSettings);

// Update payroll automation settings
router.put('/settings', authMiddleware, authorizeRole(['admin']), updatePayrollAutomationSettings);

export default router;