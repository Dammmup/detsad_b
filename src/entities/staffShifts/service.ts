import { IStaffShift } from './model';
import StaffShift from './model';
import StaffAttendanceTracking from '../staffAttendanceTracking/model'; // Assuming StaffAttendanceTracking model exists
import User from '../auth/model'; // Using the user model

export class StaffShiftsService {
  async getAll(filters: { staffId?: string, date?: string, status?: string, startDate?: string, endDate?: string }, userId: string, role: string) {
    const filter: any = {};
    
    // Role-based filtering
    if (role === 'teacher' || role === 'assistant') {
      filter.staffId = userId;
    } else if (filters.staffId) {
      filter.staffId = filters.staffId;
    }
    
    const shifts = await StaffShift.find(filter)
      .populate('staffId', 'fullName role')
      .populate('createdBy', 'fullName')
      .sort({ createdAt: -1 });
    
    // Фильтруем смены по дате, если указаны фильтры
    if (filters.date || (filters.startDate && filters.endDate)) {
      return shifts.map(shift => {
        const filteredShifts: { [date: string]: any } = {};
        
        for (const [date, shiftEntry] of Object.entries(shift.shifts)) {
          // Проверяем, удовлетворяет ли дата условиям фильтрации
          let includeDate = true;
          
          if (filters.date && date !== filters.date) {
            includeDate = false;
          }
          
          if (filters.startDate && date < filters.startDate) {
            includeDate = false;
          }
          
          if (filters.endDate && date > filters.endDate) {
            includeDate = false;
          }
          
          if (filters.status && shiftEntry.status !== filters.status) {
            includeDate = false;
          }
          
          if (includeDate) {
            filteredShifts[date] = shiftEntry;
          }
        }
        
        // Возвращаем копию с отфильтрованными сменами
        return {
          ...shift.toObject(),
          shifts: filteredShifts
        };
      }).filter(shift => Object.keys(shift.shifts).length > 0);
    }
    
    return shifts;
  }

  async create(shiftData: any, userId: string) {
    // Проверяем, является ли формат данных старым (с объектом shifts)
    if (shiftData.shifts && typeof shiftData.shifts === 'object') {
      // Это старый формат - создаем несколько смен
      const createdShifts = [];
      const errors = [];
      
      const { staffId, shifts } = shiftData;
      
      for (const [date, shiftEntry] of Object.entries(shifts as { [date: string]: any })) {
        try {
          const newShiftData = {
            staffId,
            date,
            ...shiftEntry,
            createdBy: userId,
            shiftType: shiftEntry.type || shiftEntry.shiftType
          };
          
          // Удаляем поле type, если оно существует, чтобы избежать конфликта
          delete newShiftData.type;
          
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
          if (!newShiftData.shiftType) {
            throw new Error('Не указан тип смены');
          }
          if (!newShiftData.status) {
            throw new Error('Не указан статус смены');
          }
          
          const shift = new StaffShift(newShiftData);
          await shift.save();
          
          const populatedShift = await StaffShift.findById(shift._id)
            .populate('staffId', 'fullName role')
            .populate('createdBy', 'fullName');
          
          createdShifts.push(populatedShift);
        } catch (err: any) {
          errors.push({
            date,
            error: err.message || 'Ошибка создания смены'
          });
        }
      }
      
      if (errors.length > 0) {
        throw new Error(`Создано частично. Ошибки: ${errors.map(e => e.error).join('; ')}`);
      }
      
      return createdShifts;
    } else {
      // Это новый формат - создаем одну смену
      const newShiftData = {
        ...shiftData,
        createdBy: userId,
        shiftType: shiftData.type || shiftData.shiftType
      };
      
      // Удаляем поле type, если оно существует, чтобы избежать конфликта
      delete newShiftData.type;
      
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
      if (!newShiftData.shiftType) {
        throw new Error('Не указан тип смены');
      }
      if (!newShiftData.status) {
        throw new Error('Не указан статус смены');
      }
      
      const shift = new StaffShift(newShiftData);
      await shift.save();
      
      const populatedShift = await StaffShift.findById(shift._id)
        .populate('staffId', 'fullName role')
        .populate('createdBy', 'fullName');
      
      return populatedShift;
    }
  }
 
