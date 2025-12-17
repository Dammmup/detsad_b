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


router.post('/run', authMiddleware, authorizeRole(['admin']), runPayrollAutomationController);


router.post('/manual-run', authMiddleware, authorizeRole(['admin']), manualRunPayrollAutomationController);


router.get('/settings', authMiddleware, authorizeRole(['admin']), getPayrollAutomationSettings);


router.put('/settings', authMiddleware, authorizeRole(['admin']), updatePayrollAutomationSettings);

export default router;