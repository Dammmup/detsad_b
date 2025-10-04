import { Document, Types } from 'mongoose';
import MenuItem, { IMenuItem } from './menu-item.model';
import Cyclogram, { ICyclogram } from './cyclogram.model';
import Schedule, { ISchedule } from './schedule.model';
import Group from '../groups/group.model';
import User from '../users/user.model';

// Сервис для работы с меню
export class MenuService {
  // === Menu Items ===
  
  // Получение пунктов меню с фильтрацией
  async getMenuItems(filter: any = {}) {
    try {
      return await MenuItem.find(filter);
    } catch (error) {
      throw new Error(`Error getting menu items: ${error}`);
    }
  }

  // Получение пункта меню по ID
  async getMenuItemById(id: string) {
    try {
      return await MenuItem.findById(id);
    } catch (error) {
      throw new Error(`Error getting menu item by id: ${error}`);
    }
  }

  // Создание нового пункта меню
  async createMenuItem(menuItemData: Partial<IMenuItem>) {
    try {
      const menuItem = new MenuItem(menuItemData);
      return await menuItem.save();
    } catch (error) {
      throw new Error(`Error creating menu item: ${error}`);
    }
  }

  // Обновление пункта меню
  async updateMenuItem(id: string, menuItemData: Partial<IMenuItem>) {
    try {
      return await MenuItem.findByIdAndUpdate(id, menuItemData, { new: true });
    } catch (error) {
      throw new Error(`Error updating menu item: ${error}`);
    }
  }

  // Удаление пункта меню
  async deleteMenuItem(id: string) {
    try {
      const result = await MenuItem.findByIdAndDelete(id);
      return !!result;
    } catch (error) {
      throw new Error(`Error deleting menu item: ${error}`);
    }
  }

  // === Cyclograms ===
  
  // Получение циклограмм с фильтрацией
  async getCyclograms(filter: any = {}) {
    try {
      return await Cyclogram.find(filter)
        .populate('createdBy', 'fullName role');
    } catch (error) {
      throw new Error(`Error getting cyclograms: ${error}`);
    }
  }

  // Получение циклограммы по ID
  async getCyclogramById(id: string) {
    try {
      return await Cyclogram.findById(id)
        .populate('createdBy', 'fullName role');
    } catch (error) {
      throw new Error(`Error getting cyclogram by id: ${error}`);
    }
  }

  // Создание новой циклограммы
  async createCyclogram(cyclogramData: Partial<ICyclogram>) {
    try {
      const cyclogram = new Cyclogram(cyclogramData);
      return await cyclogram.save();
    } catch (error) {
      throw new Error(`Error creating cyclogram: ${error}`);
    }
  }

  // Обновление циклограммы
  async updateCyclogram(id: string, cyclogramData: Partial<ICyclogram>) {
    try {
      return await Cyclogram.findByIdAndUpdate(id, cyclogramData, { new: true })
        .populate('createdBy', 'fullName role');
    } catch (error) {
      throw new Error(`Error updating cyclogram: ${error}`);
    }
  }

  // Удаление циклограммы
  async deleteCyclogram(id: string) {
    try {
      const result = await Cyclogram.findByIdAndDelete(id);
      return !!result;
    } catch (error) {
      throw new Error(`Error deleting cyclogram: ${error}`);
    }
  }

  // === Schedules ===
  
  // Получение расписаний с фильтрацией
  async getSchedules(filter: any = {}) {
    try {
      return await Schedule.find(filter)
        .populate('cyclogramId', 'name description')
        .populate('publishedBy', 'fullName role');
    } catch (error) {
      throw new Error(`Error getting schedules: ${error}`);
    }
  }

  // Получение расписания по ID
  async getScheduleById(id: string) {
    try {
      return await Schedule.findById(id)
        .populate('cyclogramId', 'name description')
        .populate('publishedBy', 'fullName role');
    } catch (error) {
      throw new Error(`Error getting schedule by id: ${error}`);
    }
  }

  // Создание нового расписания
  async createSchedule(scheduleData: Partial<ISchedule>) {
    try {
      const schedule = new Schedule(scheduleData);
      return await schedule.save();
    } catch (error) {
      throw new Error(`Error creating schedule: ${error}`);
    }
  }

  // Обновление расписания
  async updateSchedule(id: string, scheduleData: Partial<ISchedule>) {
    try {
      return await Schedule.findByIdAndUpdate(id, scheduleData, { new: true })
        .populate('cyclogramId', 'name description')
        .populate('publishedBy', 'fullName role');
    } catch (error) {
      throw new Error(`Error updating schedule: ${error}`);
    }
  }

