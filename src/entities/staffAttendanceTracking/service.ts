import mongoose from 'mongoose';
import StaffAttendanceTracking from './model';
import { IStaffAttendanceTracking } from './model';
import User from '../users/model'; // Using the user model
import Group from '../groups/model'; // Using the group model
import Shift from '../staffShifts/model'; // Import the shift model to check permissions
import Payroll from '../payroll/model'; // Import the payroll model to check penalties
import { SettingsService } from '../settings/service';
import { sendLogToTelegram } from '../../utils/telegramLogger';

// Отложенное создание моделей
let StaffAttendanceTrackingModel: any = null;
let UserModel: any = null;
let GroupModel: any = null;
let ShiftModel: any = null;
let PayrollModel: any = null;

const getStaffAttendanceTrackingModel = () => {
  if (!StaffAttendanceTrackingModel) {
    StaffAttendanceTrackingModel = StaffAttendanceTracking();
  }
  return StaffAttendanceTrackingModel;
};

const getUserModel = () => {
  if (!UserModel) {
    UserModel = User();
  }
  return UserModel;
};

const getGroupModel = () => {
  if (!GroupModel) {
    GroupModel = Group();
  }
  return GroupModel;
};

const getShiftModel = () => {
  if (!ShiftModel) {
    ShiftModel = Shift();
  }
  return ShiftModel;
};

const getPayrollModel = () => {
  if (!PayrollModel) {
    PayrollModel = Payroll();
  }
  return PayrollModel;
};

export class StaffAttendanceTrackingService {
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

  // Helper function to check if user is within geolocation
  private async isUserInGeolocation(latitude: number, longitude: number): Promise<boolean> {
    const settingsService = new SettingsService();
    const geolocationSettings = await settingsService.getGeolocationSettings();
    
    if (!geolocationSettings || !geolocationSettings.enabled) {
      return true; // If geolocation is not enabled, allow access
    }
    
    const distance = this.calculateDistance(
      latitude,
      longitude,
      geolocationSettings.coordinates.latitude,
      geolocationSettings.coordinates.longitude
    );
    
    return distance <= geolocationSettings.radius;
  }

