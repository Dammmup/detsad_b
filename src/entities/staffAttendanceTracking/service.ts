import mongoose from 'mongoose';
import StaffAttendanceTracking from './model';
import { IStaffAttendanceTracking } from './model';
import User from '../users/model';
import Group from '../groups/model';
import Shift from '../staffShifts/model';
import Payroll from '../payroll/model';
import { SettingsService } from '../settings/service';
import { sendLogToTelegram } from '../../utils/telegramLogger';
import { cacheService } from '../../services/cache';

const CACHE_KEY_PREFIX = 'staffAttendance';
const CACHE_TTL = 300; // 5 minutes


let StaffAttendanceTrackingModel: any = null;
let UserModel: any = null;
let GroupModel: any = null;
let ShiftModel: any = null;
let PayrollModel: any = null;

const getStaffAttendanceTrackingModel = () => {
  if (!StaffAttendanceTrackingModel) {
    StaffAttendanceTrackingModel = StaffAttendanceTracking;
  }
  return StaffAttendanceTrackingModel;
};

const getUserModel = () => {
  if (!UserModel) {
    UserModel = User;
  }
  return UserModel;
};

const getGroupModel = () => {
  if (!GroupModel) {
    GroupModel = Group;
  }
  return GroupModel;
};

const getShiftModel = () => {
  if (!ShiftModel) {
    ShiftModel = Shift;
  }
  return ShiftModel;
};

const getPayrollModel = () => {
  if (!PayrollModel) {
    PayrollModel = Payroll;
  }
  return PayrollModel;
};

export class StaffAttendanceTrackingService {

  async clockIn(userId: string, notes?: string) {
    try {
      const user = await User.findById(userId);
      if (user) {
        await sendLogToTelegram(`Сотрудник ${user.fullName} отметил приход на работу`);
      }
    } catch (e) {
      console.error('Telegram notify error (clockIn):', e);
    }

    const today = new Date();
    today.setHours(0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const existingEntry = await StaffAttendanceTracking.findOne({
      staffId: new mongoose.Types.ObjectId(userId),
      date: { $gte: today, $lt: tomorrow }
    });

    if (existingEntry) {
      throw new Error('You already have an active time entry today. Please clock out first.');
    }


    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }


    const staffAttendanceTrackingModel = StaffAttendanceTracking;
    const attendanceRecord = new staffAttendanceTrackingModel({
      staffId: userId,
      date: new Date(),
      actualStart: new Date(),
      notes,
      isManualEntry: false
    });

    const dateStr = [today.getFullYear(), String(today.getMonth() + 1).padStart(2, '0'), String(today.getDate()).padStart(2, '0')].join('-');

    // Получаем настройки для начала рабочего дня
    const settingsService = new SettingsService();
    const settings = await settingsService.getKindergartenSettings();
    const workingStart = settings?.workingHours?.start || '09:00';

    const scheduledShift = await Shift.findOne({
      staffId: userId,
      date: dateStr
    });

    if (scheduledShift) {
      attendanceRecord.shiftId = scheduledShift._id as any;

      const actualStart = new Date();
      const [hours, minutes] = workingStart.split(':').map(Number);


      const scheduledStart = new Date(actualStart);
      scheduledStart.setHours(hours, minutes, 0, 0);


      const latenessMs = actualStart.getTime() - scheduledStart.getTime();
      const latenessMinutes = Math.floor(latenessMs / (1000 * 60));

      if (latenessMinutes > 0) {
        attendanceRecord.lateMinutes = latenessMinutes;
      }
    }

    await attendanceRecord.save();

    await attendanceRecord.populate('staffId', 'fullName role');

    try {
      const notificationSettings = await settingsService.getNotificationSettings();
      const adminChatId = notificationSettings?.telegram_chat_id;

      let timeStr = (new Date()).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

      const message = `Сотрудник ${user.fullName} отметил ПРИХОД на работу ${new Date().toLocaleDateString('ru-RU')} в ${timeStr}`;


      if ((user as any).telegramChatId) {
        await sendLogToTelegram(`Вы отметили ПРИХОД на работу ${new Date().toLocaleDateString('ru-RU')} в ${timeStr}`);
      }

      if (adminChatId) {
        await sendLogToTelegram(message);
      }
    } catch (e) { console.error('Telegram notify error:', e); }

    try {
      await cacheService.invalidate(`${CACHE_KEY_PREFIX}:*`);
    } catch (e) {
      console.warn('Cache invalidation error:', e);
    }

    return {
      message: 'Successfully clocked in',
      attendanceRecord
    };
  }

