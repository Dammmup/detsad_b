import { Document, Types } from 'mongoose';
import Shift, { IShift } from './shift.model';

// Сервис для работы со сменами
export class ShiftService {
  // Получение смен с фильтрацией
  async getShifts(filter: any = {}) {
    try {
      return await Shift.find(filter).populate('staffId', 'fullName role');
    } catch (error) {
      throw new Error(`Error getting shifts: ${error}`);
    }
 }

  // Получение смены по ID
  async getShiftById(id: string) {
    try {
      return await Shift.findById(id).populate('staffId', 'fullName role');
    } catch (error) {
      throw new Error(`Error getting shift by id: ${error}`);
    }
  }

 // Создание новой смены
  async createShift(shiftData: Partial<IShift>) {
    try {
      const shift = new Shift(shiftData);
      return await shift.save();
    } catch (error) {
      throw new Error(`Error creating shift: ${error}`);
    }
 }

  // Обновление смены
  async updateShift(id: string, shiftData: Partial<IShift>) {
    try {
      return await Shift.findByIdAndUpdate(id, shiftData, { new: true }).populate('staffId', 'fullName role');
    } catch (error) {
      throw new Error(`Error updating shift: ${error}`);
    }
  }

  // Удаление смены
  async deleteShift(id: string) {
    try {
      const result = await Shift.findByIdAndDelete(id);
      return !!result;
    } catch (error) {
      throw new Error(`Error deleting shift: ${error}`);
    }
 }

  // Получение смен для конкретного сотрудника
  async getShiftsByStaffId(staffId: string) {
    try {
      return await Shift.find({ staffId }).populate('staffId', 'fullName role').sort({ date: -1 });
    } catch (error) {
      throw new Error(`Error getting shifts by staff id: ${error}`);
    }
  }

  // Получение смен за определенный период
  async getShiftsByDateRange(startDate: Date, endDate: Date) {
    try {
      return await Shift.find({
        date: {
          $gte: startDate,
          $lte: endDate
        }
      }).populate('staffId', 'fullName role').sort({ date: 1 });
    } catch (error) {
      throw new Error(`Error getting shifts by date range: ${error}`);
    }
  }
  async getShiftStatistics() {
    try {
      const totalShifts = await Shift.countDocuments();
      const activeShifts = await Shift.countDocuments({ endTime: { $exists: false } });
      const completedShifts = totalShifts - activeShifts;

      return {
        totalShifts,
        activeShifts,
        completedShifts
      };
    } catch (error) {
      throw new Error(`Error getting shift statistics: ${error}`);
    }
  }
  async searchShiftsByName(name: string) {
    try {
      const regex = new RegExp(name, 'i'); // Регулярное выражение для поиска по имени (без учета регистра)
      return await Shift.find()
        .populate({ path: 'staffId', match: { fullName: regex }, select: 'fullName role' })
        .then(shifts => shifts.filter(shift => shift.staffId)); // Фильтруем только те смены, где есть совпадение по имени
    } catch (error) {
      throw new Error(`Error searching shifts by staff name: ${error}`);
    }
  }
}

// Экземпляр сервиса для использования в контроллерах
export const shiftService = new ShiftService();