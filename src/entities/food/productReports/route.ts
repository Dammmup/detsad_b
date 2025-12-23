import { Router } from 'express';
import { productReportsController } from './controller';
import { authMiddleware } from '../../../middlewares/authMiddleware';

const router = Router();

router.use(authMiddleware);

// Отчёт по расходу за период
router.get('/consumption', (req, res, next) => productReportsController.getConsumptionReport(req, res, next));

// Расход за день
router.get('/daily/:date', (req, res, next) => productReportsController.getDailyConsumption(req, res, next));

// Статистика по продукту
router.get('/product/:productId', (req, res, next) => productReportsController.getProductStats(req, res, next));

// Сводный отчёт (дашборд)
router.get('/summary', (req, res, next) => productReportsController.getSummaryReport(req, res, next));

export default router;
