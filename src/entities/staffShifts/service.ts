import mongoose, { Types } from 'mongoose';
import { ISimpleShift } from './model';
import Shift from './model';
import StaffAttendanceTracking from '../staffAttendanceTracking/model';
import User from '../../entities/users/model';
import { SettingsService } from '../settings/service';
import Payroll from '../payroll/model';
import { HolidaysService } from '../holidays/service';

const settingsService = new SettingsService();
const holidaysService = new HolidaysService();

export class ShiftsService {
  async getAll(filters: { staffId?: string, date?: string, status?: string, startDate?: string, endDate?: string }, userId: string, role: string) {
    const filter: any = {};
    
    // Role-based filtering
    if (role === 'teacher' || role === 'assistant') {
      filter.staffId = userId;
    } else if (filters.staffId) {
      filter.staffId = filters.staffId;
    }
    
    if (filters.date) {
      filter.date = filters.date;
    }
    
    if (filters.status) {
      filter.status = filters.status;
    }
    
    if (filters.startDate && filters.endDate) {
      filter.date = {
        $gte: filters.startDate,
        $lte: filters.endDate
      };
    }
    
    const shifts = await Shift.find(filter)
      .populate('staffId', 'fullName role')
      .populate('createdBy', 'fullName')
      .sort({ date: 1, createdAt: -1 });
    
    return shifts;
  }

 
    // Проверяем, нет ли уже смены для этого сотрудника в этот день
   async create(shiftData: any, userId: string) {
  // Validate shift data before creating
  // Проверяем, что передано корректное поле ID сотрудника
  const staffId = shiftData.staffId || shiftData.userId;
  if (!staffId) {
    throw new Error('Не указан ID сотрудника');
  }
  if (!shiftData.date) {
    throw new Error('Не указана дата смены');
  }
  if (!shiftData.startTime) {
    throw new Error('Не указано время начала');
  }
  if (!shiftData.endTime) {
    throw new Error('Не указано время окончания');
  }
  if (!shiftData.status) {
    throw new Error('Не указан статус смены');
  }
  
  const newShiftData = {
    ...shiftData,
    staffId: staffId, // Используем правильное поле
    createdBy: userId
  };
  
  // Удаляем поле type, если оно существует, чтобы избежать конфликта
  delete newShiftData.type;
  delete newShiftData.userId; // Удаляем userId, так как он не нужен в модели
  
  // Преобразуем staffId в ObjectId, если он передан как строка
  if (typeof newShiftData.staffId === 'string') {
    // Проверяем, является ли строка корректным ObjectId
    const objectIdRegex = /^[0-9a-fA-F]{24}$/;
    if (!objectIdRegex.test(newShiftData.staffId)) {
      throw new Error('Неверный формат ID сотрудника. Должен быть 24-символьный шестнадцатеричный код.');
    }
    newShiftData.staffId = new mongoose.Types.ObjectId(newShiftData.staffId);
  }
  
// Преобразуем alternativeStaffId в ObjectId, если он передан как строка и не пустой
if (typeof newShiftData.alternativeStaffId === 'string' && newShiftData.alternativeStaffId.trim() !== '') {
  // Проверяем, является ли строка корректным ObjectId
  const objectIdRegex = /^[0-9a-fA-F]{24}$/;
  if (!objectIdRegex.test(newShiftData.alternativeStaffId)) {
    throw new Error('Неверный формат ID альтернативного сотрудника. Должен быть 24-символьный шестнадцатеричный код.');
  }
  newShiftData.alternativeStaffId = new mongoose.Types.ObjectId(newShiftData.alternativeStaffId);
} else if (newShiftData.alternativeStaffId === '' || newShiftData.alternativeStaffId === null || newShiftData.alternativeStaffId === undefined) {
  // Если поле пустое или не передано, удаляем его из данных
  delete newShiftData.alternativeStaffId;
}

  
  // Преобразуем createdBy в ObjectId, если он передан как строка
  if (typeof newShiftData.createdBy === 'string') {
    // Проверяем, является ли строка корректным ObjectId
    const objectIdRegex = /^[0-9a-fA-F]{24}$/;
    if (!objectIdRegex.test(newShiftData.createdBy)) {
      throw new Error('Неверный формат ID пользователя. Должен быть 24-символьный шестнадцатеричный код.');
    }
    newShiftData.createdBy = new mongoose.Types.ObjectId(newShiftData.createdBy);
  }
  
  // Проверяем, нет ли уже смены для этого сотрудника в этот день
  const existingShift = await Shift.findOne({
    staffId: newShiftData.staffId,
    date: newShiftData.date,
    _id: { $ne: newShiftData._id } // Исключаем текущую смену при обновлении
  });
  
  if (existingShift) {
    throw new Error('У сотрудника уже есть смена в этот день');
  }
  
  const shift = new Shift(newShiftData);
  await shift.save();
  
  const populatedShift = await Shift.findById(shift._id)
    .populate('staffId', 'fullName role')
    .populate('createdBy', 'fullName');
  
  return populatedShift;
}
    