  async clockOut(userId: string, locationData: { latitude: number, longitude: number }, photo?: string, notes?: string) {
    try {
      const user = await User.findById(userId);
      if (user) {
        await sendLogToTelegram(`Сотрудник ${user.fullName} отметил уход с работы`);
      }
    } catch (e) {
      console.error('Telegram notify error (clockOut):', e);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const attendanceRecord = await StaffAttendanceTracking.findOne({
      staffId: new mongoose.Types.ObjectId(userId),
      date: { $gte: today, $lt: tomorrow }
    });

    if (!attendanceRecord) {
      throw new Error('No active time entry found for today. Please clock in first.');
    }


    attendanceRecord.actualEnd = new Date();


    const dateStr = [today.getFullYear(), String(today.getMonth() + 1).padStart(2, '0'), String(today.getDate()).padStart(2, '0')].join('-');
    const scheduledShift = await ShiftModel.findOne({
      staffId: userId,
      date: dateStr
    });

    const settingsService = new SettingsService();
    const settings = await settingsService.getKindergartenSettings();
    const workingEnd = settings?.workingHours?.end || '18:00';

    if (scheduledShift) {
      const actualEnd = new Date();
      const [hours, minutes] = workingEnd.split(':').map(Number);


      const scheduledEnd = new Date(actualEnd);
      scheduledEnd.setHours(hours, minutes, 0, 0);


      const earlyLeaveMs = scheduledEnd.getTime() - actualEnd.getTime();
      const earlyLeaveMinutes = Math.floor(earlyLeaveMs / (1000 * 60));

      if (earlyLeaveMinutes > 0) {
        attendanceRecord.earlyLeaveMinutes = earlyLeaveMinutes;
      }


      if (!attendanceRecord.shiftId) {
        attendanceRecord.shiftId = scheduledShift._id;
      }
    }

    // Удалено использование clockOutLocation и photoClockOut
    // attendanceRecord.clockOutLocation = ...
    // attendanceRecord.photoClockOut = photo;
    if (notes) {
      attendanceRecord.notes = attendanceRecord.notes ? `${attendanceRecord.notes}\n${notes}` : notes;
    }

    await attendanceRecord.save();

    await attendanceRecord.populate('staffId', 'fullName role');


    const user = await UserModel.findById(userId);
    if (!user) throw new Error('User not found');
    try {
      const adminChatId = process.env.TELEGRAM_CHAT_ID;

      let timeStr = (new Date()).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
      let inRangeText = '';
      if (scheduledShift) {
        // Using global settings instead of shift start/end time
        const workingStart = settings?.workingHours?.start || '09:00';
        const workingEnd = settings?.workingHours?.end || '18:00';
        const now = new Date();
        const startT = workingStart.split(':').map(Number);
        const endT = workingEnd.split(':').map(Number);
        const nowMin = now.getHours() * 60 + now.getMinutes();
        const stMin = startT[0] * 60 + startT[1] - 30;
        const etMin = endT[0] * 60 + endT[1] + 30;
        const rangeOk = (nowMin >= stMin && nowMin <= etMin);
        inRangeText = rangeOk ? 'В диапазоне смены' : 'ВНЕ диапазона смены';
      } else {
        inRangeText = 'Нет графика смены';
      }

      const message = `Сотрудник ${user.fullName} отметил УХОД с работы ${new Date().toLocaleDateString('ru-RU')} в ${timeStr} (${inRangeText})`;


      if ((user as any).telegramChatId) {
        await sendLogToTelegram(`Вы отметили УХОД с работы ${new Date().toLocaleDateString('ru-RU')} в ${timeStr} (${inRangeText})`);
      }

      if (adminChatId) {
        await sendLogToTelegram(message);
      }
    } catch (e) { console.error('Telegram notify error:', e); }

    try {
      await cacheService.invalidate(`${CACHE_KEY_PREFIX}:*`);
    } catch (e) {
      console.warn('Cache invalidation error:', e);
    }

    return {
      message: 'Successfully clocked out',
      attendanceRecord
    };
  }


  async getAll(filters: { staffId?: string, date?: string, status?: string, inZone?: boolean, startDate?: string, endDate?: string }) {
    const filter: any = {};

    if (filters.staffId) filter.staffId = filters.staffId;
    // Removed approvedBy filter
    // if (filters.approvedBy) filter.approvedBy = filters.approvedBy;
    // Removed inZone filter as field is deleted
    // if (filters.inZone !== undefined) filter.inZone = filters.inZone;

    if (filters.date) {
      filter.date = new Date(filters.date);
    } else if (filters.startDate || filters.endDate) {
      filter.date = {};
      if (filters.startDate) filter.date.$gte = new Date(filters.startDate);
      if (filters.endDate) filter.date.$lte = new Date(filters.endDate);
    }

    const cacheKey = `${CACHE_KEY_PREFIX}:getAll:${JSON.stringify(filters)}`;
    return await cacheService.getOrSet(cacheKey, async () => {
      const records = await StaffAttendanceTracking.find(filter)
        .populate('staffId', 'fullName role')
        .sort({ date: -1 });

      return records;
    }, CACHE_TTL);
  }

  async getById(id: string) {
    const cacheKey = `${CACHE_KEY_PREFIX}:${id}`;
    return await cacheService.getOrSet(cacheKey, async () => {
      const record = await StaffAttendanceTracking.findById(id)
        .populate('staffId', 'fullName role');

      if (!record) {
        throw new Error('Запись посещаемости сотрудника не найдена');
      }

      return record;
    }, CACHE_TTL);
  }

  async create(recordData: Partial<IStaffAttendanceTracking>, userId: string) {

    if (!recordData.staffId) {
      throw new Error('Не указан сотрудник');
    }
    if (!recordData.date) {
      throw new Error('Не указана дата');
    }


    const staff = await UserModel.findById(recordData.staffId);
    if (!staff) {
      throw new Error('Сотрудник не найден');
    }


    const record = new StaffAttendanceTracking({
      ...recordData
    });

    await record.save();

    const populatedRecord = await StaffAttendanceTracking.findById(record._id)
      .populate('staffId', 'fullName role');

    try {
      await cacheService.invalidate(`${CACHE_KEY_PREFIX}:*`);
    } catch (e) {
      console.warn('Cache invalidation error:', e);
    }

    return populatedRecord;
  }

  async update(id: string, data: Partial<IStaffAttendanceTracking>) {
    // Use findById + save to trigger Mongoose post-save hook
    // which recalculates payroll for the staff member
    const record = await StaffAttendanceTracking.findById(id);

    if (!record) {
      throw new Error('Запись посещаемости сотрудника не найдена');
    }

    // Update fields
    Object.assign(record, data);

    // Save triggers post-save hook which recalculates payroll
    await record.save();

    // Populate and return
    const updatedRecord = await StaffAttendanceTracking.findById(id)
      .populate('staffId', 'fullName role');

    try {
      await cacheService.invalidate(`${CACHE_KEY_PREFIX}:*`);
    } catch (e) {
      console.warn('Cache invalidation error:', e);
    }

    return updatedRecord;
  }

  async delete(id: string) {
    const result = await StaffAttendanceTracking.findByIdAndDelete(id);

    if (!result) {
      throw new Error('Запись посещаемости сотрудника не найдена');
    }

    try {
      await cacheService.invalidate(`${CACHE_KEY_PREFIX}:*`);
    } catch (e) {
      console.warn('Cache invalidation error:', e);
    }

    return { message: 'Запись посещаемости сотрудника успешно удалена' };
  }

  async getByStaffId(staffId: string, filters: { date?: string, status?: string, inZone?: boolean, startDate?: string, endDate?: string }) {
    const filter: any = { staffId };

    // if (filters.approvedBy) filter.approvedBy = filters.approvedBy;
    // if (filters.status) filter.status = filters.status;
    // if (filters.inZone !== undefined) filter.inZone = filters.inZone;

    if (filters.date) {
      filter.date = new Date(filters.date);
    } else if (filters.startDate || filters.endDate) {
      filter.date = {};
      if (filters.startDate) filter.date.$gte = new Date(filters.startDate);
      if (filters.endDate) filter.date.$lte = new Date(filters.endDate);
    }

    const cacheKey = `${CACHE_KEY_PREFIX}:getByStaffId:${staffId}:${JSON.stringify(filters)}`;
    return await cacheService.getOrSet(cacheKey, async () => {
      const records = await StaffAttendanceTracking.find(filter)
        .populate('staffId', 'fullName role')
        .sort({ date: -1 });

      return records;
    }, CACHE_TTL);
  }

  async getByDateRange(startDate: string, endDate: string, filters: { staffId?: string, status?: string, inZone?: boolean }) {
    const filter: any = {
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    };

    if (filters.staffId) filter.staffId = filters.staffId;
    // if (filters.approvedBy) filter.approvedBy = filters.approvedBy;
    // if (filters.status) filter.status = filters.status;
    // if (filters.inZone !== undefined) filter.inZone = filters.inZone;


    const cacheKey = `${CACHE_KEY_PREFIX}:getByDateRange:${startDate}:${endDate}:${JSON.stringify(filters)}`;
    return await cacheService.getOrSet(cacheKey, async () => {
      const records = await StaffAttendanceTracking.find(filter)
        .populate('staffId', 'fullName role')
        .sort({ date: -1 });

      return records;
    }, CACHE_TTL);
  }

  async getEntries(userId: string, filters: { page?: number, limit?: number, startDate?: string, endDate?: string, status?: string }) {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;


    const query: any = { staffId: userId };

    if (filters.status) query.status = filters.status;

    if (filters.startDate || filters.endDate) {
      query.date = {};
      if (filters.startDate) query.date.$gte = new Date(filters.startDate);
      if (filters.endDate) query.date.$lte = new Date(filters.endDate);
    }

    const cacheKey = `${CACHE_KEY_PREFIX}:getEntries:${userId}:${JSON.stringify(filters)}`;
    return await cacheService.getOrSet(cacheKey, async () => {
      const records = await StaffAttendanceTracking.find(query)
        .populate('staffId', 'fullName role')
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit);

      const total = await StaffAttendanceTracking.countDocuments(query);

      return {
        records,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    }, CACHE_TTL);
  }

  async getSummary(userId: string, startDate: string, endDate: string) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const records = await StaffAttendanceTracking.find({
      staffId: userId,
      date: { $gte: start, $lte: end }
    });

    const summary = {
      totalRecords: records.length,
      // totalHours: records.reduce((sum, record) => sum + record.totalHours, 0),
      // regularHours: records.reduce((sum, record) => sum + record.regularHours, 0),
      // overtimeHours: records.reduce((sum, record) => sum + record.overtimeHours, 0),
      // Use workDuration instead if available, or 0
      totalHours: records.reduce((sum, record) => sum + (record.workDuration || 0) / 60, 0),
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

    const records = await StaffAttendanceTracking.find({
      date: {
        $gte: today,
        $lte: futureDate
      }
    })
      .populate('staffId', 'fullName role')
      .sort({ date: 1 });

    return records;
  }

  async updateStatus(id: string, status: 'on_break' | 'overtime' | 'absent' | 'active' | 'completed' | 'missed' | 'pending_approval' | 'late') {

    const record = await StaffAttendanceTracking.findById(id);
    if (!record) {
      throw new Error('Запись посещаемости сотрудника не найдена');
    }

    if (record.shiftId) {
      const shift = await Shift.findByIdAndUpdate(
        record.shiftId,
        { status },
        { new: true }
      );
    }

    try {
      await cacheService.invalidate(`${CACHE_KEY_PREFIX}:*`);
    } catch (e) {
      console.warn('Cache invalidation error:', e);
    }

    return record;
  }

  async addNotes(id: string, notes: string) {
    const record = await StaffAttendanceTracking.findByIdAndUpdate(
      id,
      { notes },
      { new: true }
    ).populate('staffId', 'fullName role');

    if (!record) {
      throw new Error('Запись посещаемости сотрудника не найдена');
    }

    try {
      await cacheService.invalidate(`${CACHE_KEY_PREFIX}:*`);
    } catch (e) {
      console.warn('Cache invalidation error:', e);
    }

    return record;
  }

  async approve(id: string, approvedBy: string) {
    const record = await StaffAttendanceTracking.findByIdAndUpdate(
      id,
      {
        approvedBy,
        approvedAt: new Date()
      },
      { new: true }
    ).populate('staffId', 'fullName role');

    if (!record) {
      throw new Error('Запись посещаемости сотрудника не найдена');
    }

    try {
      await cacheService.invalidate(`${CACHE_KEY_PREFIX}:*`);
    } catch (e) {
      console.warn('Cache invalidation error:', e);
    }

    return record;
  }

  async updateAdjustments(id: string, penalties: any, bonuses: any, notes: string, userId: string) {
    // Use findById + save to trigger payroll recalculation
    const record = await StaffAttendanceTracking.findById(id);

    if (!record) {
      throw new Error('Запись посещаемости сотрудника не найдена');
    }

    // record.penalties = penalties;
    // record.bonuses = bonuses;
    record.notes = notes;
    // Removed approvedByTimeTracking assignment as field is deleted
    // (record as any).approvedByTimeTracking = userId;
    // (record as any).approvedAtTimeTracking = new Date();

    await record.save();

    const updatedRecord = await StaffAttendanceTracking.findById(id)
      .populate('staffId', 'fullName role');

    try {
      await cacheService.invalidate(`${CACHE_KEY_PREFIX}:*`);
    } catch (e) {
      console.warn('Cache invalidation error:', e);
    }

    return updatedRecord;
  }

  async approveAttendance(id: string, userId: string) {
    // Use findById + save to trigger payroll recalculation
    const record = await StaffAttendanceTracking.findById(id);

    if (!record) {
      throw new Error('Запись посещаемости сотрудника не найдена');
    }

    (record as any).approvedByTimeTracking = userId;
    (record as any).approvedAtTimeTracking = new Date();

    await record.save();

    const updatedRecord = await StaffAttendanceTracking.findById(id)
      .populate('staffId', 'fullName role');

    try {
      await cacheService.invalidate(`${CACHE_KEY_PREFIX}:*`);
    } catch (e) {
      console.warn('Cache invalidation error:', e);
    }

    return updatedRecord;
  }

  async rejectAttendance(id: string, userId: string, reason?: string) {
    const existingRecord = await StaffAttendanceTracking.findById(id);
    if (!existingRecord) {
      throw new Error('Запись посещаемости сотрудника не найдена');
    }

    const record = await StaffAttendanceTracking.findByIdAndUpdate(
      id,
      {
        // approvedByTimeTracking: userId,
        // approvedAtTimeTracking: new Date(),
        notes: reason ? `${existingRecord.notes || ''}\nRejection reason: ${reason}` : existingRecord.notes
      },
      { new: true }
    ).populate('staffId', 'fullName role');

    if (!record) {
      throw new Error('Запись посещаемости сотрудника не найдена');
    }

    try {
      await cacheService.invalidate(`${CACHE_KEY_PREFIX}:*`);
    } catch (e) {
      console.warn('Cache invalidation error:', e);
    }

    return record;
  }

  // Removed getPendingApprovals, getApprovedRecords, getRejectedRecords as approval logic is removed
  // async getPendingApprovals() { ... }
  // async getApprovedRecords() { ... }
  // async getRejectedRecords() { ... }

  async getLateArrivals(thresholdMinutes: number = 15) {
    const records = await StaffAttendanceTracking.find({
      'penalties.late.minutes': { $gte: thresholdMinutes }
    })
      .populate('staffId', 'fullName role')
      .sort({ date: -1 });

    return records;
  }

  async getEarlyLeaves(thresholdMinutes: number = 15) {
    const records = await StaffAttendanceTracking.find({
      'penalties.earlyLeave.minutes': { $gte: thresholdMinutes }
    })
      .populate('staffId', 'fullName role')
      .sort({ date: -1 });

    return records;
  }

  async getOvertimeRecords(thresholdMinutes: number = 30) {
    const records = await StaffAttendanceTracking.find({
      'overtimeDuration': { $gte: thresholdMinutes }
    })
      .populate('staffId', 'fullName role')
      .sort({ date: -1 });

    return records;
  }

  async getAbsenteeismRecords() {

    const records = await StaffAttendanceTracking.find({
      actualStart: { $exists: false }
    })
      .populate('staffId', 'fullName role')
      .sort({ date: -1 });

    return records;
  }

  async getWorkDurationStats(startDate: string, endDate: string) {
    const stats = await StaffAttendanceTracking.aggregate([
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
    const stats = await StaffAttendanceTracking.aggregate([
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
    const totalRecords = await StaffAttendanceTracking.countDocuments({
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    });

    const presentRecords = await StaffAttendanceTracking.countDocuments({
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      },
      actualStart: { $exists: true, $ne: null }
    });

    const absentRecords = await StaffAttendanceTracking.countDocuments({
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
    const totalRecords = await StaffAttendanceTracking.countDocuments({
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    });

    const lateRecords = await StaffAttendanceTracking.countDocuments({
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
    const totalRecords = await StaffAttendanceTracking.countDocuments({
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    });

    const earlyLeaveRecords = await StaffAttendanceTracking.countDocuments({
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
    const totalRecords = await StaffAttendanceTracking.countDocuments({
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    });

    const overtimeRecords = await StaffAttendanceTracking.countDocuments({
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      },
      'overtimeDuration': { $gte: thresholdMinutes }
    });

    return {
      total: totalRecords,
      overtime: overtimeRecords,
      rate: totalRecords > 0 ? (overtimeRecords / totalRecords) * 100 : 0
    };
  }

  async getAbsenteeismRate(startDate: string, endDate: string) {
    const totalRecords = await StaffAttendanceTracking.countDocuments({
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    });

    const absentRecords = await StaffAttendanceTracking.countDocuments({
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
    const stats = await StaffAttendanceTracking.aggregate([
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

    const total = await StaffAttendanceTracking.countDocuments();

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