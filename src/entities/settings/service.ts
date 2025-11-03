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

// Отложенное создание моделей
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
  // Методы для настроек детского сада
  async getKindergartenSettings() {
    const settings = await getKindergartenSettingsModel().findOne();
    return settings;
  }
  
  async updateKindergartenSettings(settingsData: Partial<IKindergartenSettings>) {
    let settings = await getKindergartenSettingsModel().findOne();
    
    if (!settings) {
      // Создаем новые настройки, если они еще не существуют
      settings = new (getKindergartenSettingsModel())(settingsData);
    } else {
      // Обновляем существующие настройки
      Object.assign(settings, settingsData);
    }
    
    await settings.save();
    return settings;
  }

  // Методы для настроек уведомлений
 async getNotificationSettings() {
   const settings = await getNotificationSettingsModel().findOne();
   return settings;
 }
 
 async updateNotificationSettings(settingsData: Partial<INotificationSettings>) {
   let settings = await getNotificationSettingsModel().findOne();
   
   if (!settings) {
     // Создаем новые настройки, если они еще не существуют
     settings = new (getNotificationSettingsModel())(settingsData);
   } else {
     // Обновляем существующие настройки
     Object.assign(settings, settingsData);
   }
   
   await settings.save();
   return settings;
 }

  // Методы для настроек безопасности
  async getSecuritySettings() {
    const settings = await getSecuritySettingsModel().findOne();
    return settings;
  }
  
  async updateSecuritySettings(settingsData: Partial<ISecuritySettings>) {
    let settings = await getSecuritySettingsModel().findOne();
    
    if (!settings) {
      // Создаем новые настройки, если они еще не существуют
      settings = new (getSecuritySettingsModel())(settingsData);
    } else {
      // Обновляем существующие настройки
      Object.assign(settings, settingsData);
    }
    
    await settings.save();
    return settings;
  }

  // Методы для настроек геолокации
  async getGeolocationSettings() {
    const settings = await getGeolocationSettingsModel().findOne();
    return settings;
 }
  
  async updateGeolocationSettings(settingsData: Partial<IGeolocationSettings>) {
    let settings = await getGeolocationSettingsModel().findOne();
    
    if (!settings) {
      // Создаем новые настройки, если они еще не существуют
      settings = new (getGeolocationSettingsModel())(settingsData);
    } else {
      // Обновляем существующие настройки
      Object.assign(settings, settingsData);
    }
    
    await settings.save();
    return settings;
  }

  async updateCoordinates(latitude: number, longitude: number) {
    let settings = await GeolocationSettingsModel().findOne();
    
    if (!settings) {
      // Создаем новые настройки с переданными координатами
      settings = new (getGeolocationSettingsModel())({
        coordinates: { latitude, longitude },
        radius: 100 // значение по умолчанию
      });
    } else {
      // Обновляем координаты в существующих настройках
      settings.coordinates = { latitude, longitude };
    }
    
    await settings.save();
    return settings;
  }

  async updateRadius(radius: number) {
    let settings = await GeolocationSettingsModel().findOne();
    
    if (!settings) {
      // Создаем новые настройки с переданным радиусом
      settings = new (getGeolocationSettingsModel())({
        coordinates: {
          latitude: 43.222, // значение по умолчанию
          longitude: 76.851  // значение по умолчанию
        },
        radius
      });
    } else {
      // Обновляем радиус в существующих настройках
      settings.radius = radius;
    }
    
    await settings.save();
    return settings;
  }

  /**
   * Проверяет, является ли указанный день нерабочим (выходной или праздник)
   * @param dateStr Дата в формате YYYY-MM-DD
   * @returns boolean true, если день является нерабочим
   */
  async isNonWorkingDay(dateStr: string): Promise<boolean> {
    try {
      // Получаем настройки детского сада
      const settings = await this.getKindergartenSettings();
      
      if (!settings) {
        // Если настройки не найдены, используем значения по умолчанию
        // По умолчанию суббота и воскресенье - выходные
        const date = new Date(dateStr);
        const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'short' }).toLowerCase();
        return dayOfWeek === 'sat' || dayOfWeek === 'sun';
      }

      // Преобразуем строку даты в объект Date
      const date = new Date(dateStr);
      
      // Проверяем, является ли день праздником
      const kindergartenSettings = settings as IKindergartenSettings;
      if (kindergartenSettings.holidays && kindergartenSettings.holidays.includes(dateStr)) {
        return true;
      }
      
      // Определяем день недели (0 - воскресенье, 1 - понедельник, и т.д.)
      const dayOfWeekNumber = date.getDay();
      const dayOfWeek = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][dayOfWeekNumber];
      
      // Проверяем, является ли день выходным согласно настройкам
      if (settings.workingDays) {
        // Если в настройках указаны рабочие дни, то все остальные - выходные
        const isWorkingDay = settings.workingDays.some(workingDay =>
          workingDay.toLowerCase() === dayOfWeek
        );
        return !isWorkingDay;
      } else {
        // По умолчанию суббота и воскресенье - выходные
        return dayOfWeek === 'sat' || dayOfWeek === 'sun';
      }
    } catch (error) {
      console.error('Ошибка при проверке нерабочего дня:', error);
      // В случае ошибки возвращаем false, чтобы не блокировать основную функциональность
      return false;
    }
  }
}