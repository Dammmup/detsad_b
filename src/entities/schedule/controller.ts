import { Request, Response } from 'express';
import { ScheduleService } from './service';

const scheduleService = new ScheduleService();

export const getAllSchedules = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { staffId, date, shiftId, status, groupId, location, startDate, endDate } = req.query;
    
    const schedules = await scheduleService.getAll({
      staffId: staffId as string,
      date: date as string,
      shiftId: shiftId as string,
      status: status as string,
      groupId: groupId as string,
      location: location as string,
      startDate: startDate as string,
      endDate: endDate as string
    });
    
    res.json(schedules);
  } catch (err) {
    console.error('Error fetching schedules:', err);
    res.status(500).json({ error: 'Ошибка получения расписаний' });
  }
};

export const getScheduleById = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const schedule = await scheduleService.getById(req.params.id);
    res.json(schedule);
  } catch (err: any) {
    console.error('Error fetching schedule:', err);
    res.status(404).json({ error: err.message || 'Расписание не найдено' });
  }
};

export const createSchedule = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const schedule = await scheduleService.create(req.body, req.user.id as string);
    res.status(201).json(schedule);
  } catch (err: any) {
    console.error('Error creating schedule:', err);
    res.status(400).json({ error: err.message || 'Ошибка создания расписания' });
  }
};

export const updateSchedule = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const schedule = await scheduleService.update(req.params.id, req.body);
    res.json(schedule);
  } catch (err: any) {
    console.error('Error updating schedule:', err);
    res.status(404).json({ error: err.message || 'Ошибка обновления расписания' });
  }
};

export const deleteSchedule = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const result = await scheduleService.delete(req.params.id);
    res.json(result);
  } catch (err: any) {
    console.error('Error deleting schedule:', err);
    res.status(404).json({ error: err.message || 'Ошибка удаления расписания' });
  }
};

export const getSchedulesByStaffId = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { staffId } = req.params;
    const { date, shiftId, status, groupId, location, startDate, endDate } = req.query;
    
    const schedules = await scheduleService.getByStaffId(staffId, {
      date: date as string,
      shiftId: shiftId as string,
      status: status as string,
      groupId: groupId as string,
      location: location as string,
      startDate: startDate as string,
      endDate: endDate as string
    });
    
    res.json(schedules);
  } catch (err: any) {
    console.error('Error fetching schedules by staff ID:', err);
    res.status(500).json({ error: err.message || 'Ошибка получения расписаний по сотруднику' });
  }
};

export const getSchedulesByGroupId = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { groupId } = req.params;
    const { staffId, date, shiftId, status, location, startDate, endDate } = req.query;
    
    const schedules = await scheduleService.getByGroupId(groupId, {
      staffId: staffId as string,
      date: date as string,
      shiftId: shiftId as string,
      status: status as string,
      location: location as string,
      startDate: startDate as string,
      endDate: endDate as string
    });
    
    res.json(schedules);
  } catch (err: any) {
    console.error('Error fetching schedules by group ID:', err);
    res.status(500).json({ error: err.message || 'Ошибка получения расписаний по группе' });
  }
};

export const getSchedulesByDate = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { date } = req.params;
    const { staffId, shiftId, status, groupId, location } = req.query;
    
    const schedules = await scheduleService.getByDate(date, {
      staffId: staffId as string,
      shiftId: shiftId as string,
      status: status as string,
      groupId: groupId as string,
      location: location as string
    });
    
    res.json(schedules);
  } catch (err: any) {
    console.error('Error fetching schedules by date:', err);
    res.status(500).json({ error: err.message || 'Ошибка получения расписаний по дате' });
  }
};

export const getSchedulesByDateRange = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Необходимо указать начальную и конечную даты' });
    }
    
    const { staffId, shiftId, status, groupId, location } = req.query;
    
    const schedules = await scheduleService.getByDateRange(startDate as string, endDate as string, {
      staffId: staffId as string,
      shiftId: shiftId as string,
      status: status as string,
      groupId: groupId as string,
      location: location as string
    });
    
    res.json(schedules);
  } catch (err: any) {
    console.error('Error fetching schedules by date range:', err);
    res.status(500).json({ error: err.message || 'Ошибка получения расписаний по диапазону дат' });
  }
};

export const getUpcomingSchedules = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { days } = req.query;
    const daysNum = days ? parseInt(days as string) : 7;
    
    const schedules = await scheduleService.getUpcomingSchedules(daysNum);
    res.json(schedules);
  } catch (err: any) {
    console.error('Error fetching upcoming schedules:', err);
    res.status(500).json({ error: err.message || 'Ошибка получения предстоящих расписаний' });
  }
};

export const updateScheduleStatus = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ error: 'Не указан статус' });
    }
    
    const schedule = await scheduleService.updateStatus(req.params.id, status);
    res.json(schedule);
  } catch (err: any) {
    console.error('Error updating schedule status:', err);
    res.status(404).json({ error: err.message || 'Ошибка обновления статуса расписания' });
  }
};

export const addScheduleNotes = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { notes } = req.body;
    
    if (!notes) {
      return res.status(400).json({ error: 'Не указаны заметки' });
    }
    
    const schedule = await scheduleService.addNotes(req.params.id, notes);
    res.json(schedule);
  } catch (err: any) {
    console.error('Error adding schedule notes:', err);
    res.status(404).json({ error: err.message || 'Ошибка добавления заметок к расписанию' });
  }
};

export const getScheduleStatistics = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const stats = await scheduleService.getStatistics();
    res.json(stats);
  } catch (err: any) {
    console.error('Error fetching schedule statistics:', err);
    res.status(500).json({ error: err.message || 'Ошибка получения статистики расписаний' });
  }
};