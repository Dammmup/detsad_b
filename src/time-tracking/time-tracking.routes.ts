import express, { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/auth';

const router: Router = express.Router();

// Маршруты для time-tracking
router.get('/', authMiddleware, requireRole(['admin', 'manager', 'teacher']), (req, res) => {
  res.json({ message: 'Time tracking routes' });
});

export default router;