  async bulkCreate(shiftsData: any[], userId: string) {
    const createdShifts: any[] = [];
    const errors: Array<{ shift: any; error: string }> = [];
    
    for (const shiftData of shiftsData) {
      try {
        const newShiftData = {
          ...shiftData,
          createdBy: userId
        };
        
        // Удаляем поле type, если оно существует, чтобы избежать конфликта
        delete newShiftData.type;
        
        // Преобразуем staffId в ObjectId, если он передан как строка
        if (typeof newShiftData.staffId === 'string') {
          newShiftData.staffId = new mongoose.Types.ObjectId(newShiftData.staffId);
        }
        
        // Преобразуем alternativeStaffId в ObjectId, если он передан как строка и не пустой
// Преобразуем alternativeStaffId в ObjectId, если он передан как строка и не пустой
if (typeof newShiftData.alternativeStaffId === 'string' && newShiftData.alternativeStaffId.trim() !== '') {
  // Проверяем, является ли строка корректным ObjectId
  const objectIdRegex = /^[0-9a-fA-F]{24}$/;
  if (!objectIdRegex.test(newShiftData.alternativeStaffId)) {
    throw new Error('Неверный формат ID альтернативного сотрудника. Должен быть 24-символьный шестнадцатеричный код.');
  }
  newShiftData.alternativeStaffId = new mongoose.Types.ObjectId(newShiftData.alternativeStaffId);
} else if (newShiftData.alternativeStaffId === '' || newShiftData.alternativeStaffId === null || newShiftData.alternativeStaffId === undefined) {
  // Если поле пустое или не передано, удаляем его из данных
  delete newShiftData.alternativeStaffId;
}


        // Преобразуем createdBy в ObjectId, если он передан как строка
        if (typeof newShiftData.createdBy === 'string') {
          newShiftData.createdBy = new mongoose.Types.ObjectId(newShiftData.createdBy);
        }
        
        // Проверяем, нет ли уже смены для этого сотрудника в этот день
        const existingShift = await Shift.findOne({
          staffId: newShiftData.staffId,
          date: newShiftData.date,
          _id: { $ne: newShiftData._id } // Исключаем текущую смену при обновлении
        });
        
        if (existingShift) {
          throw new Error('У сотрудника уже есть смена в этот день');
        }
        
        // Validate shift data before creating
        if (!newShiftData.staffId) {
          throw new Error('Не указан ID сотрудника');
        }
        if (!newShiftData.date) {
          throw new Error('Не указана дата смены');
        }
        if (!newShiftData.startTime) {
          throw new Error('Не указано время начала');
        }
        if (!newShiftData.endTime) {
          throw new Error('Не указано время окончания');
        }
        if (!newShiftData.status) {
          throw new Error('Не указан статус смены');
        }
        
        const shift = new Shift(newShiftData);
        await shift.save();
        
        const populatedShift = await Shift.findById(shift._id)
          .populate('staffId', 'fullName role')
          .populate('createdBy', 'fullName');
        
        createdShifts.push(populatedShift);
      } catch (err: any) {
        errors.push({
          shift: shiftData,
          error: err.message || 'Ошибка создания смены'
        });
      }
    }
    
    return {
      success: createdShifts.length,
      failed: errors.length,
      errors,
      createdShifts
    };
  }

