import Schedule from './model';
import { ISchedule } from './model';
import User from '../auth/model'; // Using the user model
import StaffShift from '../staffShifts/model'; // Using the staff shifts model
import Group from '../groups/model'; // Using the groups model

export class ScheduleService {
  async getAll(filters: { staffId?: string, date?: string, shiftId?: string, status?: string, groupId?: string, location?: string, startDate?: string, endDate?: string }) {
    const filter: any = {};
    
    if (filters.staffId) filter.staffId = filters.staffId;
    if (filters.shiftId) filter.shiftId = filters.shiftId;
    if (filters.status) filter.status = filters.status;
    if (filters.groupId) filter.groupId = filters.groupId;
    if (filters.location) filter.location = filters.location;
    
    if (filters.date) {
      filter.date = new Date(filters.date);
    } else if (filters.startDate || filters.endDate) {
      filter.date = {};
      if (filters.startDate) filter.date.$gte = new Date(filters.startDate);
      if (filters.endDate) filter.date.$lte = new Date(filters.endDate);
    }
    
    const schedules = await Schedule.find(filter)
      .populate('staffId', 'fullName role')
      .populate('shiftId', 'name startTime endTime')
      .populate('groupId', 'name')
      .populate('approvedBy', 'fullName role')
      .sort({ date: -1, startTime: 1 });
    
    return schedules;
  }

  async getById(id: string) {
    const schedule = await Schedule.findById(id)
      .populate('staffId', 'fullName role')
      .populate('shiftId', 'name startTime endTime')
      .populate('groupId', 'name')
      .populate('approvedBy', 'fullName role');
    
    if (!schedule) {
      throw new Error('Расписание не найдено');
    }
    
    return schedule;
  }

  async create(scheduleData: Partial<ISchedule>, userId: string) {
    // Проверяем обязательные поля
    if (!scheduleData.staffId) {
      throw new Error('Не указан сотрудник');
    }
    if (!scheduleData.date) {
      throw new Error('Не указана дата');
    }
    if (!scheduleData.shiftId) {
      throw new Error('Не указана смена');
    }
    if (!scheduleData.startTime) {
      throw new Error('Не указано время начала');
    }
    if (!scheduleData.endTime) {
      throw new Error('Не указано время окончания');
    }
    if (!scheduleData.location) {
      throw new Error('Не указано местоположение');
    }
    
    // Проверяем существование сотрудника
    const staff = await User.findById(scheduleData.staffId);
    if (!staff) {
      throw new Error('Сотрудник не найден');
    }
    
    // Проверяем существование смены
    const shift = await StaffShift.findById(scheduleData.shiftId);
    if (!shift) {
      throw new Error('Смена не найдена');
    }
    
    // Проверяем существование группы (если указана)
    if (scheduleData.groupId) {
      const group = await Group.findById(scheduleData.groupId);
      if (!group) {
        throw new Error('Группа не найдена');
      }
    }
    
    const schedule = new Schedule({
      ...scheduleData,
      approvedBy: userId // Утверждающий - текущий пользователь
    });
    
    await schedule.save();
    
    const populatedSchedule = await Schedule.findById(schedule._id)
      .populate('staffId', 'fullName role')
      .populate('shiftId', 'name startTime endTime')
      .populate('groupId', 'name')
      .populate('approvedBy', 'fullName role');
    
    return populatedSchedule;
  }

  async update(id: string, data: Partial<ISchedule>) {
    const updatedSchedule = await Schedule.findByIdAndUpdate(
      id,
      data,
      { new: true }
    ).populate('staffId', 'fullName role')
     .populate('shiftId', 'name startTime endTime')
     .populate('groupId', 'name')
     .populate('approvedBy', 'fullName role');
    
    if (!updatedSchedule) {
      throw new Error('Расписание не найдено');
    }
    
    return updatedSchedule;
  }

  async delete(id: string) {
    const result = await Schedule.findByIdAndDelete(id);
    
    if (!result) {
      throw new Error('Расписание не найдено');
    }
    
    return { message: 'Расписание успешно удалено' };
  }

  async getByStaffId(staffId: string, filters: { date?: string, shiftId?: string, status?: string, groupId?: string, location?: string, startDate?: string, endDate?: string }) {
    const filter: any = { staffId };
    
    if (filters.shiftId) filter.shiftId = filters.shiftId;
    if (filters.status) filter.status = filters.status;
    if (filters.groupId) filter.groupId = filters.groupId;
    if (filters.location) filter.location = filters.location;
    
    if (filters.date) {
      filter.date = new Date(filters.date);
    } else if (filters.startDate || filters.endDate) {
      filter.date = {};
      if (filters.startDate) filter.date.$gte = new Date(filters.startDate);
      if (filters.endDate) filter.date.$lte = new Date(filters.endDate);
    }
    
    const schedules = await Schedule.find(filter)
      .populate('staffId', 'fullName role')
      .populate('shiftId', 'name startTime endTime')
      .populate('groupId', 'name')
      .populate('approvedBy', 'fullName role')
      .sort({ date: -1, startTime: 1 });
    
    return schedules;
  }

