import express, { Router } from 'express';
import { settingController } from './setting.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/auth';

const router: Router = express.Router();

// Маршруты для настроек
router.get('/', authMiddleware, settingController.getSettings);
router.get('/key/:key', authMiddleware, settingController.getSettingByKey);
router.get('/category/:category', authMiddleware, settingController.getSettingsByCategory);
router.get('/public', settingController.getPublicSettings); // Публичные настройки не требуют аутентификации
router.post('/key/:key', authMiddleware, requireRole(['admin', 'manager']), settingController.setSetting);
router.delete('/key/:key', authMiddleware, requireRole(['admin', 'manager']), settingController.deleteSetting);

export default router;