  async bulkCreate(shiftsData: any[], userId: string) {
    const createdShifts = [];
    const errors = [];
    
    for (const shiftData of shiftsData) {
      // Проверяем, является ли формат данных старым (с объектом shifts)
      if (shiftData.shifts && typeof shiftData.shifts === 'object') {
        // Это старый формат - создаем несколько смен для одного сотрудника
        const { staffId, shifts } = shiftData;
        
        for (const [date, shiftEntry] of Object.entries(shifts as { [date: string]: any })) {
          try {
            const newShiftData = {
              staffId,
              date,
              ...shiftEntry,
              createdBy: userId,
              shiftType: shiftEntry.type || shiftEntry.shiftType
            };
            
            // Удаляем поле type, если оно существует, чтобы избежать конфликта
            delete newShiftData.type;
            
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
            if (!newShiftData.shiftType) {
              throw new Error('Не указан тип смены');
            }
            if (!newShiftData.status) {
              throw new Error('Не указан статус смены');
            }
            
            const shift = new StaffShift(newShiftData);
            await shift.save();
            
            const populatedShift = await StaffShift.findById(shift._id)
              .populate('staffId', 'fullName role')
              .populate('createdBy', 'fullName');
            
            createdShifts.push(populatedShift);
          } catch (err: any) {
            errors.push({
              shift: { staffId, date, shiftEntry },
              error: err.message || 'Ошибка создания смены'
            });
          }
        }
      } else {
        // Это новый формат - создаем одну смену
        try {
          const newShiftData = {
            ...shiftData,
            createdBy: userId,
            shiftType: shiftData.type || shiftData.shiftType
          };
          
          // Удаляем поле type, если оно существует, чтобы избежать конфликта
          delete newShiftData.type;
          
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
          if (!newShiftData.shiftType) {
            throw new Error('Не указан тип смены');
          }
          if (!newShiftData.status) {
            throw new Error('Не указан статус смены');
          }
          
          const shift = new StaffShift(newShiftData);
          await shift.save();
          
          const populatedShift = await StaffShift.findById(shift._id)
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
    }
    
    return {
      success: createdShifts.length,
      failed: errors.length,
      errors,
      createdShifts
    };
  }
 
 async update(id: string, data: any) {
   // Если в данных есть объект shifts, обрабатываем как старый формат
   if (data.shifts && typeof data.shifts === 'object') {
     // Обновляем несколько смен
     const updatedShifts = [];
     const errors = [];
     
     const { staffId, shifts } = data;
     
     for (const [date, shiftEntry] of Object.entries(shifts as { [date: string]: any })) {
       try {
         // Находим смену по staffId и дате
         const shift = await StaffShift.findOne({
           staffId: data.staffId,
           date
         });
         
         if (!shift) {
           throw new Error(`Смена не найдена для даты ${date}`);
         }
         
         const updateData = { ...shiftEntry };
         // Удаляем поле type, если оно существует, чтобы избежать конфликта
         delete updateData.type;
         
         const updatedShift = await StaffShift.findByIdAndUpdate(
           shift._id,
           updateData,
           { new: true }
         ).populate('staffId', 'fullName role');
         
         updatedShifts.push(updatedShift);
       } catch (err: any) {
         errors.push({
           date,
           error: err.message || 'Ошибка обновления смены'
         });
       }
     }
     
     if (errors.length > 0) {
       throw new Error(`Обновлено частично. Ошибки: ${errors.map(e => e.error).join('; ')}`);
     }
     
     return updatedShifts;
   } else {
     // Обновляем одну смену
     const shift = await StaffShift.findByIdAndUpdate(
       id,
       data,
       { new: true }
     ).populate('staffId', 'fullName role');
     
     if (!shift) {
       throw new Error('Смена не найдена');
     }
     
     return shift;
   }
 }

  async checkIn(shiftId: string, userId: string, role: string) {
    const shift = await StaffShift.findById(shiftId);
    if (!shift) {
      throw new Error('Смена не найдена');
    }
    
    // Check if user can check in to this shift
    if (shift.staffId.toString() !== userId && role !== 'admin') {
      throw new Error('Нет прав для отметки в этой смене');
    }
    
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);
    const today = now.toISOString().split('T')[0]; // Текущая дата в формате YYYY-MM-DD
    
    // Обновляем смену на сегодняшнюю дату
    if (!shift.shifts[today]) {
      throw new Error(`Смена не найдена для даты ${today}`);
    }
    
    shift.shifts[today].actualStart = currentTime;
    shift.shifts[today].status = 'in_progress';
    
    // Calculate lateness
    const startTime = new Date(`${today} ${shift.shifts[today].startTime}`);
    const lateMinutes = Math.max(0, Math.floor((now.getTime() - startTime.getTime()) / (1000 * 60)));
    
    if (lateMinutes > 0) {
      shift.shifts[today].lateMinutes = lateMinutes;
    }
    
    await shift.save();
    
    // Create or update time tracking record
    let timeTracking = await StaffAttendanceTracking.findOne({
      staffId: userId,
      date: today,
      shiftId: shift._id
    });
    
    if (!timeTracking) {
      timeTracking = new StaffAttendanceTracking({
        staffId: userId,
        shiftId: shift._id,
        date: today
      });
    }
    
    timeTracking.checkInTime = now;
    timeTracking.status = 'checked_in';
    
    // Calculate late penalty
    if (lateMinutes > 0) {
      const penaltyAmount = lateMinutes * 500; // 500 тенге за минуту
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
    const shift = await StaffShift.findById(shiftId);
    if (!shift) {
      throw new Error('Смена не найдена');
    }
    
    if (shift.staffId.toString() !== userId && role !== 'admin') {
      throw new Error('Нет прав для отметки в этой смене');
    }
    
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);
    const today = now.toISOString().split('T')[0]; // Текущая дата в формате YYYY-MM-DD
    
    // Обновляем смену на сегодняшнюю дату
    if (!shift.shifts[today]) {
      throw new Error(`Смена не найдена для даты ${today}`);
    }
    
    shift.shifts[today].actualEnd = currentTime;
    shift.shifts[today].status = 'completed';
    
    // Calculate early leave
    const endTime = new Date(`${today} ${shift.shifts[today].endTime}`);
    const earlyMinutes = Math.max(0, Math.floor((endTime.getTime() - now.getTime()) / (1000 * 60)));
    
    if (earlyMinutes > 0) {
      shift.shifts[today].earlyLeaveMinutes = earlyMinutes;
    }
    
    // Calculate overtime
    const overtimeMinutes = Math.max(0, Math.floor((now.getTime() - endTime.getTime()) / (1000 * 60)));
    if (overtimeMinutes > 0) {
      shift.shifts[today].overtimeMinutes = overtimeMinutes;
    }
    
    await shift.save();
    
    // Update time tracking
    const timeTracking = await StaffAttendanceTracking.findOne({
      staffId: userId,
      date: today,
      shiftId: shift._id
    });
    
    if (timeTracking) {
      timeTracking.checkOutTime = now;
      timeTracking.status = 'checked_out';
      // Calculate work duration manually
      if (timeTracking.checkInTime) {
        const duration = now.getTime() - timeTracking.checkInTime.getTime();
        timeTracking.workDuration = Math.floor(duration / (1000 * 60)) - (timeTracking.breakDuration || 0);
      }
      timeTracking.overtimeDuration = overtimeMinutes;
      
      // Calculate early leave penalty
      if (earlyMinutes > 0) {
        const penaltyAmount = earlyMinutes * 500;
        timeTracking.penalties.earlyLeave = {
          minutes: earlyMinutes,
          amount: penaltyAmount,
          reason: `Ранний уход на ${earlyMinutes} минут`
        };
      }
      
      // Calculate overtime bonus
      if (overtimeMinutes > 0) {
        const bonusAmount = overtimeMinutes * 750; // 750 тенге за минуту сверхурочных
        timeTracking.bonuses.overtime = {
          minutes: overtimeMinutes,
          amount: bonusAmount
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
}