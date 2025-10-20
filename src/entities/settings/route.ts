import express from 'express';
import { 
  getGeolocationSettings,
  updateGeolocationSettings,
  updateCoordinates,
  updateRadius,
  getKindergartenSettings,
  updateKindergartenSettings,
  getNotificationSettings,
  updateNotificationSettings,
  getSecuritySettings,
  updateSecuritySettings
} from './controller';
import { authMiddleware } from '../../middlewares/authMiddleware';
import { authorizeRole } from '../../middlewares/authRole';

const router = express.Router();

// Получить настройки детского сада
router.get('/kindergarten', authMiddleware, authorizeRole(['admin']), getKindergartenSettings);

// Обновить настройки детского сада
router.put('/kindergarten', authMiddleware, authorizeRole(['admin']), updateKindergartenSettings);

// Получить настройки уведомлений
router.get('/notifications', authMiddleware, authorizeRole(['admin']), getNotificationSettings);

// Обновить настройки уведомлений
router.put('/notifications', authMiddleware, authorizeRole(['admin']), updateNotificationSettings);

// Получить настройки безопасности
router.get('/security', authMiddleware, authorizeRole(['admin']), getSecuritySettings);

// Обновить настройки безопасности
router.put('/security', authMiddleware, authorizeRole(['admin']), updateSecuritySettings);

// Получить настройки геолокации
router.get('/geolocation', authMiddleware, authorizeRole(['admin']), getGeolocationSettings);

// Обновить настройки геолокации
router.put('/geolocation', authMiddleware, authorizeRole(['admin']), updateGeolocationSettings);

// Обновить координаты
router.patch('/geolocation/coordinates', authMiddleware, authorizeRole(['admin']), updateCoordinates);

// Обновить радиус
router.patch('/geolocation/radius', authMiddleware, authorizeRole(['admin']), updateRadius);

export default router;