  async update(id: string, data: any) {
    // Найдем смену
    const shift = await Shift.findById(id);
    
    if (!shift) {
      throw new Error('Смена не найдена');
    }
    
    // Проверяем, нет ли уже смены для этого сотрудника в этот день (кроме текущей смены)
    if (data.date && data.staffId) {
      // Преобразуем staffId в ObjectId, если он передан как строка
      let staffIdForQuery = data.staffId;
      if (typeof data.staffId === 'string') {
        const objectIdRegex = /^[0-9a-fA-F]{24}$/;
        if (!objectIdRegex.test(data.staffId)) {
          throw new Error('Неверный формат ID сотрудника. Должен быть 24-символьный шестнадцатеричный код.');
        }
        staffIdForQuery = new mongoose.Types.ObjectId(data.staffId);
      }
      
      const existingShift = await Shift.findOne({
        staffId: staffIdForQuery,
        date: data.date,
        _id: { $ne: id } // Исключаем текущую смену
      });
      
      if (existingShift) {
        throw new Error('У сотрудника уже есть смена в этот день');
      }
    }
    
    // Обновим поля, преобразуя ObjectId при необходимости
    if (data.staffId) {
      // Преобразуем staffId в ObjectId, если он передан как строка
      if (typeof data.staffId === 'string') {
        const objectIdRegex = /^[0-9a-fA-F]{24}$/;
        if (!objectIdRegex.test(data.staffId)) {
          throw new Error('Неверный формат ID сотрудника. Должен быть 24-символьный шестнадцатеричный код.');
        }
        data.staffId = new mongoose.Types.ObjectId(data.staffId);
      }
    }
    
    if (data.alternativeStaffId !== undefined && data.alternativeStaffId !== null && data.alternativeStaffId !== '') {
      // Преобразуем alternativeStaffId в ObjectId, если он передан как строка и не пустой
      if (typeof data.alternativeStaffId === 'string') {
        const objectIdRegex = /^[0-9a-fA-F]{24}$/;
        if (!objectIdRegex.test(data.alternativeStaffId)) {
          throw new Error('Неверный формат ID альтернативного сотрудника. Должен быть 24-символьный шестнадцатеричный код.');
        }
        data.alternativeStaffId = new mongoose.Types.ObjectId(data.alternativeStaffId);
      }
    } else {
      // Если поле пустое или не передано, удаляем его из данных
      delete data.alternativeStaffId;
    }
    
    // Обновляем createdBy, если он передан
    if (data.createdBy) {
      // Преобразуем createdBy в ObjectId, если он передан как строка
      if (typeof data.createdBy === 'string') {
        const objectIdRegex = /^[0-9a-fA-F]{24}$/;
        if (!objectIdRegex.test(data.createdBy)) {
          throw new Error('Неверный формат ID пользователя. Должен быть 24-символьный шестнадцатеричный код.');
        }
        data.createdBy = new mongoose.Types.ObjectId(data.createdBy);
      }
    }
    
    Object.assign(shift, data);
    
    // Сохраним, чтобы запустить middleware
    await shift.save();
    
    // Заполним связанные данные
    await shift.populate('staffId', 'fullName role');
    await shift.populate('createdBy', 'fullName');
    
    return shift;
}

  async delete(id: string) {
    const shift = await Shift.findByIdAndDelete(id);
    
    if (!shift) {
      throw new Error('Смена не найдена');
    }
    return shift;
  }

