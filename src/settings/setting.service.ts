import { Document, Types } from 'mongoose';
import Setting, { ISetting } from './setting.model';

// Сервис для работы с настройками
export class SettingService {
  // Получение настроек с фильтрацией
  async getSettings(filter: any = {}) {
    try {
      return await Setting.find(filter);
    } catch (error) {
      throw new Error(`Error getting settings: ${error}`);
    }
  }

  // Получение настройки по ключу
  async getSettingByKey(key: string) {
    try {
      return await Setting.findOne({ key });
    } catch (error) {
      throw new Error(`Error getting setting by key: ${error}`);
    }
  }

 // Создание или обновление настройки
  async setSetting(key: string, value: any, type: 'string' | 'number' | 'boolean' | 'object' | 'array', category: string, description?: string) {
    try {
      // Проверяем, существует ли уже настройка с таким ключом
      let setting = await Setting.findOne({ key });
      
      if (setting) {
        // Обновляем существующую настройку
        setting.value = value;
        setting.type = type;
        if (description) setting.description = description;
        setting.category = category;
        return await setting.save();
      } else {
        // Создаем новую настройку
        setting = new Setting({
          key,
          value,
          type,
          category,
          description
        });
        return await setting.save();
      }
    } catch (error) {
      throw new Error(`Error setting setting: ${error}`);
    }
 }

  // Удаление настройки
  async deleteSetting(key: string) {
    try {
      const result = await Setting.findOneAndDelete({ key });
      return !!result;
    } catch (error) {
      throw new Error(`Error deleting setting: ${error}`);
    }
 }

  // Получение настроек по категории
  async getSettingsByCategory(category: string) {
    try {
      return await Setting.find({ category });
    } catch (error) {
      throw new Error(`Error getting settings by category: ${error}`);
    }
  }

 // Получение публичных настроек
  async getPublicSettings() {
    try {
      return await Setting.find({ isPublic: true });
    } catch (error) {
      throw new Error(`Error getting public settings: ${error}`);
    }
  }
}

// Экземпляр сервиса для использования в контроллерах
export const settingService = new SettingService();