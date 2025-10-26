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
  // Методы для настроек детского сада
  async getKindergartenSettings() {
    const settings = await KindergartenSettings.findOne();
    return settings;
  }
  
  async updateKindergartenSettings(settingsData: Partial<IKindergartenSettings>) {
    let settings = await KindergartenSettings.findOne();
    
    if (!settings) {
      // Создаем новые настройки, если они еще не существуют
      settings = new KindergartenSettings(settingsData);
    } else {
      // Обновляем существующие настройки
      Object.assign(settings, settingsData);
    }
    
    await settings.save();
    return settings;
  }

  // Методы для настроек уведомлений
 async getNotificationSettings() {
    const settings = await NotificationSettings.findOne();
    return settings;
  }
  
  async updateNotificationSettings(settingsData: Partial<INotificationSettings>) {
    let settings = await NotificationSettings.findOne();
    
    if (!settings) {
      // Создаем новые настройки, если они еще не существуют
      settings = new NotificationSettings(settingsData);
    } else {
      // Обновляем существующие настройки
      Object.assign(settings, settingsData);
    }
    
    await settings.save();
    return settings;
  }

  // Методы для настроек безопасности
  async getSecuritySettings() {
    const settings = await SecuritySettings.findOne();
    return settings;
  }
  
  async updateSecuritySettings(settingsData: Partial<ISecuritySettings>) {
    let settings = await SecuritySettings.findOne();
    
    if (!settings) {
      // Создаем новые настройки, если они еще не существуют
      settings = new SecuritySettings(settingsData);
    } else {
      // Обновляем существующие настройки
      Object.assign(settings, settingsData);
    }
    
    await settings.save();
    return settings;
  }

  // Методы для настроек геолокации
  async getGeolocationSettings() {
    const settings = await GeolocationSettings.findOne();
    return settings;
 }
  
  async updateGeolocationSettings(settingsData: Partial<IGeolocationSettings>) {
    let settings = await GeolocationSettings.findOne();
    
    if (!settings) {
      // Создаем новые настройки, если они еще не существуют
      settings = new GeolocationSettings(settingsData);
    } else {
      // Обновляем существующие настройки
      Object.assign(settings, settingsData);
    }
    
    await settings.save();
    return settings;
  }

  async updateCoordinates(latitude: number, longitude: number) {
    let settings = await GeolocationSettings.findOne();
    
    if (!settings) {
      // Создаем новые настройки с переданными координатами
      settings = new GeolocationSettings({
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
    let settings = await GeolocationSettings.findOne();
    
    if (!settings) {
      // Создаем новые настройки с переданным радиусом
      settings = new GeolocationSettings({
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