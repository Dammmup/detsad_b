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
    res.status(500).json({ error: 'Ошибка получения настроек детского сада', details: err instanceof Error ? err.message : 'Unknown error' });
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
    res.status(400).json({ error: err.message || 'Ошибка обновления настроек детского сада', details: err instanceof Error ? err.message : 'Unknown error' });
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
    res.status(500).json({ error: 'Ошибка получения настроек уведомлений', details: err instanceof Error ? err.message : 'Unknown error' });
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
    res.status(400).json({ error: err.message || 'Ошибка обновления настроек уведомлений', details: err instanceof Error ? err.message : 'Unknown error' });
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
    res.status(500).json({ error: 'Ошибка получения настроек безопасности', details: err instanceof Error ? err.message : 'Unknown error' });
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
    res.status(400).json({ error: err.message || 'Ошибка обновления настроек безопасности', details: err instanceof Error ? err.message : 'Unknown error' });
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
    res.status(500).json({ error: 'Ошибка получения настроек геолокации', details: err instanceof Error ? err.message : 'Unknown error' });
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
    res.status(400).json({ error: err.message || 'Ошибка обновления настроек геолокации', details: err instanceof Error ? err.message : 'Unknown error' });
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
    res.status(400).json({ error: err.message || 'Ошибка обновления координат', details: err instanceof Error ? err.message : 'Unknown error' });
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
    res.status(400).json({ error: err.message || 'Ошибка обновления радиуса', details: err instanceof Error ? err.message : 'Unknown error' });
  }
};