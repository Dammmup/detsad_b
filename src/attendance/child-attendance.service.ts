import { Document, Types } from 'mongoose';
import ChildAttendance, { IChildAttendance } from './child-attendance.model';
import Child from '../children/child.model';
import User from '../users/user.model';

// Сервис для работы с посещаемостью детей
export class ChildAttendanceService {
  // Получение записей посещаемости с фильтрацией
  async getChildAttendances(filter: any = {}) {
    try {
      return await ChildAttendance.find(filter)
        .populate('childId', 'fullName groupId')
        .populate('recordedBy', 'fullName role');
    } catch (error) {
      throw new Error(`Error getting child attendances: ${error}`);
    }
  }

  // Получение записи посещаемости по ID
  async getChildAttendanceById(id: string) {
    try {
      return await ChildAttendance.findById(id)
        .populate('childId', 'fullName groupId')
        .populate('recordedBy', 'fullName role');
    } catch (error) {
      throw new Error(`Error getting child attendance by id: ${error}`);
    }
  }

  // Создание новой записи посещаемости
  async createChildAttendance(attendanceData: Partial<IChildAttendance>) {
    try {
      const attendance = new ChildAttendance(attendanceData);
      return await attendance.save();
    } catch (error) {
      throw new Error(`Error creating child attendance: ${error}`);
    }
  }

  // Обновление записи посещаемости
  async updateChildAttendance(id: string, attendanceData: Partial<IChildAttendance>) {
    try {
      return await ChildAttendance.findByIdAndUpdate(id, attendanceData, { new: true })
        .populate('childId', 'fullName groupId')
        .populate('recordedBy', 'fullName role');
    } catch (error) {
      throw new Error(`Error updating child attendance: ${error}`);
    }
  }

  // Удаление записи посещаемости
  async deleteChildAttendance(id: string) {
    try {
      const result = await ChildAttendance.findByIdAndDelete(id);
      return !!result;
    } catch (error) {
      throw new Error(`Error deleting child attendance: ${error}`);
    }
  }

  // Получение посещаемости по ребенку
  async getChildAttendancesByChildId(childId: string) {
    try {
      return await ChildAttendance.find({ childId })
        .populate('childId', 'fullName groupId')
        .populate('recordedBy', 'fullName role')
        .sort({ date: -1 });
    } catch (error) {
      throw new Error(`Error getting child attendances by child id: ${error}`);
    }
  }

  // Получение посещаемости за определенный период
  async getChildAttendancesByDateRange(startDate: Date, endDate: Date) {
    try {
      return await ChildAttendance.find({
        date: {
          $gte: startDate,
          $lte: endDate
        }
      })
        .populate('childId', 'fullName groupId')
        .populate('recordedBy', 'fullName role')
        .sort({ date: 1 });
    } catch (error) {
      throw new Error(`Error getting child attendances by date range: ${error}`);
    }
  }

  // Получение посещаемости по группе
  async getChildAttendancesByGroupId(groupId: string) {
    try {
      // Сначала получаем всех детей в группе
      const children = await Child.find({ groupId });
      const childIds = children.map(child => child._id);
      
      // Затем получаем посещаемость этих детей
      return await ChildAttendance.find({
        childId: { $in: childIds }
      })
        .populate('childId', 'fullName groupId')
        .populate('recordedBy', 'fullName role')
        .sort({ date: -1 });
    } catch (error) {
      throw new Error(`Error getting child attendances by group id: ${error}`);
    }
  }

  // Получение сводки посещаемости за период
  async getAttendanceSummary(startDate: Date, endDate: Date, groupId?: string) {
    try {
      // Фильтр по группе, если указан
      let childFilter: any = {};
      if (groupId) {
        childFilter.groupId = groupId;
      }
      
      // Получаем всех детей (с фильтром по группе, если указан)
      const children = await Child.find(childFilter);
      const childIds = children.map(child => child._id);
      
      // Получаем посещаемость за период
      const attendances = await ChildAttendance.find({
        childId: { $in: childIds },
        date: {
          $gte: startDate,
          $lte: endDate
        }
      });
      
      // Подсчитываем статистику
      const totalChildren = children.length;
      const presentCount = attendances.filter(a => a.status === 'present' || a.status === 'late').length;
      const absentCount = attendances.filter(a => a.status === 'absent').length;
      const lateCount = attendances.filter(a => a.status === 'late').length;
      const leaveCount = attendances.filter(a => a.status === 'leave').length;
      
      return {
        totalChildren,
        presentCount,
        absentCount,
        lateCount,
        leaveCount,
        attendanceRate: totalChildren > 0 ? (presentCount + lateCount) / totalChildren : 0
      };
    } catch (error) {
      throw new Error(`Error getting attendance summary: ${error}`);
    }
  }
}

// Экземпляр сервиса для использования в контроллерах
export const childAttendanceService = new ChildAttendanceService();