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

}