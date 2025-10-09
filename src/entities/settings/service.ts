import { GeolocationSettings } from './model';
import { IGeolocationSettings } from './model';

export class SettingsService {
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
}