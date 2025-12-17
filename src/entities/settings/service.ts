import {
  createKindergartenSettingsModel,
  createNotificationSettingsModel,
  createSecuritySettingsModel,
  createGeolocationSettingsModel,
  IKindergartenSettings,
  INotificationSettings,
  ISecuritySettings,
  IGeolocationSettings
} from './model';


let KindergartenSettingsModel: any = null;
let NotificationSettingsModel: any = null;
let SecuritySettingsModel: any = null;
let GeolocationSettingsModel: any = null;

const getKindergartenSettingsModel = () => {
  if (!KindergartenSettingsModel) {
    KindergartenSettingsModel = createKindergartenSettingsModel();
  }
  return KindergartenSettingsModel;
};

const getNotificationSettingsModel = () => {
  if (!NotificationSettingsModel) {
    NotificationSettingsModel = createNotificationSettingsModel();
  }
  return NotificationSettingsModel;
};

const getSecuritySettingsModel = () => {
  if (!SecuritySettingsModel) {
    SecuritySettingsModel = createSecuritySettingsModel();
  }
  return SecuritySettingsModel;
};

const getGeolocationSettingsModel = () => {
  if (!GeolocationSettingsModel) {
    GeolocationSettingsModel = createGeolocationSettingsModel();
  }
  return GeolocationSettingsModel;
};

export class SettingsService {

  async getKindergartenSettings() {
    const settings = await getKindergartenSettingsModel().findOne();
    return settings;
  }

  async updateKindergartenSettings(settingsData: Partial<IKindergartenSettings>) {
    let settings = await getKindergartenSettingsModel().findOne();

    if (!settings) {

      settings = new (getKindergartenSettingsModel())(settingsData);
    } else {

      Object.assign(settings, settingsData);
    }

    await settings.save();
    return settings;
  }


  async getNotificationSettings() {
    const settings = await getNotificationSettingsModel().findOne();
    return settings;
  }

  async updateNotificationSettings(settingsData: Partial<INotificationSettings>) {
    let settings = await getNotificationSettingsModel().findOne();

    if (!settings) {

      settings = new (getNotificationSettingsModel())(settingsData);
    } else {

      Object.assign(settings, settingsData);
    }

    await settings.save();
    return settings;
  }


  async getSecuritySettings() {
    const settings = await getSecuritySettingsModel().findOne();
    return settings;
  }

  async updateSecuritySettings(settingsData: Partial<ISecuritySettings>) {
    let settings = await getSecuritySettingsModel().findOne();

    if (!settings) {

      settings = new (getSecuritySettingsModel())(settingsData);
    } else {

      Object.assign(settings, settingsData);
    }

    await settings.save();
    return settings;
  }


  async getGeolocationSettings() {
    const settings = await getGeolocationSettingsModel().findOne();
    return settings;
  }

  async updateGeolocationSettings(settingsData: Partial<IGeolocationSettings>) {
    let settings = await getGeolocationSettingsModel().findOne();

    if (!settings) {

      settings = new (getGeolocationSettingsModel())(settingsData);
    } else {

      Object.assign(settings, settingsData);
    }

    await settings.save();
    return settings;
  }

  async updateCoordinates(latitude: number, longitude: number) {
    let settings = await GeolocationSettingsModel().findOne();

    if (!settings) {

      settings = new (getGeolocationSettingsModel())({
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
    let settings = await GeolocationSettingsModel().findOne();

    if (!settings) {

      settings = new (getGeolocationSettingsModel())({
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