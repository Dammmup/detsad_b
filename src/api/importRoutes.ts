/**
 * Роуты для импорта данных из Excel
 */

import { Router } from 'express';
import {
    importChildAttendance,
    importStaffAttendance,
    importChildPayments,
    importPayrolls
} from './import';
import { authMiddleware } from '../middlewares/authMiddleware';
import { authorizeRole } from '../middlewares/authRole';

const router = Router();

router.use(authMiddleware, authorizeRole(['admin']));

// POST /api/import/child-attendance - Импорт посещаемости детей
router.post('/child-attendance', importChildAttendance);

// POST /api/import/staff-attendance - Импорт посещаемости сотрудников
router.post('/staff-attendance', importStaffAttendance);

// POST /api/import/child-payments - Импорт оплаты детей
router.post('/child-payments', importChildPayments);

// POST /api/import/payrolls - Импорт зарплат
router.post('/payrolls', importPayrolls);

export default router;