  async checkIn(shiftId: string, userId: string, role: string) {
    const shift = await Shift.findById(shiftId);
    if (!shift) {
      throw new Error('Смена не найдена');
    }
    // Check if user can check in to this shift
    if (!shift.staffId.equals(new Types.ObjectId(userId)) &&
        (!shift.alternativeStaffId || !shift.alternativeStaffId.equals(new Types.ObjectId(userId))) &&
        role !== 'admin') {
      throw new Error('Нет прав для отметки в этой смене');
    }
    
    // Проверяем геолокацию пользователя
    const geoSettings = await settingsService.getGeolocationSettings();
    if (geoSettings && geoSettings.enabled) {
      // Если включена проверка геолокации, проверяем, находится ли пользователь в зоне
      // TODO: Добавить логику проверки геолокации
      console.log('Geolocation check enabled:', geoSettings);
    }
    
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);
    
    // Calculate schedule boundaries
    const shiftStartTime = new Date(`${shift.date} ${shift.startTime}`);
    const shiftEndTime = new Date(`${shift.date} ${shift.endTime}`);
    const actualStartTime = new Date(`${shift.date} ${currentTime}`);
    
    // If trying to check in after shift end, mark as no_show and do not count this shift
    if (actualStartTime.getTime() > shiftEndTime.getTime()) {
      shift.status = 'no_show';
      await shift.save();
      
      let timeTracking = await StaffAttendanceTracking.findOne({
        staffId: userId,
        date: shift.date
      });
      
      if (!timeTracking) {
        timeTracking = new StaffAttendanceTracking({
          staffId: userId,
          date: shift.date
        });
      }
      timeTracking.checkInTime = now;
      timeTracking.status = 'missed';
      // Optionally annotate reason
      timeTracking.notes = timeTracking.notes
        ? `${timeTracking.notes}\nОтметка после окончания смены`
        : 'Отметка после окончания смены';
      await timeTracking.save();
      
      return { shift, timeTracking, message: 'Отметка после окончания смены. Смена помечена как неявка и не засчитана.' };
    }
    
    // Update shift as in-progress
    shift.actualStart = currentTime;
    shift.status = 'in_progress';
    
    // Calculate lateness based on shift start time
    const lateMinutes = Math.max(0, Math.floor((actualStartTime.getTime() - shiftStartTime.getTime()) / (1000 * 60)));
    
    if (lateMinutes > 0) {
      shift.lateMinutes = lateMinutes;
    }
    
    await shift.save();
    
    // Create or update time tracking record
    let timeTracking = await StaffAttendanceTracking.findOne({
      staffId: userId,
      date: shift.date
    });
    
    if (!timeTracking) {
      timeTracking = new StaffAttendanceTracking({
        staffId: userId,
        date: shift.date
      });
    }
    
    timeTracking.checkInTime = now;
    timeTracking.status = 'active';
    
    // Calculate late penalty based on payroll settings
    if (lateMinutes > 0) {
      // Получаем настройки зарплаты сотрудника
      const payroll = await Payroll.findOne({ staffId: userId });
      const penaltyRate = payroll?.penaltyDetails?.amount || 500; // По умолчанию 500 тенге за минуту
      
      const penaltyAmount = lateMinutes * penaltyRate;
      timeTracking.penalties.late = {
        minutes: lateMinutes,
        amount: penaltyAmount,
        reason: `Опоздание на ${lateMinutes} минут`
      };
    }
    
    await timeTracking.save();
    
