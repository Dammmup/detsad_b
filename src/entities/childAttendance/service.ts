import { IChildAttendance } from './model';
import ChildAttendance from './model';
import Group from '../groups/model';
import Shift from '../staffShifts/model';
import User from '../users/model';
import mongoose from 'mongoose';
import Child from '../children/model';
import { SettingsService } from '../settings/service';
import { sendLogToTelegram } from '../../utils/telegramLogger';
import { cacheService } from '../../services/cache';

const CACHE_KEY_PREFIX = 'childAttendance';
const CACHE_TTL = 300; // 5 minutes



export class ChildAttendanceService {
  adminChatId = process.env.TELEGRAM_CHAT_ID;

  async getAll(filters: { groupId?: string, childId?: string, date?: string, startDate?: string, endDate?: string, status?: string }, userId: string, role: string) {
    const filter: any = {};

    if (role === 'teacher' || role === 'assistant') {
      if (filters.groupId) {
        filter['attendance'] = { $elemMatch: { groupId: filters.groupId } };
      } else {
        const teacherGroups = await Group.find({ teacherId: userId });
        const groupIds = teacherGroups.map(g => g._id);
        filter['attendance'] = { $elemMatch: { groupId: { $in: groupIds } } };
      }
    } else if (filters.groupId) {
      filter['attendance'] = { $elemMatch: { groupId: filters.groupId } };
    }

    if (filters.childId) {
      filter.childId = filters.childId;
    }

    const cacheKey = `${CACHE_KEY_PREFIX}:getAll:${userId}:${role}:${JSON.stringify(filters)}`;
    const results = await cacheService.getOrSet(cacheKey, async () => {
      return await ChildAttendance.find(filter);
    }, CACHE_TTL);

    // Flattening for frontend compatibility
    const flattened: any[] = [];
    results.forEach((doc: any) => {
      doc.attendance.forEach((detail: any, date: string) => {
        // Apply date filters if any
        let include = true;
        if (filters.date && date !== filters.date) include = false;
        if (filters.startDate && date < filters.startDate) include = false;
        if (filters.endDate && date > filters.endDate) include = false;
        if (filters.status && detail.status !== filters.status) include = false;

        // Filter by groupId if needed after flattening (since elemMatch is at document level)
        if (filters.groupId && detail.groupId.toString() !== filters.groupId) include = false;

        if (include) {
          flattened.push({
            ...detail.toObject ? detail.toObject() : detail,
            _id: `${doc.childId}_${date}`,
            childId: doc.childId,
            date: date,
          });
        }
      });
    });

    return flattened.sort((a, b) => b.date.localeCompare(a.date));
  }

  async createOrUpdate(attendanceData: any, userId: string) {
    const { childId, groupId, date, status, actualStart, actualEnd, notes } = attendanceData;

    if (!childId || !groupId || !date || !status) {
      throw new Error('Обязательные поля: childId, groupId, date, status');
    }

    const canMarkAttendance = await this.checkAttendancePermission(userId, groupId, date);
    if (!canMarkAttendance) {
      throw new Error('Нет прав для отметки посещаемости в этой группе');
    }

    const dateStr = date.split('T')[0];

    let doc = await ChildAttendance.findOne({ childId });
    if (!doc) {
      doc = new ChildAttendance({ childId, attendance: {} });
    }

    const newDetail = {
      groupId,
      status,
      actualStart: actualStart ? new Date(actualStart) : undefined,
      actualEnd: actualEnd ? new Date(actualEnd) : undefined,
      notes,
      markedBy: userId
    };

    doc.attendance.set(dateStr, newDetail as any);
    await doc.save();

    try {
      if (this.adminChatId) {
        const child = await Child.findById(childId);
        const group = await Group.findById(groupId);
        const statusMap: any = {
          present: 'присутствует',
          absent: 'отсутствует',
          sick: 'болеет',
          vacation: 'в отпуске'
        };
        const timeStr = (new Date()).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
        const message = `Ребенок ${child?.fullName} из группы "${group?.name}" отмечен как ${statusMap[status] || status} в ${timeStr}`;
        await sendLogToTelegram(message);
      }
    } catch (e) {
      console.error('Telegram notify error:', e);
    }

    await cacheService.invalidate(`${CACHE_KEY_PREFIX}:*`);

    // Return flattened version for frontend
    return {
      ...newDetail,
      _id: `${childId}_${dateStr}`,
      childId,
      date: dateStr
    };
  }

