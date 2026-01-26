import mongoose from 'mongoose';
import StaffAttendanceTracking from './model';
import { IStaffAttendanceTracking } from './model';
import User from '../users/model';
import Group from '../groups/model';
import Shift from '../staffShifts/model';
import Payroll from '../payroll/model';
import { SettingsService } from '../settings/service';
import { sendLogToTelegram } from '../../utils/telegramLogger';
import { sendTelegramNotificationToRoles } from '../../utils/telegramNotifications';




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
    const settingsService = new SettingsService();
    const geoSettings = await settingsService.getGeolocationSettings();
    if (geoSettings && geoSettings.enabled) {
      const distance = this.calculateDistance(
        locationData.latitude,
        locationData.longitude,
        geoSettings.coordinates.latitude,
        geoSettings.coordinates.longitude
      );

      console.log(`[GEOFENCING] Проверка координат (API):
        - Текущие: ${locationData.latitude}, ${locationData.longitude}
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

  async clockIn(userId: string, locationData: { latitude: number, longitude: number, accuracy?: number }, notes?: string) {
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

    console.log(`[CLOCK-IN] User: ${userId}, AlmatyDay: ${almatyDay.toISOString()}, Now (UTC): ${now.toISOString()}, Location: ${locationData.latitude}, ${locationData.longitude}`);

    // Проверка геозоны
    await this.verifyGeofencing(locationData);

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
      const almatyTimeStr = new Date().toLocaleTimeString('ru-RU', { timeZone: 'Asia/Almaty', hour: '2-digit', minute: '2-digit' });
      const almatyDateStr = new Date().toLocaleDateString('ru-RU', { timeZone: 'Asia/Almaty' });

      const escapedName = (attendanceRecord.staffId as any)?.fullName ?
        require('../../utils/telegramLogger').escapeHTML((attendanceRecord.staffId as any).fullName) : 'Сотрудник';

      const message = `👤 <b>${escapedName}</b> отметил <b>ПРИХОД</b> на работу\n🕒 Время: ${almatyDateStr} в ${almatyTimeStr}`;

      await sendTelegramNotificationToRoles(message, ['admin', 'manager', 'director']);
    } catch (e) {
      console.error('Telegram notify error (clockIn):', e);
    }

    return {
      message: 'Successfully clocked in',
      attendanceRecord
    };
  }

  async clockOut(userId: string, locationData: { latitude: number, longitude: number, accuracy?: number }, photo?: string, notes?: string) {
    try {
      const user = await User.findById(userId);
      if (user) {
        await sendLogToTelegram(`Сотрудник ${user.fullName} отметил уход с работы`);
      }
    } catch (e) {
      console.error('Telegram notify error (clockOut):', e);
    }

    // Проверка геозоны перед уходом
    await this.verifyGeofencing(locationData);

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

      await sendTelegramNotificationToRoles(message, ['admin', 'manager', 'director']);
    } catch (e) {
      console.error('Telegram notify error (clockOut):', e);
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

    const fetcher = async () => {
      const records = await StaffAttendanceTracking.find(filter)
        .populate('staffId', 'fullName role penaltyType penaltyAmount')
        .sort({ date: -1 });

      // Рассчитываем штрафы (penalties) на лету на основе lateMinutes и настроек сотрудника
      return await Promise.all(records.map(record => this._applyPenalties(record)));
    };


    return await fetcher();
  }

  async getById(id: string) {
    const record = await StaffAttendanceTracking.findById(id)
      .populate('staffId', 'fullName role penaltyType penaltyAmount');

    if (!record) {
      throw new Error('Запись посещаемости сотрудника не найдена');
    }

    return await this._applyPenalties(record);
  }

  private async _applyPenalties(record: any) {
    const doc = record.toObject();
    const staff = record.staffId as any;
    let penalties = 0;

    if (doc.lateMinutes > 0 && staff) {
      const settingsService = new SettingsService();
      const settings = await settingsService.getKindergartenSettings();
      const amount = settings?.payroll?.latePenaltyRate || 50;
      const type = settings?.payroll?.latePenaltyType || 'per_minute';

      if (type === 'fixed') {
        penalties = amount;
      } else if (type === 'per_minute') {
        // Если ставка за минуту, пользователь считает, что 10 мин = 500 тг (т.е. 50/мин)
        // Если база 50, то 10 * 50 = 500. Работает верно.
        penalties = doc.lateMinutes * amount;
      } else if (type === 'per_5_minutes') {
        penalties = Math.ceil(doc.lateMinutes / 5) * amount;
      } else if (type === 'per_10_minutes') {
        penalties = Math.ceil(doc.lateMinutes / 10) * amount;
      } else {
        penalties = doc.lateMinutes * amount;
      }
      // Ограничение штрафа ценой смены (дневным окладом)
      const baseSalary = staff.baseSalary || 180000;
      const salaryType = staff.baseSalaryType || 'month';
      const shiftRate = staff.shiftRate || 0;

      let dailyRate = 0;
      if (salaryType === 'shift') {
        // Если shiftRate не задан, используем baseSalary как ставку за смену
        dailyRate = shiftRate > 0 ? shiftRate : baseSalary;
      } else {
        // Примерный расчет дневной ставки (среднее 22 рабочих дня)
        dailyRate = Math.round(baseSalary / 22);
      }

      if (penalties > dailyRate && dailyRate > 0) {
        penalties = dailyRate;
      }
    }

    return { ...doc, penalties };
  }

  async create(recordData: Partial<IStaffAttendanceTracking>, userId: string) {

    if (!recordData.staffId) {
      throw new Error('Не указан сотрудник');
    }
    if (!recordData.date) {
      throw new Error('Не указана дата');
    }


    const staff = await getUserModel().findById(recordData.staffId);
    if (!staff) {
      throw new Error('Сотрудник не найден');
    }


    const record = new StaffAttendanceTracking({
      ...recordData
    });

    await record.save();

    const populatedRecord = await StaffAttendanceTracking.findById(record._id)
      .populate('staffId', 'fullName role penaltyType penaltyAmount');

    return populatedRecord ? await this._applyPenalties(populatedRecord) : null;
  }

  async update(id: string, data: Partial<IStaffAttendanceTracking>) {
    // Use findById + save to trigger Mongoose post-save hook
    // which recalculates payroll for the staff member
    const record = await StaffAttendanceTracking.findById(id);

    if (!record) {
      throw new Error('Запись посещаемости сотрудника не найдена');
    }

    // Получаем настройки для рабочих часов
    const settingsService = new (await import('../settings/service')).SettingsService();
    const settings = await settingsService.getKindergartenSettings();
    const workingStart = settings?.workingHours?.start || '09:00';
    const workingEnd = settings?.workingHours?.end || '18:00';

    // Update fields
    Object.assign(record, data);

    // Пересчитываем lateMinutes если изменился actualStart
    if (data.actualStart !== undefined) {
      if (data.actualStart) {
        const actualStartDate = new Date(data.actualStart);
        // Получаем часы и минуты прихода в Алматы
        const almatyTimeStr = actualStartDate.toLocaleTimeString('en-GB', { timeZone: 'Asia/Almaty', hour12: false });
        const [curH, curM] = almatyTimeStr.split(':').map(Number);
        const [h, m] = workingStart.split(':').map(Number);

        const currentTotalMinutes = curH * 60 + curM;
        const scheduledTotalMinutes = h * 60 + m;

        const latenessMinutes = Math.max(0, currentTotalMinutes - scheduledTotalMinutes);
        record.lateMinutes = latenessMinutes;

        console.log(`[UPDATE] Пересчет lateMinutes: приход=${almatyTimeStr}, начало=${workingStart}, опоздание=${latenessMinutes} мин`);
      } else {
        // Если actualStart удалён, обнуляем lateMinutes
        record.lateMinutes = 0;
      }
    }

    // Пересчитываем earlyLeaveMinutes если изменился actualEnd
    if (data.actualEnd !== undefined) {
      if (data.actualEnd) {
        const actualEndDate = new Date(data.actualEnd);
        // Получаем часы и минуты ухода в Алматы
        const almatyTimeStr = actualEndDate.toLocaleTimeString('en-GB', { timeZone: 'Asia/Almaty', hour12: false });
        const [curH, curM] = almatyTimeStr.split(':').map(Number);
        const [h, m] = workingEnd.split(':').map(Number);

        const currentTotalMinutes = curH * 60 + curM;
        const scheduledTotalMinutes = h * 60 + m;

        const earlyMinutes = Math.max(0, scheduledTotalMinutes - currentTotalMinutes);
        record.earlyLeaveMinutes = earlyMinutes;

        console.log(`[UPDATE] Пересчет earlyLeaveMinutes: уход=${almatyTimeStr}, конец=${workingEnd}, ранний уход=${earlyMinutes} мин`);
      } else {
        record.earlyLeaveMinutes = 0;
      }
    }

    // Пересчитываем workDuration если есть оба времени
    if (record.actualStart && record.actualEnd) {
      const startMs = new Date(record.actualStart).getTime();
      const endMs = new Date(record.actualEnd).getTime();
      record.workDuration = Math.max(0, Math.floor((endMs - startMs) / 60000)); // в минутах
    }

    // Save triggers post-save hook which recalculates payroll
    await record.save();

    // Populate and return
    const updatedRecord = await StaffAttendanceTracking.findById(id)
      .populate('staffId', 'fullName role penaltyType penaltyAmount');

    return updatedRecord ? await this._applyPenalties(updatedRecord) : null;
  }

  async delete(id: string) {
    const result = await StaffAttendanceTracking.findByIdAndDelete(id);

    if (!result) {
      throw new Error('Запись посещаемости сотрудника не найдена');
    }

    return { message: 'Запись посещаемости сотрудника успешно удалена' };
  }

  /**
   * Массовое обновление записей посещаемости
   * @param ids массив ID записей для обновления
   * @param data данные для обновления (timeStart, timeEnd как строки HH:mm, notes)
   */
  async bulkUpdate(ids: string[], data: { timeStart?: string; timeEnd?: string; actualStart?: Date | string; actualEnd?: Date | string; notes?: string }) {
    if (!ids || ids.length === 0) {
      throw new Error('Нужно выбрать хотя бы одну запись');
    }

    // Получаем настройки для рабочих часов
    const settingsService = new (await import('../settings/service')).SettingsService();
    const settings = await settingsService.getKindergartenSettings();
    const workingStart = settings?.workingHours?.start || '09:00';
    const workingEnd = settings?.workingHours?.end || '18:00';

    const results: any[] = [];
    const errors: any[] = [];
    const affectedStaffPeriods = new Set<string>(); // Для единого пересчета зарплаты

    for (const id of ids) {
      try {
        const record = await StaffAttendanceTracking.findById(id);
        if (!record) {
          errors.push({ id, error: 'Запись не найдена' });
          continue;
        }

        // Получаем дату записи в формате YYYY-MM-DD
        const recordDate = record.date ?
          new Date(record.date).toISOString().split('T')[0] :
          new Date().toISOString().split('T')[0];

        // Формируем объект обновления
        const updateFields: any = {};

        // Обновляем actualStart — используем дату записи + переданное время
        if (data.timeStart !== undefined && data.timeStart) {
          updateFields.actualStart = new Date(`${recordDate}T${data.timeStart}:00`);

          // Пересчитываем lateMinutes
          const [curH, curM] = data.timeStart.split(':').map(Number);
          const [h, m] = workingStart.split(':').map(Number);
          updateFields.lateMinutes = Math.max(0, (curH * 60 + curM) - (h * 60 + m));
        } else if (data.actualStart !== undefined) {
          updateFields.actualStart = data.actualStart ? new Date(data.actualStart) : null;
          if (updateFields.actualStart) {
            const almatyTimeStr = updateFields.actualStart.toLocaleTimeString('en-GB', { timeZone: 'Asia/Almaty', hour12: false });
            const [curH, curM] = almatyTimeStr.split(':').map(Number);
            const [h, m] = workingStart.split(':').map(Number);
            updateFields.lateMinutes = Math.max(0, (curH * 60 + curM) - (h * 60 + m));
          } else {
            updateFields.lateMinutes = 0;
          }
        }

        // Обновляем actualEnd — используем дату записи + переданное время
        if (data.timeEnd !== undefined && data.timeEnd) {
          updateFields.actualEnd = new Date(`${recordDate}T${data.timeEnd}:00`);

          // Пересчитываем earlyLeaveMinutes
          const [curH, curM] = data.timeEnd.split(':').map(Number);
          const [h, m] = workingEnd.split(':').map(Number);
          updateFields.earlyLeaveMinutes = Math.max(0, (h * 60 + m) - (curH * 60 + curM));
        } else if (data.actualEnd !== undefined) {
          updateFields.actualEnd = data.actualEnd ? new Date(data.actualEnd) : null;
          if (updateFields.actualEnd) {
            const almatyTimeStr = updateFields.actualEnd.toLocaleTimeString('en-GB', { timeZone: 'Asia/Almaty', hour12: false });
            const [curH, curM] = almatyTimeStr.split(':').map(Number);
            const [h, m] = workingEnd.split(':').map(Number);
            updateFields.earlyLeaveMinutes = Math.max(0, (h * 60 + m) - (curH * 60 + curM));
          } else {
            updateFields.earlyLeaveMinutes = 0;
          }
        }

        if (data.notes !== undefined) {
          updateFields.notes = data.notes;
        }

        // Пересчитываем workDuration
        const finalStart = updateFields.actualStart !== undefined ? updateFields.actualStart : record.actualStart;
        const finalEnd = updateFields.actualEnd !== undefined ? updateFields.actualEnd : record.actualEnd;
        if (finalStart && finalEnd) {
          const startMs = new Date(finalStart).getTime();
          const endMs = new Date(finalEnd).getTime();
          updateFields.workDuration = Math.max(0, Math.floor((endMs - startMs) / 60000));
        }

        // Используем findByIdAndUpdate чтобы НЕ вызывать post-save хуки
        await StaffAttendanceTracking.findByIdAndUpdate(id, { $set: updateFields });

        const updatedRecord = await StaffAttendanceTracking.findById(id)
          .populate('staffId', 'fullName role');

        results.push(updatedRecord);

        // Собираем данные для единого пересчета зарплаты
        const attendanceDate = record.date || new Date();
        const period = `${attendanceDate.getFullYear()}-${String(attendanceDate.getMonth() + 1).padStart(2, '0')}`;
        affectedStaffPeriods.add(`${record.staffId.toString()}|${period}`);
      } catch (e: any) {
        errors.push({ id, error: e.message });
      }
    }


    console.log(`[BULK-UPDATE] Обновлено ${results.length} записей, ошибок: ${errors.length}`);

    // Единый пересчет зарплаты ПОСЛЕ всех обновлений
    try {
      const { PayrollService } = await import('../payroll/service');
      const payrollService = new PayrollService();

      for (const staffPeriod of affectedStaffPeriods) {
        const [staffId, period] = staffPeriod.split('|');
        await payrollService.ensurePayrollForUser(staffId, period);
        console.log(`[BULK-UPDATE] Payroll recalculated for staff ${staffId} period ${period}`);
      }
    } catch (payrollError) {
      console.error('[BULK-UPDATE] Error recalculating payroll:', payrollError);
    }

    return {
      success: results.length,
      errors: errors.length,
      results,
      errorDetails: errors
    };
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

    const fetcher = async () => {
      const records = await StaffAttendanceTracking.find(filter)
        .populate('staffId', 'fullName role')
        .sort({ date: -1 });

      return records;
    };

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


    const fetcher = async () => {
      const records = await StaffAttendanceTracking.find(filter)
        .populate('staffId', 'fullName role')
        .sort({ date: -1 });

      return records;
    };


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
