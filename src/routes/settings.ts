import express, { Request, Response } from 'express';
import { 
  KindergartenSettings, 
  NotificationSettings, 
  SecuritySettings, 
  GeolocationSettings 
} from '../models/Settings';
import { AuthenticatedRequest } from '../types/express';

const router = express.Router();

// ==================== KINDERGARTEN SETTINGS ====================

// Get kindergarten settings
router.get('/kindergarten', async (req: Request, res: Response) => {
  try {
    let settings = await KindergartenSettings.findOne().populate('updatedBy', 'fullName');
    
    // If no settings exist, create default ones
    if (!settings) {
      settings = new KindergartenSettings({
        name: 'Детский сад',
        address: 'г. Алматы ул. Цунвазо 11, 1',
        phone: '+77476254222',
        email: 'aldamiram@mail.ru',
        director: 'Салихарова Зухра ХАрбиевана',
        workingHours: {
          start: '07:00',
          end: '19:00'
        },
        workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        timezone: 'Asia/Almaty',
        language: 'ru',
        currency: 'KZT',
        updatedBy: null
      });
      await settings.save();
    }
    
    res.json(settings);
  } catch (error) {
    console.error('Error fetching kindergarten settings:', error);
    res.status(500).json({ error: 'Ошибка при получении настроек детского сада' });
  }
});

// Update kindergarten settings
router.put('/kindergarten', async (req: AuthenticatedRequest | Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const updateData = {
      ...req.body,
      updatedBy: req.user.id
    };

    let settings = await KindergartenSettings.findOne();
    
    if (!settings) {
      settings = new KindergartenSettings(updateData);
    } else {
      Object.assign(settings, updateData);
    }
    
    await settings.save();
    
    const populatedSettings = await KindergartenSettings.findById(settings._id)
      .populate('updatedBy', 'fullName');
    
    res.json(populatedSettings);
  } catch (error: any) {
    console.error('Error updating kindergarten settings:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      return res.status(400).json({ error: 'Ошибка валидации', details: errors });
    }
    
    res.status(500).json({ error: 'Ошибка при обновлении настроек детского сада' });
  }
});

// ==================== NOTIFICATION SETTINGS ====================

// Get notification settings
router.get('/notifications', async (req: Request, res: Response) => {
  try {
    let settings = await NotificationSettings.findOne().populate('updatedBy', 'fullName');
    
    // If no settings exist, create default ones
    if (!settings) {
      settings = new NotificationSettings({
        emailNotifications: true,
        smsNotifications: false,
        pushNotifications: true,
        lateArrivalAlert: true,
        absenceAlert: true,
        overtimeAlert: false,
        reportReminders: true,
        updatedBy: req.user?.id || null
      });
      await settings.save();
    }
    
    res.json(settings);
  } catch (error) {
    console.error('Error fetching notification settings:', error);
    res.status(500).json({ error: 'Ошибка при получении настроек уведомлений' });
  }
});

// Update notification settings
router.put('/notifications', async (req: AuthenticatedRequest | Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const updateData = {
      ...req.body,
      updatedBy: req.user.id
    };

    let settings = await NotificationSettings.findOne();
    
    if (!settings) {
      settings = new NotificationSettings(updateData);
    } else {
      Object.assign(settings, updateData);
    }
    
    await settings.save();
    
    const populatedSettings = await NotificationSettings.findById(settings._id)
      .populate('updatedBy', 'fullName');
    
    res.json(populatedSettings);
  } catch (error: any) {
    console.error('Error updating notification settings:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      return res.status(400).json({ error: 'Ошибка валидации', details: errors });
    }
    
    res.status(500).json({ error: 'Ошибка при обновлении настроек уведомлений' });
  }
});

// ==================== SECURITY SETTINGS ====================

// Get security settings
router.get('/security', async (req: Request, res: Response) => {
  try {
    let settings = await SecuritySettings.findOne().populate('updatedBy', 'fullName');
    
    // If no settings exist, create default ones
    if (!settings) {
      settings = new SecuritySettings({
        passwordPolicy: {
          minLength: 8,
          requireUppercase: true,
          requireLowercase: true,
          requireNumbers: true,
          requireSpecialChars: false
        },
        sessionTimeout: 60,
        twoFactorAuth: false,
        ipWhitelist: [],
        maxLoginAttempts: 5,
        lockoutDuration: 15,
        updatedBy: req.user?.id || null
      });
      await settings.save();
    }
    
    res.json(settings);
  } catch (error) {
    console.error('Error fetching security settings:', error);
    res.status(500).json({ error: 'Ошибка при получении настроек безопасности' });
  }
});