  async clockIn(userId: string, locationData: { latitude: number, longitude: number }, photo?: string, notes?: string) {
    try {
      const user = await getUserModel().findById(userId);
      if (user) {
        await sendLogToTelegram(`Сотрудник ${user.fullName} отметил приход на работу`);
      }
    } catch (e) {
      console.error('Telegram notify error (clockIn):', e);
    }
    // Check if user already has an active time entry for today
    const today = new Date();
    today.setHours(0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const existingEntry = await getStaffAttendanceTrackingModel().findOne({
      staffId: new mongoose.Types.ObjectId(userId),
      date: { $gte: today, $lt: tomorrow }
    });
    
    if (existingEntry) {
      throw new Error('You already have an active time entry today. Please clock out first.');
    }
    
    // Check if user is in geolocation
    const inZone = await this.isUserInGeolocation(locationData.latitude, locationData.longitude);
    if (!inZone) {
      throw new Error(JSON.stringify({
        error: 'Clock-in not allowed',
        details: 'You are not within the allowed geolocation area for clock-in'
      }));
    }
    
    // Get user details
    const user = await getUserModel().findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    // Create attendance record
    const staffAttendanceTrackingModel = getStaffAttendanceTrackingModel();
    const attendanceRecord = new staffAttendanceTrackingModel({
      staffId: userId,
      date: new Date(),
      actualStart: new Date(),
      clockInLocation: {
        name: 'Current Location',
        coordinates: {
          latitude: locationData.latitude,
          longitude: locationData.longitude
        },
        radius: 10,
        timestamp: new Date()
      },
      photoClockIn: photo,
      notes,
      inZone: inZone
    });
    
    // Calculate lateness if scheduled shift exists
    const scheduledShift = await getShiftModel().findOne({
      staffId: userId,
      date: { $gte: today, $lt: tomorrow }
    });
    
    if (scheduledShift && scheduledShift.startTime) {
      const actualStart = new Date();
      const [hours, minutes] = scheduledShift.startTime.split(':').map(Number);
      
      // Create a date object with the scheduled start time
      const scheduledStart = new Date(actualStart);
      scheduledStart.setHours(hours, minutes, 0, 0);
      
      // Calculate lateness in minutes
      const latenessMs = actualStart.getTime() - scheduledStart.getTime();
      const latenessMinutes = Math.floor(latenessMs / (1000 * 60));
      
      if (latenessMinutes > 0) {
        // Get payroll to determine penalty rate
        const payroll = await getPayrollModel().findOne({ staffId: userId });
        const penaltyRate = payroll?.penaltyDetails?.amount || 500; // Default 500 tenge per minute
        
        const penaltyAmount = latenessMinutes * penaltyRate;
        
        attendanceRecord.penalties.late = {
          minutes: latenessMinutes,
          amount: penaltyAmount,
          reason: `Опоздание на ${latenessMinutes} минут`
        };
      }
    }
    
    await attendanceRecord.save();
    
    await attendanceRecord.populate('staffId', 'fullName role');
    
    try {
      const settingsService = new SettingsService();
      const notificationSettings = await settingsService.getNotificationSettings();
      const adminChatId = notificationSettings?.telegram_chat_id;

      let timeStr = (new Date()).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
      let inRangeText = '';
      if (scheduledShift && scheduledShift.startTime && scheduledShift.endTime) {
        const now = new Date();
        const startT = scheduledShift.startTime.split(':').map(Number);
        const endT = scheduledShift.endTime.split(':').map(Number);
        const nowMin = now.getHours() * 60 + now.getMinutes();
        const stMin = startT[0] * 60 + startT[1] - 30;
        const etMin = endT[0] * 60 + endT[1] + 30;
        const rangeOk = (nowMin >= stMin && nowMin <= etMin);
        inRangeText = rangeOk ? 'В диапазоне смены' : 'ВНЕ диапазона смены';
      } else {
        inRangeText = 'Нет графика смены';
      }

      const message = `Сотрудник ${user.fullName} отметил ПРИХОД на работу ${new Date().toLocaleDateString('ru-RU')} в ${timeStr} (${inRangeText})`;

      // Уведомление сотруднику
      if ((user as any).telegramChatId) {
        await sendLogToTelegram(`Вы отметили ПРИХОД на работу ${new Date().toLocaleDateString('ru-RU')} в ${timeStr} (${inRangeText})`);
      }
      // Уведомление администратору
      if (adminChatId) {
        await sendLogToTelegram(message);
      }
    } catch(e) { console.error('Telegram notify error:',e); }

    return {
      message: 'Successfully clocked in',
      attendanceRecord,
      location: attendanceRecord.clockInLocation?.name
    };
  }

  async clockOut(userId: string, locationData: { latitude: number, longitude: number }, photo?: string, notes?: string) {
    try {
      const user = await getUserModel().findById(userId);
      if (user) {
        await sendLogToTelegram(`Сотрудник ${user.fullName} отметил уход с работы`);
      }
    } catch (e) {
      console.error('Telegram notify error (clockOut):', e);
    }
    // Find today's attendance record
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const attendanceRecord = await getStaffAttendanceTrackingModel().findOne({
      staffId: new mongoose.Types.ObjectId(userId),
      date: { $gte: today, $lt: tomorrow }
    });
    
    if (!attendanceRecord) {
      throw new Error('No active time entry found for today. Please clock in first.');
    }
    
    // Update attendance record
    attendanceRecord.actualEnd = new Date();
    
    // Calculate early leave if scheduled shift exists
    const scheduledShift = await ShiftModel.findOne({
      staffId: userId,
      date: { $gte: today, $lt: tomorrow }
    });
    
    if (scheduledShift && scheduledShift.endTime) {
      const actualEnd = new Date();
      const [hours, minutes] = scheduledShift.endTime.split(':').map(Number);
      
      // Create a date object with the scheduled end time
      const scheduledEnd = new Date(actualEnd);
      scheduledEnd.setHours(hours, minutes, 0, 0);
      
      // Calculate early leave in minutes
      const earlyLeaveMs = scheduledEnd.getTime() - actualEnd.getTime();
      const earlyLeaveMinutes = Math.floor(earlyLeaveMs / (1000 * 60));
      
      if (earlyLeaveMinutes > 0) {
        // Get payroll to determine penalty rate
        const payroll = await PayrollModel.findOne({ staffId: userId });
        const penaltyRate = payroll?.penaltyDetails?.amount || 50; // Default 50 tenge per minute
        
        const penaltyAmount = earlyLeaveMinutes * penaltyRate;
        
        attendanceRecord.penalties.earlyLeave = {
          minutes: earlyLeaveMinutes,
          amount: penaltyAmount,
          reason: `Ранний уход за ${earlyLeaveMinutes} минут до окончания смены`
        };
        attendanceRecord.earlyLeaveMinutes = earlyLeaveMinutes;
      }
      
      // Link the shift to the attendance record
      if (!attendanceRecord.shiftId) {
        attendanceRecord.shiftId = scheduledShift._id;
      }
    }
    
    attendanceRecord.clockOutLocation = {
      name: 'Current Location',
      coordinates: {
        latitude: locationData.latitude,
        longitude: locationData.longitude
      },
      radius: 10,
      timestamp: new Date()
    };
    attendanceRecord.photoClockOut = photo;
    if (notes) {
      attendanceRecord.notes = attendanceRecord.notes ? `${attendanceRecord.notes}\n${notes}` : notes;
    }
    
    await attendanceRecord.save(); // This will trigger pre-save middleware to calculate hours
    
    await attendanceRecord.populate('staffId', 'fullName role');
    
    // Найти пользователя перед отправкой уведомления
    const user = await UserModel.findById(userId);
    if (!user) throw new Error('User not found');
    try {
      const adminChatId = process.env.TELEGRAM_CHAT_ID;

      let timeStr = (new Date()).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
      let inRangeText = '';
      if (scheduledShift && scheduledShift.startTime && scheduledShift.endTime) {
        const now = new Date();
        const startT = scheduledShift.startTime.split(':').map(Number);
        const endT = scheduledShift.endTime.split(':').map(Number);
        const nowMin = now.getHours() * 60 + now.getMinutes();
        const stMin = startT[0] * 60 + startT[1] - 30;
        const etMin = endT[0] * 60 + endT[1] + 30;
        const rangeOk = (nowMin >= stMin && nowMin <= etMin);
        inRangeText = rangeOk ? 'В диапазоне смены' : 'ВНЕ диапазона смены';
      } else {
        inRangeText = 'Нет графика смены';
      }
      
      const message = `Сотрудник ${user.fullName} отметил УХОД с работы ${new Date().toLocaleDateString('ru-RU')} в ${timeStr} (${inRangeText})`;

      // Уведомление сотруднику
      if ((user as any).telegramChatId) {
        await sendLogToTelegram(`Вы отметили УХОД с работы ${new Date().toLocaleDateString('ru-RU')} в ${timeStr} (${inRangeText})`);
      }
      // Уведомление администратору
      if (adminChatId) {
        await sendLogToTelegram(message);
      }
    } catch(e) { console.error('Telegram notify error:',e); }

    return {
      message: 'Successfully clocked out',
      attendanceRecord,
      totalHours: attendanceRecord.totalHours,
      regularHours: attendanceRecord.regularHours,
      overtimeHours: attendanceRecord.overtimeHours
    };
  }


  async getAll(filters: { staffId?: string, date?: string, status?: string, inZone?: boolean, startDate?: string, endDate?: string, approvedBy?: string, approvedAt?: string }) {
    const filter: any = {};
    
    if (filters.staffId) filter.staffId = filters.staffId;
    if (filters.approvedBy) filter.approvedBy = filters.approvedBy;
    if (filters.status) filter.status = filters.status;
    if (filters.inZone !== undefined) filter.inZone = filters.inZone;
    
    if (filters.date) {
      filter.date = new Date(filters.date);
    } else if (filters.startDate || filters.endDate) {
      filter.date = {};
      if (filters.startDate) filter.date.$gte = new Date(filters.startDate);
      if (filters.endDate) filter.date.$lte = new Date(filters.endDate);
    }
    
    if (filters.approvedAt) {
      filter.approvedAt = new Date(filters.approvedAt);
    }
    
    const records = await getStaffAttendanceTrackingModel().find(filter)
      .populate('staffId', 'fullName role')
      .populate('approvedBy', 'fullName role')
      .sort({ date: -1 });
    
    return records;
  }

  async getById(id: string) {
    const record = await getStaffAttendanceTrackingModel().findById(id)
      .populate('staffId', 'fullName role')
      .populate('approvedBy', 'fullName role');
    
    if (!record) {
      throw new Error('Запись посещаемости сотрудника не найдена');
    }
    
    return record;
 }

  async create(recordData: Partial<IStaffAttendanceTracking>, userId: string) {
    // Проверяем обязательные поля
    if (!recordData.staffId) {
      throw new Error('Не указан сотрудник');
    }
    if (!recordData.date) {
      throw new Error('Не указана дата');
    }
    
    // Проверяем существование сотрудника
    const staff = await UserModel.findById(recordData.staffId);
    if (!staff) {
      throw new Error('Сотрудник не найден');
    }
    
    // Проверяем существование утверждающего
    if (recordData.approvedBy) {
      const approver = await UserModel.findById(recordData.approvedBy);
      if (!approver) {
        throw new Error('Утверждающий не найден');
      }
    }
    
    const record = new (getStaffAttendanceTrackingModel())({
      ...recordData,
      approvedBy: userId // Утверждающий - текущий пользователь
    });
    
    await record.save();
    
    const populatedRecord = await getStaffAttendanceTrackingModel().findById(record._id)
      .populate('staffId', 'fullName role')
      .populate('approvedBy', 'fullName role');
    
    return populatedRecord;
  }

 async update(id: string, data: Partial<IStaffAttendanceTracking>) {
    const updatedRecord = await getStaffAttendanceTrackingModel().findByIdAndUpdate(
      id,
      data,
      { new: true }
    ).populate('staffId', 'fullName role')
     .populate('approvedBy', 'fullName role');
    
    if (!updatedRecord) {
      throw new Error('Запись посещаемости сотрудника не найдена');
    }
    
    return updatedRecord;
  }

  async delete(id: string) {
    const result = await getStaffAttendanceTrackingModel().findByIdAndDelete(id);
    
    if (!result) {
      throw new Error('Запись посещаемости сотрудника не найдена');
    }
    
    return { message: 'Запись посещаемости сотрудника успешно удалена' };
  }

  async getByStaffId(staffId: string, filters: { date?: string, status?: string, inZone?: boolean, startDate?: string, endDate?: string, approvedBy?: string, approvedAt?: string }) {
    const filter: any = { staffId };
    
    if (filters.approvedBy) filter.approvedBy = filters.approvedBy;
    if (filters.status) filter.status = filters.status;
    if (filters.inZone !== undefined) filter.inZone = filters.inZone;
    
    if (filters.date) {
      filter.date = new Date(filters.date);
    } else if (filters.startDate || filters.endDate) {
      filter.date = {};
      if (filters.startDate) filter.date.$gte = new Date(filters.startDate);
      if (filters.endDate) filter.date.$lte = new Date(filters.endDate);
    }
    
    if (filters.approvedAt) {
      filter.approvedAt = new Date(filters.approvedAt);
    }
    
    const records = await getStaffAttendanceTrackingModel().find(filter)
      .populate('staffId', 'fullName role')
      .populate('approvedBy', 'fullName role')
      .sort({ date: -1 });
    
    return records;
  }

  async getByDateRange(startDate: string, endDate: string, filters: { staffId?: string, status?: string, inZone?: boolean, approvedBy?: string, approvedAt?: string }) {
    const filter: any = {
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    };
    
    if (filters.staffId) filter.staffId = filters.staffId;
    if (filters.approvedBy) filter.approvedBy = filters.approvedBy;
    if (filters.status) filter.status = filters.status;
    if (filters.inZone !== undefined) filter.inZone = filters.inZone;
    
    if (filters.approvedAt) {
      filter.approvedAt = new Date(filters.approvedAt);
    }
    
    const records = await getStaffAttendanceTrackingModel().find(filter)
      .populate('staffId', 'fullName role')
      .populate('approvedBy', 'fullName role')
      .sort({ date: -1 });
    
    return records;
  }

  async getEntries(userId: string, filters: { page?: number, limit?: number, startDate?: string, endDate?: string, status?: string }) {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;
    
    // Build query
    const query: any = { staffId: userId };
    
    if (filters.status) query.status = filters.status;
    
    if (filters.startDate || filters.endDate) {
      query.date = {};
      if (filters.startDate) query.date.$gte = new Date(filters.startDate);
      if (filters.endDate) query.date.$lte = new Date(filters.endDate);
    }
    
    const records = await getStaffAttendanceTrackingModel().find(query)
      .populate('staffId', 'fullName role')
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await getStaffAttendanceTrackingModel().countDocuments(query);
    
    return {
      records,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async getSummary(userId: string, startDate: string, endDate: string) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    const records = await getStaffAttendanceTrackingModel().find({
      staffId: userId,
      date: { $gte: start, $lte: end }
    });
    
    const summary = {
      totalRecords: records.length,
      totalHours: records.reduce((sum, record) => sum + record.totalHours, 0),
      regularHours: records.reduce((sum, record) => sum + record.regularHours, 0),
      overtimeHours: records.reduce((sum, record) => sum + record.overtimeHours, 0),
      totalBreakTime: records.reduce((sum, record) => sum + (record.breakDuration || 0), 0),
      averageHoursPerDay: 0,
      daysWorked: records.length
    };
    
    if (summary.daysWorked > 0) {
      summary.averageHoursPerDay = summary.totalHours / summary.daysWorked;
    }
    
    return summary;
 }

  async getUpcomingAbsences(days: number = 7) {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + days);
    
    const records = await getStaffAttendanceTrackingModel().find({
      date: {
        $gte: today,
        $lte: futureDate
      }
    })
    .populate('staffId', 'fullName role')
    .populate('approvedBy', 'fullName role')
    .sort({ date: 1 });
    
    return records;
  }

  async updateStatus(id: string, status: 'on_break' | 'overtime' | 'absent' | 'active' | 'completed' | 'missed' | 'pending_approval' | 'late') {
    // Since we removed the status field, we'll update the linked shift's status instead
    const record = await getStaffAttendanceTrackingModel().findById(id);
    if (!record) {
      throw new Error('Запись посещаемости сотрудника не найдена');
    }
    
    if (record.shiftId) {
      const shift = await getShiftModel().findByIdAndUpdate(
        record.shiftId,
        { status },
        { new: true }
      );
    }
    
    return record;
  }

  async addNotes(id: string, notes: string) {
    const record = await getStaffAttendanceTrackingModel().findByIdAndUpdate(
      id,
      { notes },
      { new: true }
    ).populate('staffId', 'fullName role')
     .populate('approvedBy', 'fullName role');
    
    if (!record) {
      throw new Error('Запись посещаемости сотрудника не найдена');
    }
    
    return record;
  }

  async approve(id: string, approvedBy: string) {
    const record = await getStaffAttendanceTrackingModel().findByIdAndUpdate(
      id,
      {
        approvedBy,
        approvedAt: new Date()
      },
      { new: true }
    ).populate('staffId', 'fullName role')
     .populate('approvedBy', 'fullName role');
    
    if (!record) {
      throw new Error('Запись посещаемости сотрудника не найдена');
    }
    
    return record;
 }

  async updateAdjustments(id: string, penalties: any, bonuses: any, notes: string, userId: string) {
    const record = await getStaffAttendanceTrackingModel().findByIdAndUpdate(
      id,
      {
        penalties,
        bonuses,
        notes,
        approvedByTimeTracking: userId,
        approvedAtTimeTracking: new Date()
      },
      { new: true }
    ).populate('staffId', 'fullName role');
    
    if (!record) {
      throw new Error('Запись посещаемости сотрудника не найдена');
    }
    
    return record;
  }

  async approveAttendance(id: string, userId: string) {
    const record = await getStaffAttendanceTrackingModel().findByIdAndUpdate(
      id,
      {
        approvedByTimeTracking: userId,
        approvedAtTimeTracking: new Date()
      },
      { new: true }
    ).populate('staffId', 'fullName role');
    
    if (!record) {
      throw new Error('Запись посещаемости сотрудника не найдена');
    }
    
    return record;
 }

  async rejectAttendance(id: string, userId: string, reason?: string) {
    const existingRecord = await getStaffAttendanceTrackingModel().findById(id);
    if (!existingRecord) {
      throw new Error('Запись посещаемости сотрудника не найдена');
    }
    
    const record = await getStaffAttendanceTrackingModel().findByIdAndUpdate(
      id,
      {
        approvedByTimeTracking: userId,
        approvedAtTimeTracking: new Date(),
        notes: reason ? `${existingRecord.notes || ''}\nRejection reason: ${reason}` : existingRecord.notes
      },
      { new: true }
    ).populate('staffId', 'fullName role');
    
    if (!record) {
      throw new Error('Запись посещаемости сотрудника не найдена');
    }
    
    return record;
 }

  async getPendingApprovals() {
    const records = await getStaffAttendanceTrackingModel().find({
      approvedAtTimeTracking: { $exists: false },
      approvedByTimeTracking: { $exists: false }
    })
      .populate('staffId', 'fullName role')
      .sort({ date: -1 });
    
    return records;
  }

  async getApprovedRecords() {
    const records = await getStaffAttendanceTrackingModel().find({
      approvedAtTimeTracking: { $exists: true },
      approvedByTimeTracking: { $exists: true }
    })
      .populate('staffId', 'fullName role')
      .sort({ date: -1 });
    
    return records;
  }

  async getRejectedRecords() {
    const records = await getStaffAttendanceTrackingModel().find({
      approvedAtTimeTracking: { $exists: true },
      approvedByTimeTracking: { $exists: true }
      // Note: Without status field, we can't determine "rejected" records
      // This functionality needs to be rethought
    })
      .populate('staffId', 'fullName role')
      .sort({ date: -1 });
    
    return records;
  }

  async getLateArrivals(thresholdMinutes: number = 15) {
    const records = await getStaffAttendanceTrackingModel().find({
      'penalties.late.minutes': { $gte: thresholdMinutes }
    })
    .populate('staffId', 'fullName role')
    .sort({ date: -1 });
    
    return records;
  }

  async getEarlyLeaves(thresholdMinutes: number = 15) {
    const records = await getStaffAttendanceTrackingModel().find({
      'penalties.earlyLeave.minutes': { $gte: thresholdMinutes }
    })
    .populate('staffId', 'fullName role')
    .sort({ date: -1 });
    
    return records;
  }

  async getOvertimeRecords(thresholdMinutes: number = 30) {
    const records = await getStaffAttendanceTrackingModel().find({
      'bonuses.overtime.minutes': { $gte: thresholdMinutes }
    })
    .populate('staffId', 'fullName role')
    .sort({ date: -1 });
    
    return records;
  }

  async getAbsenteeismRecords() {
    // Find records without actual start time or with specific criteria indicating absence
    const records = await getStaffAttendanceTrackingModel().find({
      actualStart: { $exists: false }
    })
      .populate('staffId', 'fullName role')
      .sort({ date: -1 });
    
    return records;
  }

  async getWorkDurationStats(startDate: string, endDate: string) {
    const stats = await getStaffAttendanceTrackingModel().aggregate([
      {
        $match: {
          date: {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
          }
        }
      },
      {
        $group: {
          _id: '$staffId',
          totalWorkMinutes: { $sum: '$workDuration' },
          totalBreakMinutes: { $sum: '$breakDuration' },
          totalOvertimeMinutes: { $sum: '$overtimeDuration' },
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'staff'
        }
      },
      {
        $unwind: '$staff'
      },
      {
        $project: {
          staffId: '$_id',
          fullName: '$staff.fullName',
          role: '$staff.role',
          totalWorkMinutes: 1,
          totalBreakMinutes: 1,
          totalOvertimeMinutes: 1,
          count: 1,
          averageWorkMinutes: { $divide: ['$totalWorkMinutes', '$count'] }
        }
      },
      {
        $sort: { totalWorkMinutes: -1 }
      }
    ]);
    
    return stats;
  }

  async getBreakDurationStats(startDate: string, endDate: string) {
    const stats = await getStaffAttendanceTrackingModel().aggregate([
      {
        $match: {
          date: {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
          }
        }
      },
      {
        $group: {
          _id: '$staffId',
          totalBreakMinutes: { $sum: '$breakDuration' },
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'staff'
        }
      },
      {
        $unwind: '$staff'
      },
      {
        $project: {
          staffId: '$_id',
          fullName: '$staff.fullName',
          role: '$staff.role',
          totalBreakMinutes: 1,
          count: 1,
          averageBreakMinutes: { $divide: ['$totalBreakMinutes', '$count'] }
        }
      },
      {
        $sort: { totalBreakMinutes: -1 }
      }
    ]);
    
    return stats;
  }

  async getAttendanceRate(startDate: string, endDate: string) {
    const totalRecords = await getStaffAttendanceTrackingModel().countDocuments({
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    });
    
    const presentRecords = await getStaffAttendanceTrackingModel().countDocuments({
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      },
      actualStart: { $exists: true, $ne: null }
    });
    
    const absentRecords = await getStaffAttendanceTrackingModel().countDocuments({
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      },
      actualStart: { $exists: false }
    });
    
