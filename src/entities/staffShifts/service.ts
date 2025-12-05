import mongoose, { Types } from 'mongoose';
import { IShift } from './model';
import Shift from './model';
import StaffAttendanceTracking from '../staffAttendanceTracking/model';
import User from '../../entities/users/model';
import { SettingsService } from '../settings/service';
import Payroll from '../payroll/model';
import { HolidaysService } from '../holidays/service';

const settingsService = new SettingsService();
const holidaysService = new HolidaysService();

export class ShiftsService {
  // Helper function to calculate distance between two coordinates
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in meters
 }
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
    
    const shifts = await Shift().find(filter)
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
 
 // Если статус не указан, устанавливаем его в 'pending_approval' для новых смен,
 // если смена создается не администратором или не указана необходимость подтверждения
 if (!shiftData.status) {
   shiftData.status = 'pending_approval';
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
  const existingShift = await Shift().findOne({
    staffId: newShiftData.staffId,
    date: newShiftData.date,
    _id: { $ne: newShiftData._id } // Исключаем текущую смену при обновлении
  });
  
  if (existingShift) {
    throw new Error('У сотрудника уже есть смена в этот день');
  }
  
  const shift = new (Shift())(newShiftData);
  await shift.save();
  
  const populatedShift = await Shift().findById(shift._id)
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
        const existingShift = await Shift().findOne({
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
          newShiftData.status = 'pending_approval';
        }
        
        const shift = new (Shift())(newShiftData);
        await shift.save();
        
        const populatedShift = await Shift().findById(shift._id)
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
    const shift = await Shift().findById(id);
    
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
      
      const existingShift = await Shift().findOne({
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
    
    // Если статус изменяется с 'pending_approval' на 'scheduled', это означает одобрение смены
    if (shift.status === 'pending_approval' && data.status === 'scheduled') {
      // При одобрении смены обновляем createdBy на текущего пользователя
      // Это позволяет отследить, кто одобрил смену
      data.createdBy = data.createdBy || shift.createdBy; // Сохраняем оригинального создателя, если не указан новый
    }
    
    // Обновляем только указанные поля, избегая перезаписи служебных полей
    const allowedFields = [
      'date', 'startTime', 'endTime', 'status', 'breakTime', 'overtimeMinutes',
      'lateMinutes', 'earlyLeaveMinutes', 'notes', 'createdBy', 'alternativeStaffId'
    ];
    
    for (const field of allowedFields) {
      if (data.hasOwnProperty(field)) {
        shift.set(field, data[field]);
      }
    }
    
    // Сохраним, чтобы запустить middleware
    await shift.save();
    
    // Заполним связанные данные
    await shift.populate('staffId', 'fullName role');
    await shift.populate('createdBy', 'fullName');
    
    return shift;
}

  async delete(id: string) {
    const shift = await Shift().findByIdAndDelete(id);
    
    if (!shift) {
      throw new Error('Смена не найдена');
    }
    return shift;
  }

  async checkIn(shiftId: string, userId: string, role: string, locationData?: { latitude: number, longitude: number }) {
    // First try to find shift by shiftId if provided
    let shift = null;
    
    if (shiftId) {
      try {
        shift = await Shift().findById(shiftId);
        // Verify that this shift belongs to the user (security check)
        if (shift && !shift.staffId.equals(new mongoose.Types.ObjectId(userId)) &&
            (!shift.alternativeStaffId || !shift.alternativeStaffId.equals(new mongoose.Types.ObjectId(userId))) &&
            role !== 'admin' && role !== 'teacher') {
          shift = null; // Reset if user doesn't have permission
        }
      } catch (e) {
        // If shiftId is invalid, continue to search by date
        console.error('Error finding shift by ID:', e);
      }
    }
    
    // If not found by ID, search by userId and date (fallback)
    if (!shift) {
      const today = new Date().toISOString().split('T')[0];
      shift = await Shift().findOne({
        date: today,
        $or: [
          { staffId: new mongoose.Types.ObjectId(userId) },
          { alternativeStaffId: new mongoose.Types.ObjectId(userId) }
        ]
      });
    }
    
    if (!shift) {
      throw new Error('Смена не найдена на сегодня. Убедитесь, что смена запланирована.');
    }
     // Check if user can check in to this shift
     if (!shift.staffId.equals(new Types.ObjectId(userId)) &&
         (!shift.alternativeStaffId || !shift.alternativeStaffId.equals(new Types.ObjectId(userId))) &&
         role !== 'admin') {
       throw new Error('Нет прав для отметки в этой смене');
     }
     
     // Проверяем геолокацию пользователя, если она передана
     if (locationData) {
       const geoSettings = await settingsService.getGeolocationSettings();
       if (geoSettings && geoSettings.enabled) {
         // Вычисляем расстояние между текущей позицией и заданными координатами
         const distance = this.calculateDistance(
           locationData.latitude,
           locationData.longitude,
           geoSettings.coordinates.latitude,
           geoSettings.coordinates.longitude
         );
         
         if (distance > geoSettings.radius) {
           throw new Error(`Вы находитесь вне геозоны. Разрешено в радиусе ${geoSettings.radius} метров.`);
         }
       }
     }
     
     // Получаем настройки детского сада для определения часового пояса
     const settings = await settingsService.getKindergartenSettings();
     const timezone = settings?.timezone || 'Asia/Almaty'; // По умолчанию используем Астану
     
     // Создаем дату с учетом часового пояса
     const now = new Date();
     const currentTime = now.toLocaleTimeString('en-GB', { timeZone: timezone }).slice(0, 5);
     
     // Calculate schedule boundaries
     const shiftStartTime = new Date(`${shift.date} ${shift.startTime}`);
     const shiftEndTime = new Date(`${shift.date} ${shift.endTime}`);
     const actualStartTime = new Date(`${shift.date} ${currentTime}`);
     
     // Calculate lateness based on shift start time (15 minutes threshold)
     const lateMinutes = Math.max(0, Math.floor((actualStartTime.getTime() - shiftStartTime.getTime()) / (1000 * 60)));
     
     // If employee is late by 15 minutes or more, mark shift as 'late'
     if (lateMinutes >= 15) {
       shift.set('status', 'late');
     } else {
       // If trying to check in after shift end, mark as in_progress since they did come
       if (actualStartTime.getTime() > shiftEndTime.getTime()) {
         shift.set('status', 'in_progress');
         await shift.save();
         
         let timeTracking = await StaffAttendanceTracking().findOne({
           staffId: userId,
           date: shift.date
         });
         
         if (!timeTracking) {
           timeTracking = new (StaffAttendanceTracking())({
             staffId: userId,
             date: shift.date
           });
         }
         timeTracking.actualStart = now;
         // Optionally annotate reason
         timeTracking.notes = timeTracking.notes
           ? `${timeTracking.notes}\nОтметка после окончания смены`
           : 'Отметка после окончания смены';
         await timeTracking.save();
         
         return { shift, timeTracking, message: 'Отметка после окончания смены. Смена помечена как начатая.' };
       }
      
      // Update shift as in-progress
      shift.set('status', 'in_progress');
     }
    
    // Обновляем статус в базе данных
    await shift.save();
    
    // Create or update time tracking record
    let timeTracking = await StaffAttendanceTracking().findOne({
      staffId: userId,
      date: shift.date
    });
    
    if (!timeTracking) {
      timeTracking = new (StaffAttendanceTracking())({
        staffId: userId,
        date: shift.date
      });
    }
    
    // Сохраняем время с учетом часового пояса Астаны
    const astanaTime = new Date(now.toLocaleString("en-US", {timeZone: timezone}));
    timeTracking.actualStart = astanaTime;
    
    // Calculate late penalty based on payroll settings
    if (lateMinutes > 0) {
      // Получаем настройки зарплаты сотрудника
      const payroll = await Payroll().findOne({ staffId: userId });
      const penaltyRate = payroll?.penaltyDetails?.amount || 50; // По умолчанию 50 тенге за минуту
      
      const penaltyAmount = lateMinutes * penaltyRate;
      timeTracking.penalties.late = {
        minutes: lateMinutes,
        amount: penaltyAmount,
        reason: `Опоздание на ${lateMinutes} минут`
      };
      timeTracking.lateMinutes = lateMinutes;
    }
    
    await timeTracking.save();
    
    return { shift, timeTracking, message: lateMinutes >= 15 ? 'Опоздание на смену' : 'Успешно отмечен приход' };
  }

  async checkOut(shiftId: string, userId: string, role: string, locationData?: { latitude: number, longitude: number }) {
    // First try to find shift by shiftId if provided
    let shift = null;
    
    if (shiftId) {
      try {
        shift = await Shift().findById(shiftId);
        // Verify that this shift belongs to the user (security check)
        if (shift && !shift.staffId.equals(new mongoose.Types.ObjectId(userId)) &&
            (!shift.alternativeStaffId || !shift.alternativeStaffId.equals(new mongoose.Types.ObjectId(userId))) &&
            role !== 'admin' && role !== 'manager') {
          shift = null; // Reset if user doesn't have permission
        }
      } catch (e) {
        // If shiftId is invalid, continue to search by date
        console.error('Error finding shift by ID:', e);
      }
    }
    
    // If not found by ID, search by userId and date (fallback)
    if (!shift) {
      const today = new Date().toISOString().split('T')[0];
      shift = await Shift().findOne({
        date: today,
        $or: [
          { staffId: new mongoose.Types.ObjectId(userId) },
          { alternativeStaffId: new mongoose.Types.ObjectId(userId) }
        ]
      });
    }
    
    if (!shift) {
      throw new Error('Смена не найдена на сегодня. Убедитесь, что смена запланирована.');
    }
    
    if (!shift.staffId.equals(new Types.ObjectId(userId)) &&
        (!shift.alternativeStaffId || !shift.alternativeStaffId.equals(new Types.ObjectId(userId))) &&
        role !== 'admin') {
      throw new Error('Нет прав для отметки в этой смене');
    }
    
    // Получаем настройки детского сада для определения часового пояса
    const settings = await settingsService.getKindergartenSettings();
    const timezone = settings?.timezone || 'Asia/Almaty'; // По умолчанию используем Астану
    
    // Создаем дату с учетом часового пояса
    const now = new Date();
    const currentTime = now.toLocaleTimeString('en-GB', { timeZone: timezone }).slice(0, 5);
    
    // Update shift
    shift.set('status', 'completed');
    
    await shift.save();
    
    // Update time tracking
    const timeTracking = await StaffAttendanceTracking().findOne({
      staffId: userId,
      date: shift.date
    });
    
    if (timeTracking) {
      // Сохраняем время ухода с учетом часового пояса Астаны
      const astanaTime = new Date(now.toLocaleString("en-US", {timeZone: timezone}));
      timeTracking.actualEnd = astanaTime;
      // Calculate work duration manually
      if (timeTracking.actualStart) {
        const duration = astanaTime.getTime() - timeTracking.actualStart.getTime();
        timeTracking.workDuration = Math.floor(duration / (1000 * 60)) - (timeTracking.breakDuration || 0);
      }
      
      // Calculate schedule boundaries for penalties
      const shiftStartTime = new Date(`${shift.date} ${shift.startTime}`);
      const shiftEndTime = new Date(`${shift.date} ${shift.endTime}`);
      const actualStartTime = new Date(`${shift.date} ${timeTracking.actualStart?.toLocaleTimeString('en-GB', { timeZone: timezone }).slice(0, 5) || currentTime}`);
      const actualEndTime = new Date(`${shift.date} ${currentTime}`);
      
      // Calculate early leave based on shift end time
      const earlyMinutes = Math.max(0, Math.floor((shiftEndTime.getTime() - actualEndTime.getTime()) / (1000 * 60)));
      
      // Calculate late arrival based on shift start time
      const lateMinutes = Math.max(0, Math.floor((actualStartTime.getTime() - shiftStartTime.getTime()) / (1000 * 60)));
      
      // Calculate early leave penalty based on payroll settings
      if (earlyMinutes > 0) {
        // Получаем настройки зарплаты сотрудника
        const payroll = await Payroll().findOne({ staffId: userId });
        const penaltyRate = payroll?.penaltyDetails?.amount || 500; // По умолчанию 500 тенге за минуту
        
        const penaltyAmount = earlyMinutes * penaltyRate;
        timeTracking.penalties.earlyLeave = {
          minutes: earlyMinutes,
          amount: penaltyAmount,
          reason: `Ранний уход на ${earlyMinutes} минут`
        };
        timeTracking.earlyLeaveMinutes = earlyMinutes;
      }
      
      // Calculate late arrival penalty based on payroll settings
      if (lateMinutes > 0) {
        // Получаем настройки зарплаты сотрудника
        const payroll = await Payroll().findOne({ staffId: userId });
        const penaltyRate = payroll?.penaltyDetails?.amount || 50; // По умолчанию 50 тенге за минуту
        
        const penaltyAmount = lateMinutes * penaltyRate;
        timeTracking.penalties.late = {
          minutes: lateMinutes,
          amount: penaltyAmount,
          reason: `Опоздание на ${lateMinutes} минут`
        };
        timeTracking.lateMinutes = lateMinutes;
      }
      
      // Penalty for late checkout (after scheduled end) - does not count for payroll
      const lateCheckoutMinutes = Math.max(0, Math.floor((actualEndTime.getTime() - shiftEndTime.getTime()) / (1000 * 60)));
      if (lateCheckoutMinutes > 0) {
        const payroll = await Payroll().findOne({ staffId: userId });
        const penaltyRate = payroll?.penaltyDetails?.amount || 500;
        const penaltyAmount = lateCheckoutMinutes * penaltyRate;
        timeTracking.penalties.unauthorized = {
          amount: penaltyAmount,
          reason: `Уход после окончания смены на ${lateCheckoutMinutes} минут`
        };
      }
      
      await timeTracking.save();
    }
    
    // Проверяем геолокацию пользователя, если она передана
    if (locationData) {
      const geoSettings = await settingsService.getGeolocationSettings();
      if (geoSettings && geoSettings.enabled) {
        // Вычисляем расстояние между текущей позицией и заданными координатами
        const distance = this.calculateDistance(
          locationData.latitude,
          locationData.longitude,
          geoSettings.coordinates.latitude,
          geoSettings.coordinates.longitude
        );
        
        if (distance > geoSettings.radius) {
          throw new Error(`Вы находитесь вне геозоны. Разрешено в радиусе ${geoSettings.radius} метров.`);
        }
      }
    }
    
    return { shift, message: 'Успешно отмечен уход' }; // timeTracking as any,
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
    
    const records = await StaffAttendanceTracking().find(filter)
      .populate('staffId', 'fullName role')
      .populate('shiftId')
      .sort({ date: -1 });
    
    return records;
  }

  async updateAdjustments(id: string, penalties: any, bonuses: any, notes: string, userId: string) {
    const record = await StaffAttendanceTracking().findByIdAndUpdate(
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
  
  /**
   * Автоматически обновить статус смены на 'late', если сотрудник опоздал более чем на 15 минут
   */
 async updateLateShifts() {
    try {
      // Получаем все смены за сегодня со статусом 'scheduled' или 'in_progress'
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD
      
      const shifts = await Shift().find({
        date: todayStr,
        status: { $in: ['scheduled', 'in_progress'] }
      });
      
      const results = [];
      
      for (const shift of shifts) {
        // Получаем время начала смены
        const shiftStartTime = new Date(`${shift.date} ${shift.startTime}`);
        
        // Проверяем, прошло ли 15 и более минут после начала смены
        const timeSinceShiftStart = (today.getTime() - shiftStartTime.getTime()) / (1000 * 60); // в минутах
        
        // Если прошло 15 и более минут после начала смены, и сотрудник еще не пришел (не отметил check-in)
        if (timeSinceShiftStart >= 15) {
          // Проверяем, есть ли уже запись о приходе
          const timeTracking = await StaffAttendanceTracking().findOne({
            staffId: shift.staffId,
            date: new Date(shift.date) // Преобразуем строку даты в объект Date
          });
          
          if (!timeTracking || !timeTracking.actualStart) {
            // Если нет отметки о приходе, и прошло 15+ минут после начала смены,
            // меняем статус смены на 'late'
            shift.set('status', 'late');
            await shift.save();
            results.push({
              shiftId: shift._id,
              staffId: shift.staffId,
              message: 'Статус смены обновлен на "late" из-за опоздания'
            });
          }
        }
      }
      
      return results;
    } catch (error) {
      console.error('Ошибка при обновлении статусов опоздавших смен:', error);
      throw error;
    }
  }
}