    return { shift, timeTracking, message: 'Успешно отмечен приход' };
  }

  async checkOut(shiftId: string, userId: string, role: string) {
    const shift = await Shift.findById(shiftId);
    if (!shift) {
      throw new Error('Смена не найдена');
    }
    
    if (!shift.staffId.equals(new Types.ObjectId(userId)) &&
        (!shift.alternativeStaffId || !shift.alternativeStaffId.equals(new Types.ObjectId(userId))) &&
        role !== 'admin') {
      throw new Error('Нет прав для отметки в этой смене');
    }
    
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);
    
    // Update shift
    shift.actualEnd = currentTime;
    shift.status = 'completed';
    
    // Calculate early leave based on shift end time
    const shiftEndTime = new Date(`${shift.date} ${shift.endTime}`);
    const actualEndTime = new Date(`${shift.date} ${currentTime}`);
    const earlyMinutes = Math.max(0, Math.floor((shiftEndTime.getTime() - actualEndTime.getTime()) / (1000 * 60)));
    
    if (earlyMinutes > 0) {
      shift.earlyLeaveMinutes = earlyMinutes;
    }
    
    await shift.save();
    
    // Update time tracking
    const timeTracking = await StaffAttendanceTracking.findOne({
      staffId: userId,
      date: shift.date
    });
    
    if (timeTracking) {
      timeTracking.checkOutTime = now;
      timeTracking.status = 'completed';
      // Calculate work duration manually
      if (timeTracking.checkInTime) {
        const duration = now.getTime() - timeTracking.checkInTime.getTime();
        timeTracking.workDuration = Math.floor(duration / (1000 * 60)) - (timeTracking.breakDuration || 0);
      }
      
      // Calculate early leave penalty based on payroll settings
      if (earlyMinutes > 0) {
        // Получаем настройки зарплаты сотрудника
        const payroll = await Payroll.findOne({ staffId: userId });
        const penaltyRate = payroll?.penaltyDetails?.amount || 500; // По умолчанию 500 тенге за минуту
        
        const penaltyAmount = earlyMinutes * penaltyRate;
        timeTracking.penalties.earlyLeave = {
          minutes: earlyMinutes,
          amount: penaltyAmount,
          reason: `Ранний уход на ${earlyMinutes} минут`
        };
      }
      
      // Penalty for late checkout (after scheduled end) - does not count for payroll
      const lateCheckoutMinutes = Math.max(0, Math.floor((actualEndTime.getTime() - shiftEndTime.getTime()) / (1000 * 60)));
      if (lateCheckoutMinutes > 0) {
        const payroll = await Payroll.findOne({ staffId: userId });
        const penaltyRate = payroll?.penaltyDetails?.amount || 500;
        const penaltyAmount = lateCheckoutMinutes * penaltyRate;
        timeTracking.penalties.unauthorized = {
          amount: penaltyAmount,
          reason: `Уход после окончания смены на ${lateCheckoutMinutes} минут`
        };
      }
      
      
      await timeTracking.save();
    }
    
    return { shift, timeTracking, message: 'Успешно отмечен уход' };
  }

  async getTimeTrackingRecords(filters: { staffId?: string, startDate?: string, endDate?: string }, userId: string, role: string) {
    const filter: any = {};
    
    if (role === 'teacher' || role === 'assistant') {
      filter.staffId = userId;
    } else if (filters.staffId) {
      filter.staffId = filters.staffId;
    }
    
    if (filters.startDate && filters.endDate) {
      filter.date = {
        $gte: filters.startDate,
        $lte: filters.endDate
      };
    }
    
    const records = await StaffAttendanceTracking.find(filter)
      .populate('staffId', 'fullName role')
      .populate('shiftId')
      .sort({ date: -1 });
    
    return records;
  }

  async updateAdjustments(id: string, penalties: any, bonuses: any, notes: string, userId: string) {
    const record = await StaffAttendanceTracking.findByIdAndUpdate(
      id,
      {
        penalties,
        bonuses,
        notes,
        approvedBy: userId,
        approvedAt: new Date()
      },
      { new: true }
    ).populate('staffId', 'fullName role');
    
    if (!record) {
      throw new Error('Запись не найдена');
    }
    
    return record;
  }
  
  /**
   * Проверить, является ли дата смены праздничной
   */
  async isShiftDateHoliday(shiftDate: string): Promise<boolean> {
    const date = new Date(shiftDate);
    return await holidaysService.isHoliday(date);
  }
}