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


router.get('/kindergarten', authMiddleware, getKindergartenSettings);


router.put('/kindergarten', authMiddleware, authorizeRole(['admin']), updateKindergartenSettings);


router.get('/notifications', authMiddleware, authorizeRole(['admin']), getNotificationSettings);


router.put('/notifications', authMiddleware, authorizeRole(['admin']), updateNotificationSettings);


router.get('/security', authMiddleware, authorizeRole(['admin']), getSecuritySettings);


router.put('/security', authMiddleware, authorizeRole(['admin']), updateSecuritySettings);


router.get('/geolocation', authMiddleware, getGeolocationSettings);


router.put('/geolocation', authMiddleware, authorizeRole(['admin']), updateGeolocationSettings);


router.patch('/geolocation/coordinates', authMiddleware, authorizeRole(['admin']), updateCoordinates);


router.patch('/geolocation/radius', authMiddleware, authorizeRole(['admin']), updateRadius);

export default router;