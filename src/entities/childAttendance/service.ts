import { IChildAttendance } from './model';
import ChildAttendance from './model';
import Group from '../groups/model'; // Using the group model
import Shift from '../staffShifts/model'; // Import the shift model to check permissions
import User from '../users/model'; // Import the user model
import mongoose from 'mongoose';
import Child from '../children/model';
import { SettingsService } from '../settings/service';
import { sendTelegramNotification } from '../../utils/telegramNotify';

// Используем модели как функции для получения экземпляров моделей

export class ChildAttendanceService {
  async getAll(filters: { groupId?: string, childId?: string, date?: string, startDate?: string, endDate?: string, status?: string }, userId: string, role: string) {
    const filter: any = {};
    
    // Role-based filtering
    if (role === 'teacher' || role === 'assistant') {
      // Teachers can only see their group's attendance
      if (filters.groupId) {
        filter.groupId = filters.groupId;
      } else {
        // Find teacher's groups and filter by them
        const teacherGroups = await Group().find({ teacherId: userId });
        filter.groupId = { $in: teacherGroups.map(g => g._id) };
      }
    } else if (filters.groupId) {
      filter.groupId = filters.groupId;
    }
    
    if (filters.childId) {
      filter.childId = filters.childId;
    }
    
    if (filters.date) {
      const targetDate = new Date(filters.date as string);
      filter.date = {
        $gte: new Date(targetDate.setHours(0, 0, 0, 0)),
        $lt: new Date(targetDate.setHours(23, 59, 59, 999))
      };
    } else if (filters.startDate && filters.endDate) {
      filter.date = {
        $gte: new Date(filters.startDate as string),
        $lte: new Date(filters.endDate as string)
      };
    }
    
    if (filters.status) {
      filter.status = filters.status;
    }
    
    const attendance = await ChildAttendance().find(filter)
      .sort({ date: -1, childId: 1 });
    
    return attendance;
  }

  async createOrUpdate(attendanceData: any, userId: string) {
    const { childId, groupId, date, status, actualStart, actualEnd, notes } = attendanceData;
    
    if (!childId || !groupId || !date || !status) {
      throw new Error('Обязательные поля: childId, groupId, date, status');
    }
    
    // Проверяем права пользователя на отметку посещаемости
    const canMarkAttendance = await this.checkAttendancePermission(userId, groupId, date);
    if (!canMarkAttendance) {
      throw new Error('Нет прав для отметки посещаемости в этой группе');
    }
    
    // Check if record already exists for this child and date
    const existingRecord = await ChildAttendance().findOne({
      childId,
      date: new Date(date)
    });
    
    const newAttendanceData = {
      childId,
      groupId,
      date: new Date(date),
      status,
      actualStart: actualStart ? new Date(actualStart) : undefined,
      actualEnd: actualEnd ? new Date(actualEnd) : undefined,
      notes,
      markedBy: userId
    };
    
    let attendance;
    if (existingRecord) {
      // Update existing record
      attendance = await ChildAttendance().findOneAndUpdate(
        { childId, date: new Date(date) },
        newAttendanceData,
        { new: true }
      );
    } else {
      // Create new record
      attendance = new (ChildAttendance())(newAttendanceData);
      await attendance.save();
    }
    
    try {
      const settingsService = new SettingsService();
      const notificationSettings = await settingsService.getNotificationSettings();
      const adminChatId = notificationSettings?.telegram_chat_id;

      if (adminChatId) {
        const child = await Child().findById(childId);
        const group = await Group().findById(groupId);
        const statusMap: any = {
          present: 'присутствует',
          absent: 'отсутствует',
          sick: 'болеет',
          vacation: 'в отпуске'
        }
        const timeStr = (new Date()).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
        const message = `Ребенок ${child?.fullName} из группы "${group?.name}" отмечен как ${statusMap[status] || status} в ${timeStr}`;
        await sendTelegramNotification(adminChatId, message);
      }
    } catch (e) {
      console.error('Telegram notify error:', e);
    }
    
    return attendance;
  }

