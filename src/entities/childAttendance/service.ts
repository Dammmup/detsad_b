import { IChildAttendance } from './model';
import ChildAttendance from './model';
import User from '../auth/model'; // Using the user model
import Group from '../groups/model'; // Using the group model

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
        const teacherGroups = await Group.find({ teacher: userId });
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
    
    const attendance = await ChildAttendance.find(filter)
      .sort({ date: -1, childId: 1 });
    
    return attendance;
  }

  async createOrUpdate(attendanceData: any, userId: string) {
    const { childId, groupId, date, status, checkInTime, checkOutTime, notes } = attendanceData;
    
    if (!childId || !groupId || !date || !status) {
      throw new Error('Обязательные поля: childId, groupId, date, status');
    }
    
    // Check if record already exists for this child and date
    const existingRecord = await ChildAttendance.findOne({
      childId,
      date: new Date(date)
    });
    
    const newAttendanceData = {
      childId,
      groupId,
      date: new Date(date),
      status,
      checkInTime: checkInTime ? new Date(checkInTime) : undefined,
      checkOutTime: checkOutTime ? new Date(checkOutTime) : undefined,
      notes,
      markedBy: userId
    };
    
    let attendance;
    if (existingRecord) {
      // Update existing record
      attendance = await ChildAttendance.findOneAndUpdate(
        { childId, date: new Date(date) },
        newAttendanceData,
        { new: true }
      );
    } else {
      // Create new record
      attendance = new ChildAttendance(newAttendanceData);
      await attendance.save();
    }
    
    return attendance;
 }

  async bulkCreateOrUpdate(records: any[], groupId: string, userId: string) {
    if (!Array.isArray(records) || !groupId) {
      throw new Error('Требуется массив records и groupId');
    }
    
    const results = [];
    const errors = [];
    
    for (const record of records) {
      try {
        const { childId, date, status, notes } = record;
        
        if (!childId || !date || !status) {
          errors.push({ record, error: 'Отсутствуют обязательные поля' });
          continue;
        }
        
        // Check if record exists
        const existingRecord = await ChildAttendance.findOne({
          childId,
          date: new Date(date)
        });
        
        const attendanceData = {
          childId,
          groupId,
          date: new Date(date),
          status,
          notes,
          markedBy: userId
        };
        
        let attendance;
        if (existingRecord) {
          attendance = await ChildAttendance.findByIdAndUpdate(
            existingRecord._id,
            attendanceData,
            { new: true }
          );
        } else {
          attendance = new ChildAttendance(attendanceData);
          await attendance.save();
        }
        
        results.push(attendance);
      } catch (err: any) {
        errors.push({ record, error: err.message });
      }
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
    
    const stats = await ChildAttendance.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const totalRecords = await ChildAttendance.countDocuments(filter);
    
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
    const attendance = await ChildAttendance.findByIdAndDelete(id);
    
    if (!attendance) {
      throw new Error('Запись не найдена');
    }
    
    return { message: 'Запись удалена успешно' };
 }

  async debug() {
    const totalRecords = await ChildAttendance.countDocuments();
    const recentRecords = await ChildAttendance.find()
      .sort({ createdAt: -1 })
      .limit(5);
    
    return {
      totalRecords,
      recentRecords,
      collectionName: 'childattendances'
    };
  }
}