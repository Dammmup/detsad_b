import { ISimpleShift } from './simpleModel';
import SimpleShift from './simpleModel';
import StaffAttendanceTracking from '../staffAttendanceTracking/model';
import User from '../auth/model';

export class SimpleShiftsService {
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
    
    const shifts = await SimpleShift.find(filter)
      .populate('staffId', 'fullName role')
      .populate('createdBy', 'fullName')
      .sort({ date: 1, createdAt: -1 });
    
    return shifts;
  }

  async create(shiftData: any, userId: string) {
    // Validate shift data before creating
    if (!shiftData.staffId) {
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
    if (!shiftData.shiftType && !shiftData.type) {
      throw new Error('Не указан тип смены');
    }
    if (!shiftData.status) {
      throw new Error('Не указан статус смены');
    }
    
    const newShiftData = {
      ...shiftData,
      createdBy: userId,
      shiftType: shiftData.type || shiftData.shiftType
    };
    
    // Удаляем поле type, если оно существует, чтобы избежать конфликта
    delete newShiftData.type;
    
    const shift = new SimpleShift(newShiftData);
    await shift.save();
    
    const populatedShift = await SimpleShift.findById(shift._id)
      .populate('staffId', 'fullName role')
      .populate('createdBy', 'fullName');
    
    return populatedShift;
  }

  async bulkCreate(shiftsData: any[], userId: string) {
    const createdShifts = [];
    const errors = [];
    
    for (const shiftData of shiftsData) {
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
        
        const shift = new SimpleShift(newShiftData);
        await shift.save();
        
        const populatedShift = await SimpleShift.findById(shift._id)
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
    const shift = await SimpleShift.findByIdAndUpdate(
      id,
      data,
      { new: true }
    ).populate('staffId', 'fullName role');
    
    if (!shift) {
      throw new Error('Смена не найдена');
    }
    
    return shift;
 }

  async delete(id: string) {
    const shift = await SimpleShift.findByIdAndDelete(id);
    
    if (!shift) {
      throw new Error('Смена не найдена');
    }
    
    return shift;
  }

 async checkIn(shiftId: string, userId: string, role: string) {
    const shift = await SimpleShift.findById(shiftId);
    if (!shift) {
      throw new Error('Смена не найдена');
    }
    
    // Check if user can check in to this shift
    if (shift.staffId.toString() !== userId && role !== 'admin') {
      throw new Error('Нет прав для отметки в этой смене');
    }
    
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);
    
    // Update shift
    shift.actualStart = currentTime;
    shift.status = 'in_progress';
    
    // Calculate lateness
    const startTime = new Date(`${shift.date} ${shift.startTime}`);
    const lateMinutes = Math.max(0, Math.floor((now.getTime() - startTime.getTime()) / (1000 * 60)));
    
    if (lateMinutes > 0) {
      shift.lateMinutes = lateMinutes;
    }
    
    await shift.save();
    
    // Create or update time tracking record
    let timeTracking = await StaffAttendanceTracking.findOne({
      staffId: userId,
      date: shift.date,
      shiftId: shift._id
    });
    
    if (!timeTracking) {
      timeTracking = new StaffAttendanceTracking({
        staffId: userId,
        shiftId: shift._id,
        date: shift.date
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
    const shift = await SimpleShift.findById(shiftId);
    if (!shift) {
      throw new Error('Смена не найдена');
    }
    
    if (shift.staffId.toString() !== userId && role !== 'admin') {
      throw new Error('Нет прав для отметки в этой смене');
    }
    
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);
    
    // Update shift
    shift.actualEnd = currentTime;
    shift.status = 'completed';
    
    // Calculate early leave
    const endTime = new Date(`${shift.date} ${shift.endTime}`);
    const earlyMinutes = Math.max(0, Math.floor((endTime.getTime() - now.getTime()) / (1000 * 60)));
    
    if (earlyMinutes > 0) {
      shift.earlyLeaveMinutes = earlyMinutes;
    }
    
    // Calculate overtime
    const overtimeMinutes = Math.max(0, Math.floor((now.getTime() - endTime.getTime()) / (1000 * 60)));
    if (overtimeMinutes > 0) {
      shift.overtimeMinutes = overtimeMinutes;
    }
    
    await shift.save();
    
    // Update time tracking
    const timeTracking = await StaffAttendanceTracking.findOne({
      staffId: userId,
      date: shift.date,
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