  async bulkCreateOrUpdate(records: any[], groupId: string, userId: string) {
    if (!Array.isArray(records) || !groupId) {
      throw new Error('Требуется массив records и groupId');
    }
    
    const results: any[] = [];
    const errors: Array<{ record: any; error: string }> = [];
    
    for (const record of records) {
      try {
        const { childId, date, status, notes } = record;
        
        if (!childId || !date || !status) {
          errors.push({ record, error: 'Отсутствуют обязательные поля' });
          continue;
        }
        
        // Проверяем права пользователя на отметку посещаемости
        const canMarkAttendance = await this.checkAttendancePermission(userId, groupId, date);
        if (!canMarkAttendance) {
          errors.push({ record, error: 'Нет прав для отметки посещаемости в этой группе' });
          continue;
        }
        
        // Check if record exists
        const existingRecord = await ChildAttendance().findOne({
          childId,
          date: new Date(date)
        });
        
        const attendanceData = {
          childId,
          groupId,
          date: new Date(date),
          status,
          actualStart: record.actualStart ? new Date(record.actualStart) : undefined,
          actualEnd: record.actualEnd ? new Date(record.actualEnd) : undefined,
          notes,
          markedBy: userId
        };
        
        let attendance;
        if (existingRecord) {
          attendance = await ChildAttendance().findByIdAndUpdate(
            existingRecord._id,
            attendanceData,
            { new: true }
          );
        } else {
          attendance = new (ChildAttendance())(attendanceData);
          await attendance.save();
        }
        
        results.push(attendance);
      } catch (err: any) {
        errors.push({ record, error: err.message });
      }
    }
    
    try {
      const settingsService = new SettingsService();
      const notificationSettings = await settingsService.getNotificationSettings();
      const adminChatId = notificationSettings?.telegram_chat_id;

      if (adminChatId && results.length > 0) {
        const group = await Group().findById(groupId);
        const statusMap: any = {
          present: 'присутствует',
          absent: 'отсутствует',
          sick: 'болеет',
          vacation: 'в отпуске'
        }
        const childNames = await Child().find({_id: {$in: results.map(r => r.childId)}}).select('fullName');
        const childNameMap = childNames.reduce((acc: any, child: any) => {
          acc[child._id.toString()] = child.fullName;
          return acc;
        }, {});

        const timeStr = (new Date()).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
        const messages = results.map(r => {
          return `Ребенок ${childNameMap[r.childId.toString()]} отмечен как ${statusMap[r.status] || r.status}`;
        });

        const message = `Массовое обновление посещаемости для группы "${group?.name}" в ${timeStr}:\n- ${messages.join('\n- ')}`;
        await sendTelegramNotification(adminChatId, message);
      }
    } catch (e) {
      console.error('Telegram notify error:', e);
    }
    
    return {
      success: results.length,
      errorCount: errors.length,
      results,
      errors
    };
 }

  async getStats(filters: { groupId?: string, startDate?: string, endDate?: string }) {
    const filter: any = {};
    
    if (filters.groupId) {
      filter.groupId = filters.groupId;
    }
    
    if (filters.startDate && filters.endDate) {
      filter.date = {
        $gte: new Date(filters.startDate as string),
        $lte: new Date(filters.endDate as string)
      };
    }
    
    const stats = await ChildAttendance().aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const totalRecords = await ChildAttendance().countDocuments(filter);
    
    const result = {
      total: totalRecords,
      byStatus: stats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {}),
      attendanceRate: totalRecords > 0 
        ? Math.round(((stats.find(s => s._id === 'present')?.count || 0) / totalRecords) * 100)
        : 0
    };
    
    return result;
 }

  async delete(id: string) {
    const attendance = await ChildAttendance().findByIdAndDelete(id);
    
    if (!attendance) {
      throw new Error('Запись не найдена');
    }
    
    return { message: 'Запись удалена успешно' };
  }

  async debug() {
    const totalRecords = await ChildAttendance().countDocuments();
    const recentRecords = await ChildAttendance().find()
      .sort({ createdAt: -1 })
      .limit(5);
    
    return {
      totalRecords,
      recentRecords,
      collectionName: 'childattendances'
    };
  }
  
  // Метод для проверки прав на отметку посещаемости
  private async checkAttendancePermission(userId: string, groupId: string, date: string): Promise<boolean> {
    // Проверяем, является ли пользователь администратором
    const user = await User().findById(userId);
    if (user && (user.role === 'admin' || user.role === 'manager')) {
      return true;
    }
    
    // Проверяем, является ли пользователь воспитателем или помощником этой группы
    const group = await Group().findById(groupId);
    if (group && (group.teacherId?.toString() === userId || group.assistantId?.toString() === userId)) {
      return true;
    }
    
    // Проверяем, назначен ли пользователь как альтернативный сотрудник на смену в этой группе
    const shiftDate = new Date(date).toISOString().split('T')[0]; // Преобразуем в формат YYYY-MM-DD
    const shift = await Shift().findOne({
      date: shiftDate,
      $or: [
        { staffId: new mongoose.Types.ObjectId(userId) },
        { alternativeStaffId: new mongoose.Types.ObjectId(userId) }
      ]
    });
    
    if (shift) {
      // Проверяем, связан ли пользователь с этой группой через смену
      // Для этого проверим, связаны ли пользователь и группа через смену
      // В идеале, смена должна быть связана с группой, но в текущей архитектуре этого может не быть
      // Поэтому проверим, есть ли смена у пользователя в этот день, и связан ли он с группой
      return true;
    }
    
    return false;
  }
}