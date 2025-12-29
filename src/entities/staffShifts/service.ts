import mongoose, { Types } from 'mongoose';
import { IShift } from './model';
import Shift from './model';
import StaffAttendanceTracking from '../staffAttendanceTracking/model';
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

    const cacheKey = `${CACHE_KEY_PREFIX}:getAll:${userId}:${role}:${JSON.stringify(filters)}`;
    return await cacheService.getOrSet(cacheKey, async () => {
      const shifts = await Shift.find(filter)
        .populate('staffId', 'fullName role')
        .populate('createdBy', 'fullName')
        .sort({ date: 1, createdAt: -1 });

      return shifts;
    }, CACHE_TTL);
  }



  async create(shiftData: any, userId: string) {


    const staffId = shiftData.staffId || shiftData.userId;
    if (!staffId) {
      throw new Error('Не указан ID сотрудника');
    }
    if (!shiftData.date) {
      throw new Error('Не указана дата смены');
    }



    if (!shiftData.status) {
      shiftData.status = 'pending_approval';
    }

    const newShiftData = {
      ...shiftData,
      staffId: staffId,
      createdBy: userId
    };


    delete newShiftData.type;
    delete newShiftData.userId;


    if (typeof newShiftData.staffId === 'string') {

      const objectIdRegex = /^[0-9a-fA-F]{24}$/;
      if (!objectIdRegex.test(newShiftData.staffId)) {
        throw new Error('Неверный формат ID сотрудника. Должен быть 24-символьный шестнадцатеричный код.');
      }
      newShiftData.staffId = new mongoose.Types.ObjectId(newShiftData.staffId);
    }


    if (typeof newShiftData.alternativeStaffId === 'string' && newShiftData.alternativeStaffId.trim() !== '') {

      const objectIdRegex = /^[0-9a-fA-F]{24}$/;
      if (!objectIdRegex.test(newShiftData.alternativeStaffId)) {
        throw new Error('Неверный формат ID альтернативного сотрудника. Должен быть 24-символьный шестнадцатеричный код.');
      }
      newShiftData.alternativeStaffId = new mongoose.Types.ObjectId(newShiftData.alternativeStaffId);
    } else if (newShiftData.alternativeStaffId === '' || newShiftData.alternativeStaffId === null || newShiftData.alternativeStaffId === undefined) {

      delete newShiftData.alternativeStaffId;
    }



    if (typeof newShiftData.createdBy === 'string') {

      const objectIdRegex = /^[0-9a-fA-F]{24}$/;
      if (!objectIdRegex.test(newShiftData.createdBy)) {
        throw new Error('Неверный формат ID пользователя. Должен быть 24-символьный шестнадцатеричный код.');
      }
      newShiftData.createdBy = new mongoose.Types.ObjectId(newShiftData.createdBy);
    }


    const existingShift = await Shift.findOne({
      staffId: newShiftData.staffId,
      date: newShiftData.date,
      _id: { $ne: newShiftData._id }
    });

    if (existingShift) {
      throw new Error('У сотрудника уже есть смена в этот день');
    }

    const shift = new Shift(newShiftData);
    await shift.save();

    const populatedShift = await Shift.findById(shift._id)
      .populate('staffId', 'fullName role')
      .populate('createdBy', 'fullName');

    await cacheService.invalidate(`${CACHE_KEY_PREFIX}:*`);
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


        delete newShiftData.type;


        if (typeof newShiftData.staffId === 'string') {
          newShiftData.staffId = new mongoose.Types.ObjectId(newShiftData.staffId);
        }



        if (typeof newShiftData.alternativeStaffId === 'string' && newShiftData.alternativeStaffId.trim() !== '') {

          const objectIdRegex = /^[0-9a-fA-F]{24}$/;
          if (!objectIdRegex.test(newShiftData.alternativeStaffId)) {
            throw new Error('Неверный формат ID альтернативного сотрудника. Должен быть 24-символьный шестнадцатеричный код.');
          }
          newShiftData.alternativeStaffId = new mongoose.Types.ObjectId(newShiftData.alternativeStaffId);
        } else if (newShiftData.alternativeStaffId === '' || newShiftData.alternativeStaffId === null || newShiftData.alternativeStaffId === undefined) {

          delete newShiftData.alternativeStaffId;
        }



        if (typeof newShiftData.createdBy === 'string') {
          newShiftData.createdBy = new mongoose.Types.ObjectId(newShiftData.createdBy);
        }


        const existingShift = await Shift.findOne({
          staffId: newShiftData.staffId,
          date: newShiftData.date,
          _id: { $ne: newShiftData._id }
        });

        if (existingShift) {
          throw new Error('У сотрудника уже есть смена в этот день');
        }


        if (!newShiftData.staffId) {
          throw new Error('Не указан ID сотрудника');
        }
        if (!newShiftData.date) {
          throw new Error('Не указана дата смены');
        }
        if (!newShiftData.status) {
          newShiftData.status = 'pending_approval';
        }

        const shift = new Shift(newShiftData);
        await shift.save();

        const populatedShift = await Shift.findById(shift._id)
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

    if (createdShifts.length > 0) {
      await cacheService.invalidate(`${CACHE_KEY_PREFIX}:*`);
    }

    return {
      success: createdShifts.length,
      failed: errors.length,
      errors,
      createdShifts
    };
  }

  async update(id: string, data: any) {

    const shift = await Shift.findById(id);

    if (!shift) {
      throw new Error('Смена не найдена');
    }


    if (data.date && data.staffId) {

      let staffIdForQuery = data.staffId;
      if (typeof data.staffId === 'string') {
        const objectIdRegex = /^[0-9a-fA-F]{24}$/;
        if (!objectIdRegex.test(data.staffId)) {
          throw new Error('Неверный формат ID сотрудника. Должен быть 24-символьный шестнадцатеричный код.');
        }
        staffIdForQuery = new mongoose.Types.ObjectId(data.staffId);
      }

      const existingShift = await Shift.findOne({
        staffId: staffIdForQuery,
        date: data.date,
        _id: { $ne: id }
      });

      if (existingShift) {
        throw new Error('У сотрудника уже есть смена в этот день');
      }
    }


    if (data.staffId) {

      if (typeof data.staffId === 'string') {
        const objectIdRegex = /^[0-9a-fA-F]{24}$/;
        if (!objectIdRegex.test(data.staffId)) {
          throw new Error('Неверный формат ID сотрудника. Должен быть 24-символьный шестнадцатеричный код.');
        }
        data.staffId = new mongoose.Types.ObjectId(data.staffId);
      }
    }

    if (data.alternativeStaffId !== undefined && data.alternativeStaffId !== null && data.alternativeStaffId !== '') {

      if (typeof data.alternativeStaffId === 'string') {
        const objectIdRegex = /^[0-9a-fA-F]{24}$/;
        if (!objectIdRegex.test(data.alternativeStaffId)) {
          throw new Error('Неверный формат ID альтернативного сотрудника. Должен быть 24-символьный шестнадцатеричный код.');
        }
        data.alternativeStaffId = new mongoose.Types.ObjectId(data.alternativeStaffId);
      }
    } else {

      delete data.alternativeStaffId;
    }


    if (data.createdBy) {

      if (typeof data.createdBy === 'string') {
        const objectIdRegex = /^[0-9a-fA-F]{24}$/;
        if (!objectIdRegex.test(data.createdBy)) {
          throw new Error('Неверный формат ID пользователя. Должен быть 24-символьный шестнадцатеричный код.');
        }
        data.createdBy = new mongoose.Types.ObjectId(data.createdBy);
      }
    }


    if (shift.status === 'pending_approval' && data.status === 'scheduled') {


      data.createdBy = data.createdBy || shift.createdBy;
    }


    const allowedFields = [
      'date', 'status', 'breakTime', 'overtimeMinutes',
      'lateMinutes', 'earlyLeaveMinutes', 'notes', 'createdBy', 'alternativeStaffId'
    ];

    for (const field of allowedFields) {
      if (data.hasOwnProperty(field)) {
        shift.set(field, data[field]);
      }
    }


    await shift.save();


    await shift.populate('staffId', 'fullName role');
    await shift.populate('createdBy', 'fullName');

    await cacheService.invalidate(`${CACHE_KEY_PREFIX}:*`);
    return shift;
  }

  async delete(id: string) {
    const shift = await Shift.findByIdAndDelete(id);

    if (!shift) {
      throw new Error('Смена не найдена');
    }
    await cacheService.invalidate(`${CACHE_KEY_PREFIX}:*`);
    return shift;
  }

  async bulkDelete(ids: string[]) {
    const result = await Shift.deleteMany({ _id: { $in: ids } });
    await cacheService.invalidate(`${CACHE_KEY_PREFIX}:*`);
    return {
      success: result.deletedCount,
      ids
    };
  }

  async checkIn(shiftId: string, userId: string, role: string, locationData?: { latitude: number, longitude: number }) {

    let shift = null;

    if (shiftId) {
      try {
        shift = await Shift.findById(shiftId);

        if (shift && !shift.staffId.equals(new mongoose.Types.ObjectId(userId)) &&
          (!shift.alternativeStaffId || !shift.alternativeStaffId.equals(new mongoose.Types.ObjectId(userId))) &&
          role !== 'admin' && role !== 'teacher') {
          shift = null;
        }
      } catch (e) {

        console.error('Error finding shift by ID:', e);
      }
    }


    if (!shift) {
      const today = new Date().toISOString().split('T')[0];
      shift = await Shift.findOne({
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
    const timezone = settings?.timezone || 'Asia/Almaty';


    const now = new Date();
    const currentTime = now.toLocaleTimeString('en-GB', { timeZone: timezone }).slice(0, 5);


    const shiftStartTime = new Date(`${shift.date} ${settings?.workingHours?.start || '09:00'}`);
    const shiftEndTime = new Date(`${shift.date} ${settings?.workingHours?.end || '18:00'}`);
    const actualStartTime = new Date(`${shift.date} ${currentTime}`);


    const lateMinutes = Math.max(0, Math.floor((actualStartTime.getTime() - shiftStartTime.getTime()) / (1000 * 60)));


    if (lateMinutes >= 15) {
      shift.set('status', 'late');
    } else {

      if (actualStartTime.getTime() > shiftEndTime.getTime()) {
        shift.set('status', 'in_progress');
        await shift.save();

        let timeTracking = await StaffAttendanceTracking.findOne({
          staffId: userId,
          date: shift.date
        });

        if (!timeTracking) {
          timeTracking = new StaffAttendanceTracking({
            staffId: userId,
            date: shift.date
          });
        }
        timeTracking.actualStart = now;

        timeTracking.notes = timeTracking.notes
          ? `${timeTracking.notes}\nОтметка после окончания смены`
          : 'Отметка после окончания смены';
        await timeTracking.save();

        return { shift, timeTracking, message: 'Отметка после окончания смены. Смена помечена как начатая.' };
      }


      shift.set('status', 'in_progress');
    }


    await shift.save();


    let timeTracking = await StaffAttendanceTracking.findOne({
      staffId: userId,
      date: shift.date
    });

    if (!timeTracking) {
      timeTracking = new StaffAttendanceTracking({
        staffId: userId,
        date: shift.date
      });
    }


    const astanaTime = new Date(now.toLocaleString("en-US", { timeZone: timezone }));
    timeTracking.actualStart = astanaTime;


    if (lateMinutes > 0) {

      const payroll = await Payroll.findOne({ staffId: userId });
      // const penaltyRate = payroll?.penaltyDetails?.amount || 50;
      // const penaltyAmount = lateMinutes * penaltyRate;
      // timeTracking.penalties = { ... };
      timeTracking.lateMinutes = lateMinutes;
    }

    await timeTracking.save();

    await cacheService.invalidate(`${CACHE_KEY_PREFIX}:*`);
    return { shift, timeTracking, message: lateMinutes >= 15 ? 'Опоздание на смену' : 'Успешно отмечен приход' };
  }

  async checkOut(shiftId: string, userId: string, role: string, locationData?: { latitude: number, longitude: number }) {

    let shift = null;

    if (shiftId) {
      try {
        shift = await Shift.findById(shiftId);

        if (shift && !shift.staffId.equals(new mongoose.Types.ObjectId(userId)) &&
          (!shift.alternativeStaffId || !shift.alternativeStaffId.equals(new mongoose.Types.ObjectId(userId))) &&
          role !== 'admin' && role !== 'manager') {
          shift = null;
        }
      } catch (e) {

        console.error('Error finding shift by ID:', e);
      }
    }


    if (!shift) {
      const today = new Date().toISOString().split('T')[0];
      shift = await Shift.findOne({
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


    const settings = await settingsService.getKindergartenSettings();
    const timezone = settings?.timezone || 'Asia/Almaty';


    const now = new Date();
    const currentTime = now.toLocaleTimeString('en-GB', { timeZone: timezone }).slice(0, 5);


    shift.set('status', 'completed');

    await shift.save();


    const timeTracking = await StaffAttendanceTracking.findOne({
      staffId: userId,
      date: shift.date
    });

    if (timeTracking) {

      const astanaTime = new Date(now.toLocaleString("en-US", { timeZone: timezone }));
      timeTracking.actualEnd = astanaTime;

      if (timeTracking.actualStart) {
        const duration = astanaTime.getTime() - timeTracking.actualStart.getTime();
        timeTracking.workDuration = Math.floor(duration / (1000 * 60)) - (timeTracking.breakDuration || 0);
      }


      const shiftStartTime = new Date(`${shift.date} ${settings?.workingHours?.start || '09:00'}`);
      const shiftEndTime = new Date(`${shift.date} ${settings?.workingHours?.end || '18:00'}`);
      const actualStartTime = new Date(`${shift.date} ${timeTracking.actualStart?.toLocaleTimeString('en-GB', { timeZone: timezone }).slice(0, 5) || currentTime}`);
      const actualEndTime = new Date(`${shift.date} ${currentTime}`);


      const earlyMinutes = Math.max(0, Math.floor((shiftEndTime.getTime() - actualEndTime.getTime()) / (1000 * 60)));


      const lateMinutes = Math.max(0, Math.floor((actualStartTime.getTime() - shiftStartTime.getTime()) / (1000 * 60)));


      if (earlyMinutes > 0) {

        const payroll = await Payroll.findOne({ staffId: userId });
        // const penaltyRate = payroll?.penaltyDetails?.amount || 500;
        // const penaltyAmount = earlyMinutes * penaltyRate;
        // timeTracking.penalties.earlyLeave = ...
        timeTracking.earlyLeaveMinutes = earlyMinutes;
      }


      if (lateMinutes > 0) {

        const payroll = await Payroll.findOne({ staffId: userId });
        // const penaltyRate = payroll?.penaltyDetails?.amount || 50;
        // const penaltyAmount = lateMinutes * penaltyRate;
        // timeTracking.penalties.late = ...
        timeTracking.lateMinutes = lateMinutes;
      }


      const lateCheckoutMinutes = Math.max(0, Math.floor((actualEndTime.getTime() - shiftEndTime.getTime()) / (1000 * 60)));
      if (lateCheckoutMinutes > 0) {
        // const payroll = await Payroll.findOne({ staffId: userId });
        // const penaltyRate = payroll?.penaltyDetails?.amount || 500;
        // const penaltyAmount = lateCheckoutMinutes * penaltyRate;
        // timeTracking.penalties.unauthorized = ...
      }

      await timeTracking.save();
    }


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

    await cacheService.invalidate(`${CACHE_KEY_PREFIX}:*`);
    return { shift, message: 'Успешно отмечен уход' };
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

    const cacheKey = `${CACHE_KEY_PREFIX}:getTimeTracking:${userId}:${role}:${JSON.stringify(filters)}`;
    return await cacheService.getOrSet(cacheKey, async () => {
      return await StaffAttendanceTracking.find(filter)
        .populate('staffId', 'fullName role')
        .populate('shiftId')
        .sort({ date: -1 });
    }, CACHE_TTL);
  }

  async updateAdjustments(id: string, penalties: any, bonuses: any, notes: string, userId: string) {
    const record = await StaffAttendanceTracking.findByIdAndUpdate(
      id,
      {
        penalties, // This argument is likely unused now, but keeping signature. Wait, model doesn't have penalties.
        bonuses,
        notes
        // approvedBy: userId,
        // approvedAt: new Date()
      },
      { new: true }
    ).populate('staffId', 'fullName role');

    if (!record) {
      throw new Error('Запись не найдена');
    }

    await cacheService.invalidate(`${CACHE_KEY_PREFIX}:*`);
    return record;
  }


  async updateLateShifts() {
    try {

      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];

      const shifts = await Shift.find({
        date: todayStr,
        status: { $in: ['scheduled', 'in_progress'] }
      });

      const results = [];

      for (const shift of shifts) {

        const settings = await settingsService.getKindergartenSettings();
        const shiftStartTime = new Date(`${shift.date} ${settings?.workingHours?.start || '09:00'}`);


        const timeSinceShiftStart = (today.getTime() - shiftStartTime.getTime()) / (1000 * 60);


        if (timeSinceShiftStart >= 15) {

          const timeTracking = await StaffAttendanceTracking.findOne({
            staffId: shift.staffId,
            date: new Date(shift.date)
          });

          if (!timeTracking || !timeTracking.actualStart) {


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
