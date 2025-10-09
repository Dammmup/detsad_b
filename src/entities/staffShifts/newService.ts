import { IStaffShift, IShiftEntry } from './newModel';
import StaffShift from './newModel';
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
    
    // Filter shifts by date if specified
    if (filters.date) {
      const dateStr = new Date(filters.date).toISOString().split('T')[0]; // YYYY-MM-DD format
      
      return shifts.map(shift => {
        const filteredShifts: { [date: string]: IShiftEntry } = {};
        if (shift.shifts[dateStr]) {
          filteredShifts[dateStr] = shift.shifts[dateStr];
        }
        return {
          ...shift.toObject(),
          shifts: filteredShifts
        };
      }).filter(shift => Object.keys(shift.shifts).length > 0);
    }
    
    // Filter shifts by date range if specified
    if (filters.startDate && filters.endDate) {
      const startDate = new Date(filters.startDate);
      const endDate = new Date(filters.endDate);
      
      return shifts.map(shift => {
        const filteredShifts: { [date: string]: IShiftEntry } = {};
        
        for (const [dateStr, shiftEntry] of Object.entries(shift.shifts)) {
          const shiftDate = new Date(dateStr);
          if (shiftDate >= startDate && shiftDate <= endDate) {
            filteredShifts[dateStr] = shiftEntry;
          }
        }
        
        return {
          ...shift.toObject(),
          shifts: filteredShifts
        };
      }).filter(shift => Object.keys(shift.shifts).length > 0);
    }
    
    // Filter by status if specified
    if (filters.status) {
      return shifts.map(shift => {
        const filteredShifts: { [date: string]: IShiftEntry } = {};
        
        for (const [dateStr, shiftEntry] of Object.entries(shift.shifts)) {
          if (shiftEntry.status === filters.status) {
            filteredShifts[dateStr] = shiftEntry;
          }
        }
        
        return {
          ...shift.toObject(),
          shifts: filteredShifts
        };
      }).filter(shift => Object.keys(shift.shifts).length > 0);
    }
    
    return shifts;
 }

  async create(shiftData: any, userId: string) {
    // Convert date to YYYY-MM-DD format for the key
    const dateStr = new Date(shiftData.date).toISOString().split('T')[0];
    
    // Find existing shift record for this staff member
    let staffShift = await StaffShift.findOne({ staffId: shiftData.staffId });
    
    if (staffShift) {
      // Update existing record
      if (!staffShift.shifts) {
        staffShift.shifts = {};
      }
      staffShift.shifts[dateStr] = {
        date: dateStr,
        shiftType: shiftData.type || shiftData.shiftType,
        startTime: shiftData.startTime,
        endTime: shiftData.endTime,
        actualStart: shiftData.actualStart,
        actualEnd: shiftData.actualEnd,
        status: shiftData.status || 'scheduled',
        breakTime: shiftData.breakTime || 0,
        overtimeMinutes: shiftData.overtimeMinutes || 0,
        lateMinutes: shiftData.lateMinutes || 0,
        earlyLeaveMinutes: shiftData.earlyLeaveMinutes || 0,
        notes: shiftData.notes
      };
      await staffShift.save();
    } else {
      // Create new record
      const newShiftData = {
        staffId: shiftData.staffId,
        shifts: {
          [dateStr]: {
            date: dateStr,
            shiftType: shiftData.type || shiftData.shiftType,
            startTime: shiftData.startTime,
            endTime: shiftData.endTime,
            actualStart: shiftData.actualStart,
            actualEnd: shiftData.actualEnd,
            status: shiftData.status || 'scheduled',
            breakTime: shiftData.breakTime || 0,
            overtimeMinutes: shiftData.overtimeMinutes || 0,
            lateMinutes: shiftData.lateMinutes || 0,
            earlyLeaveMinutes: shiftData.earlyLeaveMinutes || 0,
            notes: shiftData.notes
          }
        },
        createdBy: userId
      };
      
      staffShift = new StaffShift(newShiftData);
      await staffShift.save();
    }
    
    const populatedShift = await StaffShift.findById(staffShift._id)
      .populate('staffId', 'fullName role')
      .populate('createdBy', 'fullName');
    
    return populatedShift;
  }

 async bulkCreate(shiftsData: any[], userId: string) {
   const createdShifts = [];
   const errors = [];
   
   // Group shifts by staffId
   const shiftsByStaff: { [staffId: string]: any[] } = {};
   
   for (const shiftData of shiftsData) {
     const staffId = shiftData.staffId;
     if (!shiftsByStaff[staffId]) {
       shiftsByStaff[staffId] = [];
     }
     shiftsByStaff[staffId].push(shiftData);
   }
   
   // Process each staff member's shifts
   for (const [staffId, staffShifts] of Object.entries(shiftsByStaff)) {
     try {
       // Find existing shift record for this staff member
       let staffShift = await StaffShift.findOne({ staffId });
       
       if (staffShift) {
         // Update existing record
         if (!staffShift.shifts) {
           staffShift.shifts = {};
         }
         
         // Add all shifts to existing record
         for (const shiftData of staffShifts) {
           const dateStr = new Date(shiftData.date).toISOString().split('T')[0];
           staffShift.shifts[dateStr] = {
             date: dateStr,
             shiftType: shiftData.type || shiftData.shiftType,
             startTime: shiftData.startTime,
             endTime: shiftData.endTime,
             actualStart: shiftData.actualStart,
             actualEnd: shiftData.actualEnd,
             status: shiftData.status || 'scheduled',
             breakTime: shiftData.breakTime || 0,
             overtimeMinutes: shiftData.overtimeMinutes || 0,
             lateMinutes: shiftData.lateMinutes || 0,
             earlyLeaveMinutes: shiftData.earlyLeaveMinutes || 0,
             notes: shiftData.notes
           };
         }
         
         await staffShift.save();
         createdShifts.push(staffShift);
       } else {
         // Create new record with all shifts
         const newShifts: { [date: string]: any } = {};
         
         for (const shiftData of staffShifts) {
           const dateStr = new Date(shiftData.date).toISOString().split('T')[0];
           newShifts[dateStr] = {
             date: dateStr,
             shiftType: shiftData.type || shiftData.shiftType,
             startTime: shiftData.startTime,
             endTime: shiftData.endTime,
             actualStart: shiftData.actualStart,
             actualEnd: shiftData.actualEnd,
             status: shiftData.status || 'scheduled',
             breakTime: shiftData.breakTime || 0,
             overtimeMinutes: shiftData.overtimeMinutes || 0,
             lateMinutes: shiftData.lateMinutes || 0,
             earlyLeaveMinutes: shiftData.earlyLeaveMinutes || 0,
             notes: shiftData.notes
           };
         }
         
         const newShiftData = {
           staffId,
           shifts: newShifts,
           createdBy: userId
         };
         
         staffShift = new StaffShift(newShiftData);
         await staffShift.save();
         createdShifts.push(staffShift);
       }
     } catch (err: any) {
       errors.push({
         staffId,
         shifts: staffShifts,
         error: err.message || 'Ошибка создания смен'
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
    const staffShift = await StaffShift.findById(id);
    
    if (!staffShift) {
      throw new Error('Запись смены не найдена');
    }
    
    // Update specific shift entry by date
    if (data.date && data.updateData) {
      const dateStr = new Date(data.date).toISOString().split('T')[0];
      
      if (!staffShift.shifts[dateStr]) {
        throw new Error('Смена на указанную дату не найдена');
      }
      
      // Update only the specified fields
      Object.assign(staffShift.shifts[dateStr], data.updateData);
      await staffShift.save();
    } else if (data.shifts && typeof data.shifts === 'object') {
      // Update multiple shifts at once
      for (const [dateStr, shiftUpdate] of Object.entries(data.shifts as { [date: string]: any })) {
        if (!staffShift.shifts[dateStr]) {
          staffShift.shifts[dateStr] = {
            date: dateStr,
            shiftType: 'full',
            startTime: '00:00',
            endTime: '00:00',
            status: 'scheduled'
          };
        }
        
        Object.assign(staffShift.shifts[dateStr], shiftUpdate);
      }
      await staffShift.save();
    } else {
      // Update the entire document if no specific date provided
      Object.assign(staffShift, data);
      await staffShift.save();
    }
    
    const populatedShift = await StaffShift.findById(staffShift._id)
      .populate('staffId', 'fullName role');
    
    return populatedShift;
  }

 async checkIn(shiftId: string, userId: string, role: string) {
    // Find the staff shift document
    const staffShift = await StaffShift.findById(shiftId);
    if (!staffShift) {
      throw new Error('Запись смены не найдена');
    }
    
    // Find the staff member to get their ID
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('Пользователь не найден');
    }
    
    // Find the shift for today
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    const shift = staffShift.shifts[dateStr];
    
    if (!shift) {
      throw new Error('Смена на сегодня не найдена');
    }
    
    // Check if user can check in to this shift
    if (staffShift.staffId.toString() !== userId && role !== 'admin') {
      throw new Error('Нет прав для отметки в этой смене');
    }
    
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);
    
    // Update shift
    shift.actualStart = currentTime;
    shift.status = 'in_progress';
    
    // Calculate lateness
    const startTime = new Date(`${today.toDateString()} ${shift.startTime}`);
    const lateMinutes = Math.max(0, Math.floor((now.getTime() - startTime.getTime()) / (1000 * 60)));
    
    if (lateMinutes > 0) {
      shift.lateMinutes = lateMinutes;
    }
    
    await staffShift.save();
    
    // Create or update time tracking record
    let timeTracking = await StaffAttendanceTracking.findOne({
      staffId: userId,
      date: dateStr,
      shiftId: staffShift._id
    });
    
    if (!timeTracking) {
      timeTracking = new StaffAttendanceTracking({
        staffId: userId,
        shiftId: staffShift._id,
        date: dateStr
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
    
    return { shift: staffShift, timeTracking, message: 'Успешно отмечен приход' };
  }

  async checkOut(shiftId: string, userId: string, role: string) {
    // Find the staff shift document
    const staffShift = await StaffShift.findById(shiftId);
    if (!staffShift) {
      throw new Error('Запись смены не найдена');
    }
    
    // Find the staff member to get their ID
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('Пользователь не найден');
    }
    
    // Find the shift for today
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    const shift = staffShift.shifts[dateStr];
    
    if (!shift) {
      throw new Error('Смена на сегодня не найдена');
    }
    
    if (staffShift.staffId.toString() !== userId && role !== 'admin') {
      throw new Error('Нет прав для отметки в этой смене');
    }
    
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);
    
    // Update shift
    shift.actualEnd = currentTime;
    shift.status = 'completed';
    
    // Calculate early leave
    const endTime = new Date(`${today.toDateString()} ${shift.endTime}`);
    const earlyMinutes = Math.max(0, Math.floor((endTime.getTime() - now.getTime()) / (1000 * 60)));
    
    if (earlyMinutes > 0) {
      shift.earlyLeaveMinutes = earlyMinutes;
    }
    
    // Calculate overtime
    const overtimeMinutes = Math.max(0, Math.floor((now.getTime() - endTime.getTime()) / (1000 * 60)));
    if (overtimeMinutes > 0) {
      shift.overtimeMinutes = overtimeMinutes;
    }
    
    await staffShift.save();
    
    // Update time tracking
    const timeTracking = await StaffAttendanceTracking.findOne({
      staffId: userId,
      date: dateStr,
      shiftId: staffShift._id
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
    
    return { shift: staffShift, timeTracking, message: 'Успешно отмечен уход' };
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