import StaffAttendanceTracking from './model';
import { IStaffAttendanceTracking } from './model';
import User from '../auth/model'; // Using the user model

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

  async clockIn(userId: string, locationData: { latitude: number, longitude: number }, photo?: string, notes?: string) {
    // Check if user already has an active time entry for today
    const today = new Date();
    today.setHours(0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const existingEntry = await StaffAttendanceTracking.findOne({
      staffId: userId,
      date: { $gte: today, $lt: tomorrow },
      status: { $in: ['active', 'checked_in', 'on_break'] }
    });
    
    if (existingEntry) {
      throw new Error('You already have an active time entry today. Please clock out first.');
    }
    
    // Get user details
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    // Create attendance record
    const attendanceRecord = new StaffAttendanceTracking({
      staffId: userId,
      date: new Date(),
      checkInTime: new Date(),
      status: 'checked_in',
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
      inZone: true // Assuming user is in zone when clocking in
    });
    
    await attendanceRecord.save();
    
    await attendanceRecord.populate('staffId', 'fullName role');
    
    return {
      message: 'Successfully clocked in',
      attendanceRecord,
      location: attendanceRecord.clockInLocation?.name
    };
 }

  async clockOut(userId: string, locationData: { latitude: number, longitude: number }, photo?: string, notes?: string) {
    // Find today's attendance record
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const attendanceRecord = await StaffAttendanceTracking.findOne({
      staffId: userId,
      date: { $gte: today, $lt: tomorrow },
      status: { $in: ['checked_in', 'on_break', 'active'] }
    });
    
    if (!attendanceRecord) {
      throw new Error('No active time entry found for today. Please clock in first.');
    }
    
    // Update attendance record
    attendanceRecord.checkOutTime = new Date();
    attendanceRecord.status = 'checked_out';
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
    
    return {
      message: 'Successfully clocked out',
      attendanceRecord,
      totalHours: attendanceRecord.totalHours,
      regularHours: attendanceRecord.regularHours,
      overtimeHours: attendanceRecord.overtimeHours
    };
  }

  async startBreak(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const attendanceRecord = await StaffAttendanceTracking.findOne({
      staffId: userId,
      date: { $gte: today, $lt: tomorrow },
      status: { $in: ['checked_in', 'active'] }
    });
    
    if (!attendanceRecord) {
      throw new Error('No active time entry found for today');
    }
    
    if (attendanceRecord.breakStart) {
      throw new Error('Break already started');
    }
    
    attendanceRecord.breakStart = new Date();
    attendanceRecord.status = 'on_break';
    await attendanceRecord.save();
    
    return {
      message: 'Break started',
      breakStart: attendanceRecord.breakStart
    };
  }

  async endBreak(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const attendanceRecord = await StaffAttendanceTracking.findOne({
      staffId: userId,
      date: { $gte: today, $lt: tomorrow },
      status: 'on_break'
    });
    
    if (!attendanceRecord) {
      throw new Error('No active time entry found for today');
    }
    
    if (!attendanceRecord.breakStart) {
      throw new Error('No break to end');
    }
    
    if (attendanceRecord.breakEnd) {
      throw new Error('Break already ended');
    }
    
    attendanceRecord.breakEnd = new Date();
    
    // Calculate break duration
    const breakMs = attendanceRecord.breakEnd.getTime() - attendanceRecord.breakStart.getTime();
    attendanceRecord.breakDuration = Math.floor(breakMs / (1000 * 60)); // Convert to minutes
    
    attendanceRecord.status = 'checked_in';
    await attendanceRecord.save();
    
    return {
      message: 'Break ended',
      breakEnd: attendanceRecord.breakEnd,
      breakDuration: attendanceRecord.breakDuration
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
    
    const records = await StaffAttendanceTracking.find(filter)
      .populate('staffId', 'fullName role')
      .populate('approvedBy', 'fullName role')
      .sort({ date: -1 });
    
    return records;
  }

  async getById(id: string) {
    const record = await StaffAttendanceTracking.findById(id)
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
    if (!recordData.status) {
      throw new Error('Не указан статус');
    }
    
    // Проверяем существование сотрудника
    const staff = await User.findById(recordData.staffId);
    if (!staff) {
      throw new Error('Сотрудник не найден');
    }
    
    // Проверяем существование утверждающего
    if (recordData.approvedBy) {
      const approver = await User.findById(recordData.approvedBy);
      if (!approver) {
        throw new Error('Утверждающий не найден');
      }
    }
    
    const record = new StaffAttendanceTracking({
      ...recordData,
      approvedBy: userId // Утверждающий - текущий пользователь
    });
    
    await record.save();
    
    const populatedRecord = await StaffAttendanceTracking.findById(record._id)
      .populate('staffId', 'fullName role')
      .populate('approvedBy', 'fullName role');
    
    return populatedRecord;
  }

 async update(id: string, data: Partial<IStaffAttendanceTracking>) {
    const updatedRecord = await StaffAttendanceTracking.findByIdAndUpdate(
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
    const result = await StaffAttendanceTracking.findByIdAndDelete(id);
    
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
    
    const records = await StaffAttendanceTracking.find(filter)
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
    
    const records = await StaffAttendanceTracking.find(filter)
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
  }

  async getSummary(userId: string, startDate: string, endDate: string) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    const records = await StaffAttendanceTracking.find({
      staffId: userId,
      date: { $gte: start, $lte: end },
      status: 'checked_out'
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
    
    const records = await StaffAttendanceTracking.find({
      date: {
        $gte: today,
        $lte: futureDate
      },
      status: 'absent'
    })
    .populate('staffId', 'fullName role')
    .populate('approvedBy', 'fullName role')
    .sort({ date: 1 });
    
    return records;
  }

  async updateStatus(id: string, status: 'checked_in' | 'checked_out' | 'on_break' | 'overtime' | 'absent' | 'active' | 'completed' | 'missed' | 'pending_approval') {
    const record = await StaffAttendanceTracking.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).populate('staffId', 'fullName role')
     .populate('approvedBy', 'fullName role');
    
    if (!record) {
      throw new Error('Запись посещаемости сотрудника не найдена');
    }
    
    return record;
  }

  async addNotes(id: string, notes: string) {
    const record = await StaffAttendanceTracking.findByIdAndUpdate(
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
    const record = await StaffAttendanceTracking.findByIdAndUpdate(
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
    const record = await StaffAttendanceTracking.findByIdAndUpdate(
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
    const record = await StaffAttendanceTracking.findByIdAndUpdate(
      id,
      {
        status: 'completed',
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
    const existingRecord = await StaffAttendanceTracking.findById(id);
    if (!existingRecord) {
      throw new Error('Запись посещаемости сотрудника не найдена');
    }
    
    const record = await StaffAttendanceTracking.findByIdAndUpdate(
      id,
      {
        status: 'pending_approval',
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
    const records = await StaffAttendanceTracking.find({ status: 'pending_approval' })
      .populate('staffId', 'fullName role')
      .sort({ date: -1 });
    
    return records;
  }

  async getApprovedRecords() {
    const records = await StaffAttendanceTracking.find({ status: 'completed' })
      .populate('staffId', 'fullName role')
      .sort({ date: -1 });
    
    return records;
  }

  async getRejectedRecords() {
    const records = await StaffAttendanceTracking.find({ status: 'missed' })
      .populate('staffId', 'fullName role')
      .sort({ date: -1 });
    
    return records;
  }

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
      'bonuses.overtime.minutes': { $gte: thresholdMinutes }
    })
    .populate('staffId', 'fullName role')
    .sort({ date: -1 });
    
    return records;
  }

  async getAbsenteeismRecords() {
    const records = await StaffAttendanceTracking.find({ status: 'absent' })
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
      status: { $in: ['checked_in', 'checked_out', 'on_break', 'active', 'completed'] }
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
      'bonuses.overtime.minutes': { $gte: thresholdMinutes }
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
          _id: '$status',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);
    
    const zoneStats = await StaffAttendanceTracking.aggregate([
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