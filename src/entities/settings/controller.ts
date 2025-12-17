import { Request, Response } from 'express';
import { SettingsService } from './service';

const settingsService = new SettingsService();


export const getKindergartenSettings = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const settings = await settingsService.getKindergartenSettings();
    res.json(settings || {});
  } catch (err) {
    console.error('Error fetching kindergarten settings:', err);
    res.status(500).json({ error: 'Ошибка получения настроек детского сада' });
  }
};

export const updateKindergartenSettings = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const settings = await settingsService.updateKindergartenSettings(req.body);
    res.json(settings);
  } catch (err: any) {
    console.error('Error updating kindergarten settings:', err);
    res.status(400).json({ error: err.message || 'Ошибка обновления настроек детского сада' });
  }
};


export const getNotificationSettings = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const settings = await settingsService.getNotificationSettings();
    res.json(settings || {});
  } catch (err) {
    console.error('Error fetching notification settings:', err);
    res.status(500).json({ error: 'Ошибка получения настроек уведомлений' });
  }
};

export const updateNotificationSettings = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const settings = await settingsService.updateNotificationSettings(req.body);
    res.json(settings);
  } catch (err: any) {
    console.error('Error updating notification settings:', err);
    res.status(400).json({ error: err.message || 'Ошибка обновления настроек уведомлений' });
  }
};


export const getSecuritySettings = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const settings = await settingsService.getSecuritySettings();
    res.json(settings || {});
  } catch (err) {
    console.error('Error fetching security settings:', err);
    res.status(500).json({ error: 'Ошибка получения настроек безопасности' });
  }
};

export const updateSecuritySettings = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const settings = await settingsService.updateSecuritySettings(req.body);
    res.json(settings);
  } catch (err: any) {
    console.error('Error updating security settings:', err);
    res.status(400).json({ error: err.message || 'Ошибка обновления настроек безопасности' });
  }
};


export const getGeolocationSettings = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const settings = await settingsService.getGeolocationSettings();
    res.json(settings || {});
  } catch (err) {
    console.error('Error fetching geolocation settings:', err);
    res.status(500).json({ error: 'Ошибка получения настроек геолокации' });
  }
};

export const updateGeolocationSettings = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const settings = await settingsService.updateGeolocationSettings(req.body);
    res.json(settings);
  } catch (err: any) {
    console.error('Error updating geolocation settings:', err);
    res.status(400).json({ error: err.message || 'Ошибка обновления настроек геолокации' });
  }
};

export const updateCoordinates = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { latitude, longitude } = req.body;

    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({ error: 'Необходимо указать широту и долготу' });
    }

    const settings = await settingsService.updateCoordinates(latitude, longitude);
    res.json(settings);
  } catch (err: any) {
    console.error('Error updating coordinates:', err);
    res.status(400).json({ error: err.message || 'Ошибка обновления координат' });
  }
};

export const updateRadius = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { radius } = req.body;

    if (radius === undefined) {
      return res.status(400).json({ error: 'Необходимо указать радиус' });
    }

    const settings = await settingsService.updateRadius(radius);
    res.json(settings);
  } catch (err: any) {
    console.error('Error updating radius:', err);
    res.status(400).json({ error: err.message || 'Ошибка обновления радиуса' });
  }
};