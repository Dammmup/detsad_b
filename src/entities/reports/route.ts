import express from 'express';
import {
  getAllReports,
  getReportById,
  createReport,
  updateReport,
  deleteReport,
  generateReport,
  sendReport,
  getReportsByType,
  getRecentReports,
  exportSalaryReport,
  getSalarySummary,
  exportChildrenReport,
  exportAttendanceReport,
  getChildrenSummary,
  getAttendanceSummary
} from './controller';
import { authMiddleware } from '../../middlewares/authMiddleware';
import { authorizeRole } from '../../middlewares/authRole';

const router = express.Router();


router.get('/', authMiddleware, getAllReports);


router.get('/recent', authMiddleware, getRecentReports);


router.get('/type/:type', authMiddleware, getReportsByType);


router.get('/:id', authMiddleware, getReportById);


router.post('/', authMiddleware, authorizeRole(['admin', 'manager']), createReport);


router.put('/:id', authMiddleware, authorizeRole(['admin', 'manager']), updateReport);


router.delete('/:id', authMiddleware, authorizeRole(['admin', 'manager']), deleteReport);


router.post('/:id/generate', authMiddleware, authorizeRole(['admin', 'manager']), generateReport);


router.post('/:id/send', authMiddleware, authorizeRole(['admin', 'manager']), sendReport);


router.post('/salary/export', authMiddleware, authorizeRole(['admin', 'manager']), exportSalaryReport);


router.get('/salary/summary', authMiddleware, getSalarySummary);


router.post('/children/export', authMiddleware, authorizeRole(['admin', 'manager']), exportChildrenReport);


router.post('/attendance/export', authMiddleware, authorizeRole(['admin', 'manager']), exportAttendanceReport);


router.get('/children/summary', authMiddleware, getChildrenSummary);


router.get('/attendance/summary', authMiddleware, getAttendanceSummary);

export default router;