  async getByGroupId(groupId: string, filters: { staffId?: string, date?: string, shiftId?: string, status?: string, location?: string, startDate?: string, endDate?: string }) {
    const filter: any = { groupId };
    
    if (filters.staffId) filter.staffId = filters.staffId;
    if (filters.shiftId) filter.shiftId = filters.shiftId;
    if (filters.status) filter.status = filters.status;
    if (filters.location) filter.location = filters.location;
    
    if (filters.date) {
      filter.date = new Date(filters.date);
    } else if (filters.startDate || filters.endDate) {
      filter.date = {};
      if (filters.startDate) filter.date.$gte = new Date(filters.startDate);
      if (filters.endDate) filter.date.$lte = new Date(filters.endDate);
    }
    
    const schedules = await Schedule.find(filter)
      .populate('staffId', 'fullName role')
      .populate('shiftId', 'name startTime endTime')
      .populate('groupId', 'name')
      .populate('approvedBy', 'fullName role')
      .sort({ date: -1, startTime: 1 });
    
    return schedules;
  }

  async getByDate(date: string, filters: { staffId?: string, shiftId?: string, status?: string, groupId?: string, location?: string }) {
    const filter: any = { date: new Date(date) };
    
    if (filters.staffId) filter.staffId = filters.staffId;
    if (filters.shiftId) filter.shiftId = filters.shiftId;
    if (filters.status) filter.status = filters.status;
    if (filters.groupId) filter.groupId = filters.groupId;
    if (filters.location) filter.location = filters.location;
    
    const schedules = await Schedule.find(filter)
      .populate('staffId', 'fullName role')
      .populate('shiftId', 'name startTime endTime')
      .populate('groupId', 'name')
      .populate('approvedBy', 'fullName role')
      .sort({ startTime: 1 });
    
    return schedules;
  }

  async getByDateRange(startDate: string, endDate: string, filters: { staffId?: string, shiftId?: string, status?: string, groupId?: string, location?: string }) {
    const filter: any = {
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    };
    
    if (filters.staffId) filter.staffId = filters.staffId;
    if (filters.shiftId) filter.shiftId = filters.shiftId;
    if (filters.status) filter.status = filters.status;
    if (filters.groupId) filter.groupId = filters.groupId;
    if (filters.location) filter.location = filters.location;
    
    const schedules = await Schedule.find(filter)
      .populate('staffId', 'fullName role')
      .populate('shiftId', 'name startTime endTime')
      .populate('groupId', 'name')
      .populate('approvedBy', 'fullName role')
      .sort({ date: -1, startTime: 1 });
    
    return schedules;
  }

  async updateStatus(id: string, status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'no_show' | 'late') {
    const schedule = await Schedule.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).populate('staffId', 'fullName role')
     .populate('shiftId', 'name startTime endTime')
     .populate('groupId', 'name')
     .populate('approvedBy', 'fullName role');
    
    if (!schedule) {
      throw new Error('Расписание не найдено');
    }
    
    return schedule;
  }

  async addNotes(id: string, notes: string) {
    const schedule = await Schedule.findByIdAndUpdate(
      id,
      { notes },
      { new: true }
    ).populate('staffId', 'fullName role')
     .populate('shiftId', 'name startTime endTime')
     .populate('groupId', 'name')
     .populate('approvedBy', 'fullName role');
    
    if (!schedule) {
      throw new Error('Расписание не найдено');
    }
    
    return schedule;
  }

  async getUpcomingSchedules(days: number = 7) {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + days);
    
    const schedules = await Schedule.find({
      date: {
        $gte: today,
        $lte: futureDate
      },
      status: { $ne: 'cancelled' }
    })
    .populate('staffId', 'fullName role')
    .populate('shiftId', 'name startTime endTime')
    .populate('groupId', 'name')
    .populate('approvedBy', 'fullName role')
    .sort({ date: 1, startTime: 1 });
    
    return schedules;
  }

  async getStatistics() {
    const stats = await Schedule.aggregate([
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
    
    const shiftStats = await Schedule.aggregate([
      {
        $group: {
          _id: '$shiftId',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);
    
    const locationStats = await Schedule.aggregate([
      {
        $group: {
          _id: '$location',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);
    
    const total = await Schedule.countDocuments();
    
    return {
      total,
      byStatus: stats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {}),
      byShift: shiftStats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {}),
      byLocation: locationStats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {})
    };
  }
}