  async bulkCreateOrUpdate(records: any[], groupId: string, userId: string) {
    if (!Array.isArray(records) || !groupId) {
      throw new Error('Требуется массив records и groupId');
    }

    const results: any[] = [];
    const errors: Array<{ record: any; error: string }> = [];

    // Group records by childId for efficiency
    const recordsByChild: Record<string, any[]> = {};
    for (const record of records) {
      const cid = record.childId.toString();
      if (!recordsByChild[cid]) recordsByChild[cid] = [];
      recordsByChild[cid].push(record);
    }

    for (const [childId, childRecords] of Object.entries(recordsByChild)) {
      try {
        let doc = await ChildAttendance.findOne({ childId });
        if (!doc) {
          doc = new ChildAttendance({ childId, attendance: {} });
        }

        for (const record of childRecords) {
          const { date, status, notes } = record;
          if (!date || !status) continue;

          const canMarkAttendance = await this.checkAttendancePermission(userId, groupId, date);
          if (!canMarkAttendance) continue;

          const dateStr = date.split('T')[0];
          const newDetail = {
            groupId,
            status,
            actualStart: record.actualStart ? new Date(record.actualStart) : undefined,
            actualEnd: record.actualEnd ? new Date(record.actualEnd) : undefined,
            notes,
            markedBy: userId
          };

          doc.attendance.set(dateStr, newDetail as any);
          results.push({ ...newDetail, childId, date: dateStr, _id: `${childId}_${dateStr}` });
        }

        await doc.save();
      } catch (err: any) {
        errors.push({ record: childRecords[0], error: err.message });
      }
    }

    try {
      if (this.adminChatId && results.length > 0) {
        const group = await Group.findById(groupId);
        const statusMap: any = {
          present: 'присутствует',
          absent: 'отсутствует',
          sick: 'болеет',
          vacation: 'в отпуске'
        };
        const timeStr = (new Date()).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
        const message = `Массовое обновление посещаемости для группы "${group?.name}" в ${timeStr}. Обновлено ${results.length} записей.`;
        await sendLogToTelegram(message);
      }
    } catch (e) {
      console.error('Telegram notify error:', e);
    }

    await cacheService.invalidate(`${CACHE_KEY_PREFIX}:*`);

    return {
      success: results.length,
      errorCount: errors.length,
      results,
      errors
    };
  }

  async getStats(filters: { groupId?: string, startDate?: string, endDate?: string }) {
    const cacheKey = `${CACHE_KEY_PREFIX}:stats:${JSON.stringify(filters)}`;
    return await cacheService.getOrSet(cacheKey, async () => {
      const records = await this.getAll(filters, 'admin', 'admin');

      const stats: Record<string, number> = {};
      records.forEach((r: any) => {
        stats[r.status] = (stats[r.status] || 0) + 1;
      });

      const total = records.length;
      return {
        total,
        byStatus: stats,
        attendanceRate: total > 0
          ? Math.round(((stats['present'] || 0) / total) * 100)
          : 0
      };
    }, CACHE_TTL);
  }

  async delete(id: string) {
    // Expected id format: "childId_dateStr"
    const [childId, dateStr] = id.split('_');
    if (!childId || !dateStr) {
      throw new Error('Неверный формат ID для удаления (ожидается childId_YYYY-MM-DD)');
    }

    const doc = await ChildAttendance.findOne({ childId });
    if (!doc || !doc.attendance.has(dateStr)) {
      throw new Error('Запись не найдена');
    }

    doc.attendance.delete(dateStr);
    await doc.save();

    await cacheService.invalidate(`${CACHE_KEY_PREFIX}:*`);
    return { message: 'Запись удалена успешно' };
  }

  async debug() {
    const totalRecords = await ChildAttendance.countDocuments();
    const recentRecords = await ChildAttendance.find()
      .sort({ updatedAt: -1 })
      .limit(5);

    return {
      totalRecords,
      recentRecords,
      collectionName: 'childattendances'
    };
  }

  private async checkAttendancePermission(userId: string, groupId: string, date: string): Promise<boolean> {
    const user = await User.findById(userId);
    if (user && (user.role === 'admin' || user.role === 'manager')) {
      return true;
    }

    const group = await Group.findById(groupId);
    if (group && (group.teacherId?.toString() === userId || group.assistantId?.toString() === userId)) {
      return true;
    }

    const shiftDate = date.split('T')[0];
    const shift = await Shift.findOne({
      $or: [
        { staffId: new mongoose.Types.ObjectId(userId), [`shifts.${shiftDate}`]: { $exists: true } },
        { [`shifts.${shiftDate}.alternativeStaffId`]: new mongoose.Types.ObjectId(userId) }
      ]
    });

    return !!shift;
  }
}
export const getChildAttendance = async (filters: { groupId?: string, childId?: string, date?: string, startDate?: string, endDate?: string, status?: string }, userId: string, role: string) => {
  const service = new ChildAttendanceService();
  return service.getAll(filters, userId, role);
};
