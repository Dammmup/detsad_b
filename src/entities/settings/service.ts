import {
  KindergartenSettings,
  NotificationSettings,
  SecuritySettings,
  GeolocationSettings,
  IKindergartenSettings,
  INotificationSettings,
  ISecuritySettings,
  IGeolocationSettings
} from './model';

export class SettingsService {

  async getKindergartenSettings() {
    const settings = await KindergartenSettings.findOne();
    return settings;
  }

  async updateKindergartenSettings(settingsData: Partial<IKindergartenSettings>) {
    let settings = await KindergartenSettings.findOne();

    if (!settings) {
      settings = new KindergartenSettings(settingsData);
    } else {
      Object.assign(settings, settingsData);
    }

    await settings.save();
    return settings;
  }

  async getNotificationSettings() {
    const settings = await NotificationSettings.findOne();
    return settings;
  }

  async updateNotificationSettings(settingsData: Partial<INotificationSettings>) {
    let settings = await NotificationSettings.findOne();

    if (!settings) {
      settings = new NotificationSettings(settingsData);
    } else {
      Object.assign(settings, settingsData);
    }

    await settings.save();
    return settings;
  }

  async getSecuritySettings() {
    const settings = await SecuritySettings.findOne();
    return settings;
  }

  async updateSecuritySettings(settingsData: Partial<ISecuritySettings>) {
    let settings = await SecuritySettings.findOne();

    if (!settings) {
      settings = new SecuritySettings(settingsData);
    } else {
      Object.assign(settings, settingsData);
    }

    await settings.save();
    return settings;
  }

  async getGeolocationSettings() {
    const settings = await GeolocationSettings.findOne();
    return settings;
  }

  async updateGeolocationSettings(settingsData: Partial<IGeolocationSettings>) {
    let settings = await GeolocationSettings.findOne();

    if (!settings) {
      settings = new GeolocationSettings(settingsData);
    } else {
      Object.assign(settings, settingsData);
    }

    await settings.save();
    return settings;
  }

  async updateCoordinates(latitude: number, longitude: number) {
    let settings = await GeolocationSettings.findOne();

    if (!settings) {
      settings = new GeolocationSettings({
        coordinates: { latitude, longitude },
        radius: 100
      });
    } else {
      settings.coordinates = { latitude, longitude };
    }

    await settings.save();
    return settings;
  }

  async updateRadius(radius: number) {
    let settings = await GeolocationSettings.findOne();

    if (!settings) {
      settings = new GeolocationSettings({
        coordinates: {
          latitude: 43.222,
          longitude: 76.851
        },
        radius
      });
    } else {
      settings.radius = radius;
    }

    await settings.save();
    return settings;
  }

  async isNonWorkingDay(dateStr: string): Promise<boolean> {
    try {
      const settings = await this.getKindergartenSettings();

      if (!settings) {
        const date = new Date(dateStr);
        const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'short' }).toLowerCase();
        return dayOfWeek === 'sat' || dayOfWeek === 'sun';
      }

      const date = new Date(dateStr);
      const kindergartenSettings = settings as IKindergartenSettings;

      if (kindergartenSettings.holidays && kindergartenSettings.holidays.includes(dateStr)) {
        return true;
      }

      const dayOfWeekNumber = date.getDay();
      const dayOfWeek = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][dayOfWeekNumber];

      if (settings.workingDays) {
        const isWorkingDay = settings.workingDays.some(workingDay =>
          workingDay.toLowerCase() === dayOfWeek
        );
        return !isWorkingDay;
      } else {
        return dayOfWeek === 'sat' || dayOfWeek === 'sun';
      }
    } catch (error) {
      console.error('Ошибка при проверке нерабочего дня:', error);
      return false;
    }
  }
}