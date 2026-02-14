import mongoose, { Types } from 'mongoose';
import Shift, { IStaffShifts, IShiftDetail } from './model';
import StaffAttendanceTracking, { IDeviceMetadata } from '../staffAttendanceTracking/model';
import User from '../../entities/users/model';
import { SettingsService } from '../settings/service';
import Payroll from '../payroll/model';
import { enrichDeviceMetadata } from '../../shared/utils/deviceDetector';

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

  private async verifyGeofencing(locationData: { latitude: number, longitude: number, accuracy?: number }) {
    const geoSettings = await settingsService.getGeolocationSettings();
    if (geoSettings && geoSettings.enabled) {
      const distance = this.calculateDistance(
        locationData.latitude,
        locationData.longitude,
        geoSettings.coordinates.latitude,
        geoSettings.coordinates.longitude
      );

      console.log(`[GEOFENCING] Проверка координат:
        - Текущие: ${locationData.latitude}, ${locationData.longitude}
        - Точность (GPS Accuracy): ${locationData.accuracy ? locationData.accuracy + ' м' : 'НЕТ ДАННЫХ'}
        - Целевые: ${geoSettings.coordinates.latitude}, ${geoSettings.coordinates.longitude}
        - Рассчитанная дистанция: ${distance.toFixed(2)} м
        - Разрешенный радиус: ${geoSettings.radius} м
        - Результат: ${distance <= geoSettings.radius ? 'В ГЕОЗОНЕ' : 'ВНЕ ГЕОЗОНЫ'}`);

      if (distance > geoSettings.radius) {
        throw new Error(`Вы находитесь вне геозоны. Расстояние до детского сада: ${Math.round(distance)}м. Разрешено в радиусе ${geoSettings.radius}м.`);
      }
    } else {
      console.log('[GEOFENCING] Проверка отключена в настройках.');
    }
  }

  async getAll(filters: { staffId?: string, date?: string, status?: string, startDate?: string, endDate?: string }, userId: string, role: string) {
    const filter: any = {};

    if (role === 'teacher' || role === 'assistant') {
      filter.staffId = userId;
    } else if (filters.staffId) {
      filter.staffId = filters.staffId;
    }

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

  async bulkUpdateStatus(filters: { staffId?: string, startDate: string, endDate: string, status: string }, userId: string) {
    const { staffId, startDate, endDate, status } = filters;
    const query: any = {};
    if (staffId) query.staffId = staffId;

    const records = await Shift.find(query);
    const settings = await settingsService.getKindergartenSettings();
    const results = [];

    for (const record of records) {
      let modified = false;
      const currentStaffId = record.staffId.toString();

      // Iterate through dates in range
      const start = new Date(startDate);
      const end = new Date(endDate);

      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toLocaleDateString('sv-SE', { timeZone: 'Asia/Almaty' });
        if (record.shifts.has(dateStr)) {
          const shift = record.shifts.get(dateStr)!;
          if (shift.status !== status) {
            shift.status = status as any;
            shift.updatedAt = new Date();
            record.shifts.set(dateStr, shift);
            modified = true;

            // If status is completed, update attendance tracking
            if (status === 'completed') {
              const almatyDay = new Date(`${dateStr}T00:00:00+05:00`);
              let timeTracking = await StaffAttendanceTracking.findOne({
                staffId: record.staffId,
                date: almatyDay
              });

              if (!timeTracking) {
                timeTracking = new StaffAttendanceTracking({
                  staffId: record.staffId,
                  date: almatyDay,
                  isManualEntry: true
                });
              }

              const [startH, startM] = (settings?.workingHours?.start || '09:00').split(':').map(Number);
              const [endH, endM] = (settings?.workingHours?.end || '18:00').split(':').map(Number);

              const actualStart = new Date(almatyDay);
              actualStart.setHours(startH, startM, 0, 0);

              const actualEnd = new Date(almatyDay);
              actualEnd.setHours(endH, endM, 0, 0);

              timeTracking.actualStart = actualStart;
              timeTracking.actualEnd = actualEnd;
              timeTracking.lateMinutes = 0;
              timeTracking.earlyLeaveMinutes = 0;
              timeTracking.status = 'completed';

              await timeTracking.save();
            } else if (status === 'absent') {
              const almatyDay = new Date(`${dateStr}T00:00:00+05:00`);
              await StaffAttendanceTracking.findOneAndUpdate(
                { staffId: record.staffId, date: almatyDay },
                { status: 'absent', actualStart: undefined, actualEnd: undefined, updatedAt: new Date() },
                { upsert: true, runValidators: true, setDefaultsOnInsert: true }
              );
            }
          }
        }
      }

      if (modified) {
        await record.save();
        results.push(currentStaffId);
      }
    }

    return { success: true, updatedStaffCount: results.length };
  }

  /**
   * Получает текущий статус смены сотрудника на сегодня
   */
  async getShiftStatus(staffId: string): Promise<'scheduled' | 'in_progress' | 'completed' | 'late' | 'no_shift'> {
    const now = new Date();
    const almatyDateStr = now.toLocaleDateString('sv', { timeZone: 'Asia/Almaty' });

    const record = await Shift.findOne({ staffId });
    if (!record || !record.shifts.has(almatyDateStr)) {
      return 'no_shift';
    }

    const shift = record.shifts.get(almatyDateStr)!;
    return shift.status as 'scheduled' | 'in_progress' | 'completed' | 'late';
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
      await this.verifyGeofencing(locationData);
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
      timeTracking.checkInDevice = enrichDeviceMetadata(deviceMetadata);
    }
    await timeTracking.save();

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

    if (locationData) {
      await this.verifyGeofencing(locationData);
    }
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
        timeTracking.checkOutDevice = enrichDeviceMetadata(deviceMetadata);
      }
      await timeTracking.save();
    }

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

    const fetcher = async () => {
      return await StaffAttendanceTracking.find(filter)
        .populate('staffId', 'fullName role')
        .sort({ date: -1 });
    };



    return await fetcher();
  }

  async updateAdjustments(id: string, penalties: any, bonuses: any, notes: string, userId: string) {
    const record = await StaffAttendanceTracking.findByIdAndUpdate(
      id,
      { bonuses, notes, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).populate('staffId', 'fullName role');

    if (!record) throw new Error('Запись не найдена');
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