  // Удаление расписания
  async deleteSchedule(id: string) {
    try {
      const result = await Schedule.findByIdAndDelete(id);
      return !!result;
    } catch (error) {
      throw new Error(`Error deleting schedule: ${error}`);
    }
  }

  // Получение расписаний по дате
  async getSchedulesByDate(date: Date) {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 999);
      
      return await Schedule.find({
        date: {
          $gte: startOfDay,
          $lte: endOfDay
        },
        isPublished: true
      })
        .populate('cyclogramId', 'name description')
        .populate('publishedBy', 'fullName role');
    } catch (error) {
      throw new Error(`Error getting schedules by date: ${error}`);
    }
  }

  // Получение расписаний по периоду
  async getSchedulesByPeriod(startDate: Date, endDate: Date) {
    try {
      return await Schedule.find({
        date: {
          $gte: startDate,
          $lte: endDate
        },
        isPublished: true
      })
        .populate('cyclogramId', 'name description')
        .populate('publishedBy', 'fullName role')
        .sort({ date: 1 });
    } catch (error) {
      throw new Error(`Error getting schedules by period: ${error}`);
    }
  }

  // Получение расписаний по циклограмме
  async getSchedulesByCyclogramId(cyclogramId: string) {
    try {
      return await Schedule.find({ cyclogramId })
        .populate('cyclogramId', 'name description')
        .populate('publishedBy', 'fullName role')
        .sort({ date: -1 });
    } catch (error) {
      throw new Error(`Error getting schedules by cyclogram id: ${error}`);
    }
  }

  // Публикация расписания
  async publishSchedule(id: string, userId: string) {
    try {
      return await Schedule.findByIdAndUpdate(
        id, 
        { 
          isPublished: true, 
          publishedBy: userId,
          publishedAt: new Date()
        }, 
        { new: true }
      )
        .populate('cyclogramId', 'name description')
        .populate('publishedBy', 'fullName role');
    } catch (error) {
      throw new Error(`Error publishing schedule: ${error}`);
    }
  }

  // Снятие с публикации расписания
  async unpublishSchedule(id: string) {
    try {
      return await Schedule.findByIdAndUpdate(
        id, 
        { 
          isPublished: false, 
          publishedBy: null,
          publishedAt: null
        }, 
        { new: true }
      )
        .populate('cyclogramId', 'name description')
        .populate('publishedBy', 'fullName role');
    } catch (error) {
      throw new Error(`Error unpublishing schedule: ${error}`);
    }
  }

  // === Menu Statistics ===
  
  // Получение статистики меню
  async getMenuStatistics() {
    try {
      const totalMenuItems = await MenuItem.countDocuments({ isActive: true });
      const inactiveMenuItems = await MenuItem.countDocuments({ isActive: false });
      
      const totalCyclograms = await Cyclogram.countDocuments({ isActive: true });
      const inactiveCyclograms = await Cyclogram.countDocuments({ isActive: false });
      
      const totalSchedules = await Schedule.countDocuments();
      const publishedSchedules = await Schedule.countDocuments({ isPublished: true });
      const unpublishedSchedules = await Schedule.countDocuments({ isPublished: false });
      
      return {
        menuItems: {
          total: totalMenuItems,
          inactive: inactiveMenuItems
        },
        cyclograms: {
          total: totalCyclograms,
          inactive: inactiveCyclograms
        },
        schedules: {
          total: totalSchedules,
          published: publishedSchedules,
          unpublished: unpublishedSchedules
        }
      };
    } catch (error) {
      throw new Error(`Error getting menu statistics: ${error}`);
    }
  }

  // === Search ===
  
  // Поиск пунктов меню по названию
  async searchMenuItemsByName(searchTerm: string) {
    try {
      return await MenuItem.find({
        name: { $regex: searchTerm, $options: 'i' },
        isActive: true
      }).limit(20);
    } catch (error) {
      throw new Error(`Error searching menu items by name: ${error}`);
    }
  }

  // Поиск циклограмм по названию
  async searchCyclogramsByName(searchTerm: string) {
    try {
      return await Cyclogram.find({
        name: { $regex: searchTerm, $options: 'i' },
        isActive: true
      })
        .populate('createdBy', 'fullName role')
        .limit(20);
    } catch (error) {
      throw new Error(`Error searching cyclograms by name: ${error}`);
    }
  }
}

// Экземпляр сервиса для использования в контроллерах
export const menuService = new MenuService();