    return {
      total: totalRecords,
      present: presentRecords,
      absent: absentRecords,
      rate: totalRecords > 0 ? (presentRecords / totalRecords) * 100 : 0
    };
  }

  async getLateArrivalRate(startDate: string, endDate: string, thresholdMinutes: number = 15) {
    const totalRecords = await getStaffAttendanceTrackingModel().countDocuments({
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    });
    
    const lateRecords = await getStaffAttendanceTrackingModel().countDocuments({
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      },
      'penalties.late.minutes': { $gte: thresholdMinutes }
    });
    
    return {
      total: totalRecords,
      late: lateRecords,
      rate: totalRecords > 0 ? (lateRecords / totalRecords) * 100 : 0
    };
  }

  async getEarlyLeaveRate(startDate: string, endDate: string, thresholdMinutes: number = 15) {
    const totalRecords = await getStaffAttendanceTrackingModel().countDocuments({
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    });
    
    const earlyLeaveRecords = await getStaffAttendanceTrackingModel().countDocuments({
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      },
      'penalties.earlyLeave.minutes': { $gte: thresholdMinutes }
    });
    
    return {
      total: totalRecords,
      earlyLeave: earlyLeaveRecords,
      rate: totalRecords > 0 ? (earlyLeaveRecords / totalRecords) * 100 : 0
    };
  }

  async getOvertimeRate(startDate: string, endDate: string, thresholdMinutes: number = 30) {
    const totalRecords = await getStaffAttendanceTrackingModel().countDocuments({
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    });
    
    const overtimeRecords = await getStaffAttendanceTrackingModel().countDocuments({
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      },
      'bonuses.overtime.minutes': { $gte: thresholdMinutes }
    });
    
    return {
      total: totalRecords,
      overtime: overtimeRecords,
      rate: totalRecords > 0 ? (overtimeRecords / totalRecords) * 100 : 0
    };
  }

  async getAbsenteeismRate(startDate: string, endDate: string) {
    const totalRecords = await getStaffAttendanceTrackingModel().countDocuments({
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    });
    
    const absentRecords = await getStaffAttendanceTrackingModel().countDocuments({
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      },
      status: 'absent'
    });
    
    return {
      total: totalRecords,
      absent: absentRecords,
      rate: totalRecords > 0 ? (absentRecords / totalRecords) * 100 : 0
    };
  }

  async getStatistics() {
    const stats = await getStaffAttendanceTrackingModel().aggregate([
      {
        $group: {
          _id: {
            $cond: {
              if: { $ne: ["$actualStart", null] },
              then: "present",
              else: "absent"
            }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);
    
    const zoneStats = await StaffAttendanceTrackingModel.aggregate([
      {
        $group: {
          _id: '$inZone',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);
    
    const total = await getStaffAttendanceTrackingModel().countDocuments();
    
    return {
      total,
      byStatus: stats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {}),
      byZone: zoneStats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {})
    };
  }
}