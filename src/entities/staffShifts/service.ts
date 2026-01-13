import mongoose, { Types } from 'mongoose';
import Shift, { IStaffShifts, IShiftDetail } from './model';
import StaffAttendanceTracking, { IDeviceMetadata } from '../staffAttendanceTracking/model';
import User from '../../entities/users/model';
import { SettingsService } from '../settings/service';
import Payroll from '../payroll/model';
import { cacheService } from '../../services/cache';

const CACHE_KEY_PREFIX = 'shifts';
const CACHE_TTL = 300; // 5 minutes

const settingsService = new SettingsService();

export class ShiftsService {

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3;
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) *
      Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  async getAll(filters: { staffId?: string, date?: string, status?: string, startDate?: string, endDate?: string }, userId: string, role: string) {
    const filter: any = {};

    if (role === 'teacher' || role === 'assistant') {
      filter.staffId = userId;
    } else if (filters.staffId) {
      filter.staffId = filters.staffId;
    }

    const cacheKey = `${CACHE_KEY_PREFIX}:getAll:${userId}:${role}:${JSON.stringify(filters)}`;
    const fetcher = async () => {
      const allStaffShifts = await Shift.find(filter)
        .populate('staffId', 'fullName role')
        .populate('shifts.$*.createdBy', 'fullName')
        .populate('shifts.$*.alternativeStaffId', 'fullName');

      const settings = await settingsService.getKindergartenSettings();
      const defaultStart = settings?.workingHours?.start || '08:00';
      const defaultEnd = settings?.workingHours?.end || '18:00';

      const flattenedShifts: any[] = [];

      for (const staffRecord of allStaffShifts) {
        if (!staffRecord.staffId || !staffRecord.shifts) continue;

        for (const [date, detail] of staffRecord.shifts.entries()) {
          // Apply filters
          if (filters.date && date !== filters.date) continue;
          if (filters.status && detail.status !== filters.status) continue;
          if (filters.startDate && date < filters.startDate) continue;
          if (filters.endDate && date > filters.endDate) continue;

          flattenedShifts.push({
            _id: `${staffRecord.staffId._id}_${date}`,
            id: `${staffRecord.staffId._id}_${date}`,
            staffId: staffRecord.staffId,
            date: date,
            status: detail.status,
            startTime: settings?.workingHours?.start || defaultStart,
            endTime: settings?.workingHours?.end || defaultEnd,
            notes: detail.notes,
            createdBy: detail.createdBy,
            alternativeStaffId: detail.alternativeStaffId,
            createdAt: detail.createdAt,
            updatedAt: detail.updatedAt
          });
        }
      }

      return flattenedShifts.sort((a, b) => a.date.localeCompare(b.date));
    };

    if (cacheService.isArchivePeriod(filters.startDate || filters.date, filters.endDate || filters.date)) {
      return await cacheService.getOrSet(cacheKey, fetcher, CACHE_TTL);
    }

    return await fetcher();
  }

  async create(shiftData: any, userId: string) {
    const staffId = shiftData.staffId || shiftData.userId;
    if (!staffId) throw new Error('Не указан ID сотрудника');
    if (!shiftData.date) throw new Error('Не указана дата смены');

    const date = shiftData.date;
    const status = shiftData.status || 'pending_approval';

    let record = await Shift.findOne({ staffId });
    if (!record) {
      record = new Shift({ staffId, shifts: new Map() });
    }

    if (record.shifts.has(date)) {
      throw new Error('У сотрудника уже есть смена в этот день');
    }

    const detail: any = {
      status,
      notes: shiftData.notes,
      createdBy: userId,
      alternativeStaffId: shiftData.alternativeStaffId || undefined,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    record.shifts.set(date, detail);
    await record.save();

    await cacheService.invalidate(`${CACHE_KEY_PREFIX}:*`);

    // Return the flattened shift for the created date
    const populated = await Shift.findOne({ staffId })
      .populate('staffId', 'fullName role')
      .populate(`shifts.${date}.createdBy`, 'fullName');

    const settings = await settingsService.getKindergartenSettings();
    const createdDetail = populated?.shifts.get(date);

    return {
      _id: `${staffId}_${date}`,
      id: `${staffId}_${date}`,
      staffId: populated?.staffId,
      date,
      startTime: (createdDetail as any)?.startTime || settings?.workingHours?.start || '09:00',
      endTime: (createdDetail as any)?.endTime || settings?.workingHours?.end || '18:00',
      ...(createdDetail as any)?.toObject ? (createdDetail as any).toObject() : createdDetail
    };
  }

  async bulkCreate(shiftsData: any[], userId: string) {
    const createdShifts: any[] = [];
    const errors: Array<{ shift: any; error: string }> = [];

    for (const shiftData of shiftsData) {
      try {
        const result = await this.create(shiftData, userId);
        createdShifts.push(result);
      } catch (err: any) {
        errors.push({ shift: shiftData, error: err.message });
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
    // id as staffId_date
    const [staffId, date] = id.includes('_') ? id.split('_') : [data.staffId, data.date];
    if (!staffId || !date) throw new Error('Неверный идентификатор смены');

    const record = await Shift.findOne({ staffId });
    if (!record || !record.shifts.has(date)) {
      throw new Error('Смена не найдена');
    }

    const detail = record.shifts.get(date)!;

    if (data.status) detail.status = data.status;
    if (data.notes !== undefined) detail.notes = data.notes;
    if (data.alternativeStaffId !== undefined) detail.alternativeStaffId = data.alternativeStaffId || undefined;
    detail.updatedAt = new Date();

    record.shifts.set(date, detail);
    await record.save();

    await cacheService.invalidate(`${CACHE_KEY_PREFIX}:*`);
    return this.getOne(staffId, date);
  }

  private async getOne(staffId: string, date: string) {
    const record = await Shift.findOne({ staffId })
      .populate('staffId', 'fullName role')
      .populate(`shifts.${date}.createdBy`, 'fullName');

    const detail = record?.shifts.get(date);
    if (!detail) return null;

    return {
      _id: `${staffId}_${date}`,
      id: `${staffId}_${date}`,
      staffId: record?.staffId,
      date,
      ...(detail as any)?.toObject ? (detail as any).toObject() : detail
    };
  }

  async delete(id: string) {
    const [staffId, date] = id.split('_');
    if (!staffId || !date) throw new Error('Неверный идентификатор смены');

    const record = await Shift.findOne({ staffId });
    if (!record || !record.shifts.has(date)) {
      throw new Error('Смена не найдена');
    }

    record.shifts.delete(date);
    await record.save();

    await cacheService.invalidate(`${CACHE_KEY_PREFIX}:*`);
    return { success: true };
  }

  async bulkDelete(ids: string[]) {
    let count = 0;
    for (const id of ids) {
      try {
        await this.delete(id);
        count++;
      } catch (e) {
        console.error(`Failed to delete shift ${id}:`, e);
      }
    }
    return { success: count, ids };
  }

  async checkIn(id: string, userId: string, role: string, locationData?: { latitude: number, longitude: number }, deviceMetadata?: IDeviceMetadata) {
    const now = new Date();
    const almatyDateStr = now.toLocaleDateString('sv', { timeZone: 'Asia/Almaty' });
    const almatyDay = new Date(`${almatyDateStr}T00:00:00+05:00`);

    let staffId: string;
    let date: string;

    if (id && id.includes('_')) {
      [staffId, date] = id.split('_');
    } else {
      staffId = userId;
      date = almatyDateStr;
    }

    const record = await Shift.findOne({ staffId });
    if (!record || !record.shifts.has(date)) {
      throw new Error('Смена не найдена на сегодня');
    }

    const shift = record.shifts.get(date)!;

    if (locationData) {
      const geoSettings = await settingsService.getGeolocationSettings();
      if (geoSettings && geoSettings.enabled) {
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

    const settings = await settingsService.getKindergartenSettings();

    // Get current time in Almaty for comparison
    const almatyTimeStr = now.toLocaleTimeString('en-GB', { timeZone: 'Asia/Almaty', hour12: false });
    const [curH, curM] = almatyTimeStr.split(':').map(Number);
    const currentTotalMinutes = curH * 60 + curM;

    const [startH, startM] = (settings?.workingHours?.start || '09:00').split(':').map(Number);
    const scheduledTotalMinutes = startH * 60 + startM;

    const lateMinutes = Math.max(0, currentTotalMinutes - scheduledTotalMinutes);

    if (lateMinutes >= 15) {
      shift.status = 'late';
    } else {
      shift.status = 'in_progress';
    }

    record.shifts.set(date, shift);
    await record.save();

    let timeTracking = await StaffAttendanceTracking.findOne({
      staffId: new mongoose.Types.ObjectId(staffId),
      date: almatyDay
    });
    if (!timeTracking) {
      timeTracking = new StaffAttendanceTracking({ staffId, date: almatyDay });
    }

    timeTracking.actualStart = now;
    timeTracking.lateMinutes = lateMinutes;
    if (deviceMetadata) {
      timeTracking.checkInDevice = deviceMetadata;
    }
    await timeTracking.save();

    await cacheService.invalidate(`${CACHE_KEY_PREFIX}:*`);
    return {
      shift: { ...shift, date, staffId },
      timeTracking,
      message: lateMinutes >= 15 ? `Опоздание на ${lateMinutes} мин` : 'Успешно отмечен приход'
    };
  }

  async checkOut(id: string, userId: string, role: string, locationData?: { latitude: number, longitude: number }, deviceMetadata?: IDeviceMetadata) {
    const now = new Date();
    const almatyDateStr = now.toLocaleDateString('sv', { timeZone: 'Asia/Almaty' });
    const almatyDay = new Date(`${almatyDateStr}T00:00:00+05:00`);

    let staffId: string;
    let date: string;

    if (id && id.includes('_')) {
      [staffId, date] = id.split('_');
    } else {
      staffId = userId;
      date = almatyDateStr;
    }

    const record = await Shift.findOne({ staffId });
    if (!record || !record.shifts.has(date)) {
      throw new Error('Смена не найдена');
    }

    const shift = record.shifts.get(date)!;
    shift.status = 'completed';
    record.shifts.set(date, shift);
    await record.save();

    const settings = await settingsService.getKindergartenSettings();

    const timeTracking = await StaffAttendanceTracking.findOne({
      staffId: new mongoose.Types.ObjectId(staffId),
      date: almatyDay
    });
    if (timeTracking) {
      timeTracking.actualEnd = now;
      if (timeTracking.actualStart) {
        const durationMs = now.getTime() - timeTracking.actualStart.getTime();
        timeTracking.workDuration = Math.floor(durationMs / (1000 * 60)) - (timeTracking.breakDuration || 0);
      }

      const almatyTimeStr = now.toLocaleTimeString('en-GB', { timeZone: 'Asia/Almaty', hour12: false });
      const [curH, curM] = almatyTimeStr.split(':').map(Number);
      const currentTotalMinutes = curH * 60 + curM;

      const [endH, endM] = (settings?.workingHours?.end || '18:00').split(':').map(Number);
      const scheduledTotalMinutes = endH * 60 + endM;

      const earlyMinutes = Math.max(0, scheduledTotalMinutes - currentTotalMinutes);
      timeTracking.earlyLeaveMinutes = earlyMinutes;
      if (deviceMetadata) {
        timeTracking.checkOutDevice = deviceMetadata;
      }
      await timeTracking.save();
    }

    await cacheService.invalidate(`${CACHE_KEY_PREFIX}:*`);
    return { shift: { ...shift, date, staffId }, message: 'Успешно отмечен уход' };
  }

  async getTimeTrackingRecords(filters: { staffId?: string, startDate?: string, endDate?: string }, userId: string, role: string) {
    const filter: any = {};
    if (role === 'teacher' || role === 'assistant') {
      filter.staffId = userId;
    } else if (filters.staffId) {
      filter.staffId = filters.staffId;
    }
    if (filters.startDate && filters.endDate) {
      filter.date = { $gte: filters.startDate, $lte: filters.endDate };
    }

    const cacheKey = `${CACHE_KEY_PREFIX}:getTimeTracking:${userId}:${role}:${JSON.stringify(filters)}`;
    const fetcher = async () => {
      return await StaffAttendanceTracking.find(filter)
        .populate('staffId', 'fullName role')
        .sort({ date: -1 });
    };

    if (cacheService.isArchivePeriod(filters.startDate, filters.endDate)) {
      return await cacheService.getOrSet(cacheKey, fetcher, CACHE_TTL);
    }

    return await fetcher();
  }

  async updateAdjustments(id: string, penalties: any, bonuses: any, notes: string, userId: string) {
    const record = await StaffAttendanceTracking.findByIdAndUpdate(
      id,
      { bonuses, notes },
      { new: true }
    ).populate('staffId', 'fullName role');

    if (!record) throw new Error('Запись не найдена');
    await cacheService.invalidate(`${CACHE_KEY_PREFIX}:*`);
    return record;
  }

  async updateLateShifts() {
    try {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      const settings = await settingsService.getKindergartenSettings();
      const shiftStartTime = new Date(`${todayStr} ${settings?.workingHours?.start || '09:00'}`);
      const timeSinceShiftStart = (today.getTime() - shiftStartTime.getTime()) / (1000 * 60);

      if (timeSinceShiftStart < 15) return [];

      const records = await Shift.find({ [`shifts.${todayStr}.status`]: { $in: ['scheduled', 'in_progress'] } });
      const results = [];

      for (const record of records) {
        const shift = record.shifts.get(todayStr)!;
        const timeTracking = await StaffAttendanceTracking.findOne({ staffId: record.staffId, date: todayStr });

        if (!timeTracking || !timeTracking.actualStart) {
          shift.status = 'late';
          record.shifts.set(todayStr, shift);
          await record.save();
          results.push({ staffId: record.staffId, date: todayStr });
        }
      }
      return results;
    } catch (error) {
      console.error('Error updating late shifts:', error);
      throw error;
    }
  }
}
