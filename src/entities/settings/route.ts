import express from 'express';
import { 
  getGeolocationSettings,
  updateGeolocationSettings,
  updateCoordinates,
  updateRadius
} from './controller';
import { authMiddleware } from '../../middlewares/authMiddleware';
import { authorizeRole } from '../../middlewares/authRole';

const router = express.Router();

// Получить настройки геолокации
router.get('/geolocation', authMiddleware, authorizeRole(['admin']), getGeolocationSettings);

// Обновить настройки геолокации
router.put('/geolocation', authMiddleware, authorizeRole(['admin']), updateGeolocationSettings);

// Обновить координаты
router.patch('/geolocation/coordinates', authMiddleware, authorizeRole(['admin']), updateCoordinates);

// Обновить радиус
router.patch('/geolocation/radius', authMiddleware, authorizeRole(['admin']), updateRadius);

export default router;