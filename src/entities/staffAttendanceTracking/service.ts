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

    const now = new Date();
    const almatyDateStr = now.toLocaleDateString('sv', { timeZone: 'Asia/Almaty' });
    const almatyDay = new Date(`${almatyDateStr}T00:00:00+05:00`);

    const today = almatyDay;

    console.log(`[CLOCK-IN] User: ${userId}, AlmatyDay: ${almatyDay.toISOString()}, Now (UTC): ${now.toISOString()}`);

    const existingEntry = await StaffAttendanceTracking.findOne({
      staffId: new mongoose.Types.ObjectId(userId),
      date: today
    });

    if (existingEntry) {
      console.log(`[CLOCK-IN] Existing entry found for ${userId} on ${today.toISOString()}`);
      throw new Error('You already have an active time entry today. Please clock out first.');
    }


    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }


    const attendanceRecord = new StaffAttendanceTracking({
      staffId: userId,
      date: almatyDay,
      actualStart: new Date(),
      notes,
      isManualEntry: false
    });

    const dateStr = [today.getFullYear(), String(today.getMonth() + 1).padStart(2, '0'), String(today.getDate()).padStart(2, '0')].join('-');

    // Получаем настройки для начала рабочего дня
    const settingsService = new SettingsService();
    const settings = await settingsService.getKindergartenSettings();
    const workingStart = settings?.workingHours?.start || '09:00';

    // Ищем запись смен сотрудника
    const staffShifts = await Shift.findOne({ staffId: userId });
    const scheduledShift = staffShifts?.shifts.get(dateStr);

    if (scheduledShift) {
      attendanceRecord.shiftId = `${userId}_${dateStr}` as any;

      const now = new Date();
      // Calculate minutes late based on Asia/Almaty (UTC+5)
      // Standardize to UTC for calculation
      const [h, m] = workingStart.split(':').map(Number);

      // Get current hours and minutes in Almaty
      const almatyTimeStr = now.toLocaleTimeString('en-GB', { timeZone: 'Asia/Almaty', hour12: false });
      const [curH, curM] = almatyTimeStr.split(':').map(Number);

      const currentTotalMinutes = curH * 60 + curM;
      const scheduledTotalMinutes = h * 60 + m;

      const latenessMinutes = Math.floor(currentTotalMinutes - scheduledTotalMinutes);

      if (latenessMinutes > 0) {
        attendanceRecord.lateMinutes = latenessMinutes;
      }
    }

    await attendanceRecord.save();
    await attendanceRecord.populate('staffId', 'fullName role');

    // Consolidated Telegram notification
    try {
      const notificationSettings = await settingsService.getNotificationSettings();
      const adminChatId = notificationSettings?.telegram_chat_id;

      const almatyTimeStr = new Date().toLocaleTimeString('ru-RU', { timeZone: 'Asia/Almaty', hour: '2-digit', minute: '2-digit' });
      const almatyDateStr = new Date().toLocaleDateString('ru-RU', { timeZone: 'Asia/Almaty' });

      const escapedName = (attendanceRecord.staffId as any)?.fullName ?
        require('../../utils/telegramLogger').escapeHTML((attendanceRecord.staffId as any).fullName) : 'Сотрудник';

      const message = `👤 <b>${escapedName}</b> отметил <b>ПРИХОД</b> на работу\n🕒 Время: ${almatyDateStr} в ${almatyTimeStr}`;

      // Отправляем админу
      if (adminChatId) {
        await sendLogToTelegram(message, adminChatId);
      } else {
        await sendLogToTelegram(message);
      }
    } catch (e) {
      console.error('Telegram notify error (clockIn):', e);
    }

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

    const now = new Date();
    const almatyDateStr = now.toLocaleDateString('sv', { timeZone: 'Asia/Almaty' });
    const almatyDay = new Date(`${almatyDateStr}T00:00:00+05:00`);

    const today = almatyDay;

    console.log(`[CLOCK-OUT] User: ${userId}, AlmatyDay: ${almatyDay.toISOString()}, Now (UTC): ${now.toISOString()}`);

    const attendanceRecord = await StaffAttendanceTracking.findOne({
      staffId: new mongoose.Types.ObjectId(userId),
      date: today
    });

    if (!attendanceRecord) {
      throw new Error('No active time entry found for today. Please clock in first.');
    }


    attendanceRecord.actualEnd = new Date();


    const dateStr = [today.getFullYear(), String(today.getMonth() + 1).padStart(2, '0'), String(today.getDate()).padStart(2, '0')].join('-');
    const staffShifts = await Shift.findOne({ staffId: userId });
    const scheduledShift = staffShifts?.shifts.get(dateStr);

    const settingsService = new SettingsService();
    const settings = await settingsService.getKindergartenSettings();
    const workingEnd = settings?.workingHours?.end || '18:00';

    if (scheduledShift) {
      const now = new Date();
      const [h, m] = workingEnd.split(':').map(Number);

      const almatyTimeStr = now.toLocaleTimeString('en-GB', { timeZone: 'Asia/Almaty', hour12: false });
      const [curH, curM] = almatyTimeStr.split(':').map(Number);

      const currentTotalMinutes = curH * 60 + curM;
      const scheduledTotalMinutes = h * 60 + m;

      const earlyLeaveMinutes = Math.floor(scheduledTotalMinutes - currentTotalMinutes);

      if (earlyLeaveMinutes > 0) {
        attendanceRecord.earlyLeaveMinutes = earlyLeaveMinutes;
      }


      // Используем виртуальный ID если его еще нет
      if (!attendanceRecord.shiftId) {
        attendanceRecord.shiftId = `${userId}_${dateStr}` as any;
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

    // Consolidated Telegram notification
    try {
      const notificationSettings = await settingsService.getNotificationSettings();
      const adminChatId = notificationSettings?.telegram_chat_id || process.env.TELEGRAM_CHAT_ID;

      const almatyTimeStr = new Date().toLocaleTimeString('ru-RU', { timeZone: 'Asia/Almaty', hour: '2-digit', minute: '2-digit' });
      const almatyDateStr = new Date().toLocaleDateString('ru-RU', { timeZone: 'Asia/Almaty' });

      const escapedName = (attendanceRecord.staffId as any)?.fullName ?
        require('../../utils/telegramLogger').escapeHTML((attendanceRecord.staffId as any).fullName) : 'Сотрудник';

      let inRangeText = '';
      if (scheduledShift) {
        const workingStart = settings?.workingHours?.start || '09:00';
        const workingEnd = settings?.workingHours?.end || '18:00';
        const now = new Date();
        const almatyTimeStrFull = now.toLocaleTimeString('en-GB', { timeZone: 'Asia/Almaty', hour12: false });
        const [curH, curM] = almatyTimeStrFull.split(':').map(Number);
        const nowMin = curH * 60 + curM;

        const [startH, startM] = workingStart.split(':').map(Number);
        const [endH, endM] = workingEnd.split(':').map(Number);

        const stMin = startH * 60 + startM - 30;
        const etMin = endH * 60 + endM + 30;
        const rangeOk = (nowMin >= stMin && nowMin <= etMin);
        inRangeText = rangeOk ? '✅ (в диапазоне смены)' : '⚠️ (ВНЕ диапазона смены)';
      } else {
        inRangeText = '❓ (график не назначен)';
      }

      const message = `👤 <b>${escapedName}</b> отметил <b>УХОД</b> с работы\n🕒 Время: ${almatyDateStr} в ${almatyTimeStr}\n📍 Статус: ${inRangeText}`;

      if (adminChatId) {
        await sendLogToTelegram(message, adminChatId);
      }
    } catch (e) {
      console.error('Telegram notify error (clockOut):', e);
    }

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

    if (filters.date) {
      filter.date = new Date(`${filters.date}T00:00:00+05:00`);
    } else if (filters.startDate || filters.endDate) {
      filter.date = {};
      if (filters.startDate) filter.date.$gte = new Date(`${filters.startDate}T00:00:00+05:00`);
      if (filters.endDate) filter.date.$lte = new Date(`${filters.endDate}T23:59:59+05:00`);
    }

    const cacheKey = `${CACHE_KEY_PREFIX}:getAll:${JSON.stringify(filters)}`;
    const fetcher = async () => {
      const records = await StaffAttendanceTracking.find(filter)
        .populate('staffId', 'fullName role')
        .sort({ date: -1 });

      return records;
    };

    if (cacheService.isArchivePeriod(filters.startDate || filters.date, filters.endDate || filters.date)) {
      return await cacheService.getOrSet(cacheKey, fetcher, CACHE_TTL);
    }

    return await fetcher();
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
      filter.date = new Date(`${filters.date}T00:00:00+05:00`);
    } else if (filters.startDate || filters.endDate) {
      filter.date = {};
      if (filters.startDate) filter.date.$gte = new Date(`${filters.startDate}T00:00:00+05:00`);
      if (filters.endDate) filter.date.$lte = new Date(`${filters.endDate}T23:59:59+05:00`);
    }

    const cacheKey = `${CACHE_KEY_PREFIX}:getByStaffId:${staffId}:${JSON.stringify(filters)}`;
    const fetcher = async () => {
      const records = await StaffAttendanceTracking.find(filter)
        .populate('staffId', 'fullName role')
        .sort({ date: -1 });

      return records;
    };

    if (cacheService.isArchivePeriod(filters.startDate || filters.date, filters.endDate || filters.date)) {
      return await cacheService.getOrSet(cacheKey, fetcher, CACHE_TTL);
    }

    return await fetcher();
  }

  async getByDateRange(startDate: string, endDate: string, filters: { staffId?: string, status?: string, inZone?: boolean }) {
    const sd = new Date(`${startDate}T00:00:00+05:00`);
    const ed = new Date(`${endDate}T23:59:59+05:00`);
    const filter: any = {
      date: {
        $gte: sd,
        $lte: ed
      }
    };

    if (filters.staffId) filter.staffId = filters.staffId;
    // if (filters.approvedBy) filter.approvedBy = filters.approvedBy;
    // if (filters.status) filter.status = filters.status;
    // if (filters.inZone !== undefined) filter.inZone = filters.inZone;


    const cacheKey = `${CACHE_KEY_PREFIX}:getByDateRange:${startDate}:${endDate}:${JSON.stringify(filters)}`;
    const fetcher = async () => {
      const records = await StaffAttendanceTracking.find(filter)
        .populate('staffId', 'fullName role')
        .sort({ date: -1 });

      return records;
    };

    if (cacheService.isArchivePeriod(startDate, endDate)) {
      return await cacheService.getOrSet(cacheKey, fetcher, CACHE_TTL);
    }

    return await fetcher();
  }

  async getEntries(userId: string, filters: { page?: number, limit?: number, startDate?: string, endDate?: string, status?: string }) {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;


    const query: any = { staffId: userId };

    if (filters.status) query.status = filters.status;

    if (filters.startDate || filters.endDate) {
      query.date = {};
      if (filters.startDate) {
        query.date.$gte = new Date(`${filters.startDate}T00:00:00+05:00`);
      }
      if (filters.endDate) {
        query.date.$lte = new Date(`${filters.endDate}T23:59:59+05:00`);
      }
    }

    const cacheKey = `${CACHE_KEY_PREFIX}:getEntries:${userId}:${JSON.stringify(filters)}`;
    const fetcher = async () => {
      const records = await StaffAttendanceTracking.find(query)
        .populate('staffId', 'fullName role')
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit);

      const total = await StaffAttendanceTracking.countDocuments(query);

      return {
        records,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      };
    };

    if (cacheService.isArchivePeriod(filters.startDate, filters.endDate)) {
      return await cacheService.getOrSet(cacheKey, fetcher, CACHE_TTL);
    }

    return await fetcher();
  }

  async getSummary(userId: string, startDate: string, endDate: string) {
    const start = new Date(`${startDate}T00:00:00+05:00`);
    const end = new Date(`${endDate}T23:59:59+05:00`);

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
    const now = new Date();
    const almatyDateStr = now.toLocaleDateString('sv', { timeZone: 'Asia/Almaty' });
    const today = new Date(`${almatyDateStr}T00:00:00+05:00`);

    const futureDate = new Date(today);
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

  async updateStatus(id: string, status: 'absent' | 'completed' | 'pending_approval' | 'late') {

    const record = await StaffAttendanceTracking.findById(id);
    if (!record) {
      throw new Error('Запись посещаемости сотрудника не найдена');
    }

    if (record.shiftId) {
      // Парсим виртуальный ID: staffId_date
      const shiftIdStr = record.shiftId.toString();
      if (shiftIdStr.includes('_')) {
        const [staffId, date] = shiftIdStr.split('_');

        const staffShifts = await Shift.findOne({ staffId });
        if (staffShifts && staffShifts.shifts.has(date)) {
          const shiftDetail = staffShifts.shifts.get(date)!;
          shiftDetail.status = status;
          staffShifts.shifts.set(date, shiftDetail);
          await staffShifts.save();
        }
      }
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
            $gte: new Date(`${startDate}T00:00:00+05:00`),
            $lte: new Date(`${endDate}T23:59:59+05:00`)
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
            $gte: new Date(`${startDate}T00:00:00+05:00`),
            $lte: new Date(`${endDate}T23:59:59+05:00`)
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
    const rangeFilter = {
      $gte: new Date(`${startDate}T00:00:00+05:00`),
      $lte: new Date(`${endDate}T23:59:59+05:00`)
    };

    const totalRecords = await StaffAttendanceTracking.countDocuments({
      date: rangeFilter
    });

    const presentRecords = await StaffAttendanceTracking.countDocuments({
      date: rangeFilter,
      actualStart: { $exists: true, $ne: null }
    });

    const absentRecords = await StaffAttendanceTracking.countDocuments({
      date: rangeFilter,
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
    const rangeFilter = {
      $gte: new Date(`${startDate}T00:00:00+05:00`),
      $lte: new Date(`${endDate}T23:59:59+05:00`)
    };

    const totalRecords = await StaffAttendanceTracking.countDocuments({
      date: rangeFilter
    });

    const lateRecords = await StaffAttendanceTracking.countDocuments({
      date: rangeFilter,
      'penalties.late.minutes': { $gte: thresholdMinutes }
    });

    return {
      total: totalRecords,
      late: lateRecords,
      rate: totalRecords > 0 ? (lateRecords / totalRecords) * 100 : 0
    };
  }

  async getEarlyLeaveRate(startDate: string, endDate: string, thresholdMinutes: number = 15) {
    const rangeFilter = {
      $gte: new Date(`${startDate}T00:00:00+05:00`),
      $lte: new Date(`${endDate}T23:59:59+05:00`)
    };

    const totalRecords = await StaffAttendanceTracking.countDocuments({
      date: rangeFilter
    });

    const earlyLeaveRecords = await StaffAttendanceTracking.countDocuments({
      date: rangeFilter,
      'penalties.earlyLeave.minutes': { $gte: thresholdMinutes }
    });

    return {
      total: totalRecords,
      earlyLeave: earlyLeaveRecords,
      rate: totalRecords > 0 ? (earlyLeaveRecords / totalRecords) * 100 : 0
    };
  }

  async getOvertimeRate(startDate: string, endDate: string, thresholdMinutes: number = 30) {
    const rangeFilter = {
      $gte: new Date(`${startDate}T00:00:00+05:00`),
      $lte: new Date(`${endDate}T23:59:59+05:00`)
    };

    const totalRecords = await StaffAttendanceTracking.countDocuments({
      date: rangeFilter
    });

    const overtimeRecords = await StaffAttendanceTracking.countDocuments({
      date: rangeFilter,
      'overtimeDuration': { $gte: thresholdMinutes }
    });

    return {
      total: totalRecords,
      overtime: overtimeRecords,
      rate: totalRecords > 0 ? (overtimeRecords / totalRecords) * 100 : 0
    };
  }

  async getAbsenteeismRate(startDate: string, endDate: string) {
    const rangeFilter = {
      $gte: new Date(`${startDate}T00:00:00+05:00`),
      $lte: new Date(`${endDate}T23:59:59+05:00`)
    };

    const totalRecords = await StaffAttendanceTracking.countDocuments({
      date: rangeFilter
    });

    const absentRecords = await StaffAttendanceTracking.countDocuments({
      date: rangeFilter,
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