// Update security settings
router.put('/security', async (req: AuthenticatedRequest | Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const updateData = {
      ...req.body,
      updatedBy: req.user.id
    };

    let settings = await SecuritySettings.findOne();
    
    if (!settings) {
      settings = new SecuritySettings(updateData);
    } else {
      Object.assign(settings, updateData);
    }
    
    await settings.save();
    
    const populatedSettings = await SecuritySettings.findById(settings._id)
      .populate('updatedBy', 'fullName');
    
    res.json(populatedSettings);
  } catch (error: any) {
    console.error('Error updating security settings:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      return res.status(400).json({ error: 'Ошибка валидации', details: errors });
    }
    
    res.status(500).json({ error: 'Ошибка при обновлении настроек безопасности' });
  }
});

// ==================== GEOLOCATION SETTINGS ====================

// Get geolocation settings
router.get('/geolocation', async (req: Request, res: Response) => {
  try {
    let settings = await GeolocationSettings.findOne().populate('updatedBy', 'fullName');
    
    // If no settings exist, create default ones
    if (!settings) {
      settings = new GeolocationSettings({
        enabled: false,
        radius: 100,
        coordinates: {
          latitude: 51.1605, // Astana coordinates
          longitude: 71.4704
        },
        yandexApiKey: '', // Empty by default
        strictMode: false,
        allowedDevices: [],
        updatedBy: req.user?.id || null
      });
      await settings.save();
    }
    
    res.json(settings);
  } catch (error) {
    console.error('Error fetching geolocation settings:', error);
    res.status(500).json({ error: 'Ошибка при получении настроек геолокации' });
  }
});

// Update geolocation settings
router.put('/geolocation', async (req: AuthenticatedRequest | Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const updateData = {
      ...req.body,
      updatedBy: req.user.id
    };

    let settings = await GeolocationSettings.findOne();
    
    if (!settings) {
      settings = new GeolocationSettings(updateData);
    } else {
      Object.assign(settings, updateData);
    }
    
    await settings.save();
    
    const populatedSettings = await GeolocationSettings.findById(settings._id)
      .populate('updatedBy', 'fullName');
    
    res.json(populatedSettings);
  } catch (error: any) {
    console.error('Error updating geolocation settings:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      return res.status(400).json({ error: 'Ошибка валидации', details: errors });
    }
    
    res.status(500).json({ error: 'Ошибка при обновлении настроек геолокации' });
  }
});

// ==================== SYSTEM INFO ====================

// Get system information
router.get('/system', async (req: Request, res: Response) => {
  try {
    const systemInfo = {
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch
    };
    
    res.json(systemInfo);
  } catch (error) {
    console.error('Error fetching system info:', error);
    res.status(500).json({ error: 'Ошибка при получении системной информации' });
  }
});

// Test email configuration
router.post('/test-email', async (req: AuthenticatedRequest | Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email адрес обязателен' });
    }
    
    // Mock email test - in real implementation, this would send actual test email
    const testResult = {
      success: true,
      message: `Тестовое письмо отправлено на ${email}`,
      timestamp: new Date().toISOString()
    };
    
    res.json(testResult);
  } catch (error) {
    console.error('Error testing email:', error);
    res.status(500).json({ error: 'Ошибка при тестировании email' });
  }
});

// Test SMS configuration
router.post('/test-sms', async (req: AuthenticatedRequest | Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { phone } = req.body;
    
    if (!phone) {
      return res.status(400).json({ error: 'Номер телефона обязателен' });
    }
    
    // Mock SMS test - in real implementation, this would send actual test SMS
    const testResult = {
      success: true,
      message: `Тестовое SMS отправлено на ${phone}`,
      timestamp: new Date().toISOString()
    };
    
    res.json(testResult);
  } catch (error) {
    console.error('Error testing SMS:', error);
    res.status(500).json({ error: 'Ошибка при тестировании SMS' });
  }
});

export default router;
