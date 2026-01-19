import { Request, Response } from 'express';
import { StaffAttendanceTrackingService } from './service';

export const staffAttendanceTrackingService = new StaffAttendanceTrackingService();

export const clockIn = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const userId = req.user.id as string;
    const { latitude, longitude, photo, notes } = req.body;

    const result = await staffAttendanceTrackingService.clockIn(
      userId,
      { latitude, longitude },
      notes
    );

    res.status(201).json(result);
  } catch (error) {
    console.error('Error clocking in:', error);
    if (error instanceof Error && error.message.includes('Clock-in not allowed')) {
      const errorObj = JSON.parse(error.message);
      res.status(400).json(errorObj);
    } else {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Internal server error' });
    }
  }
};

export const clockOut = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const userId = req.user.id as string;
    const { latitude, longitude, photo, notes } = req.body;

    const result = await staffAttendanceTrackingService.clockOut(
      userId,
      { latitude, longitude },
      photo,
      notes
    );

    res.json(result);
  } catch (error) {
    console.error('Error clocking out:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Internal server error' });
  }
};

export const getEntries = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const userId = req.user.id as string;
    const { page, limit, startDate, endDate, status } = req.query;


    const filters: any = {
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      startDate: startDate as string,
      endDate: endDate as string
    };


    if (status) {
      if (status === 'absent') {
        filters.actualStart = { $exists: false };
      } else if (status === 'completed') {
        filters.actualStart = { $exists: true, $ne: null };
        filters.actualEnd = { $exists: true, $ne: null };
      } else if (status === 'in_progress') {
        filters.actualStart = { $exists: true, $ne: null };
        filters.actualEnd = { $exists: false };
      }
    }

    const result = await staffAttendanceTrackingService.getEntries(userId, filters);

    res.json(result);
  } catch (error) {
    console.error('Error getting time entries:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Internal server error' });
  }
};

export const getSummary = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const userId = req.user.id as string;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate and endDate are required' });
    }

    const result = await staffAttendanceTrackingService.getSummary(
      userId,
      startDate as string,
      endDate as string
    );

    res.json(result);
  } catch (error) {
    console.error('Error getting time summary:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Internal server error' });
  }
};

export const getAllStaffAttendanceRecords = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { staffId, date, status, inZone, startDate, endDate, approvedBy, approvedAt } = req.query;


    const filters: any = {
      staffId: staffId as string,
      date: date as string,
      inZone: inZone === 'true' ? true : inZone === 'false' ? false : undefined,
      startDate: startDate as string,
      endDate: endDate as string
    };


    if (status) {
      if (status === 'absent') {
        filters.actualStart = { $exists: false };
      } else if (status === 'completed') {
        filters.actualStart = { $exists: true, $ne: null };
        filters.actualEnd = { $exists: true, $ne: null };
      } else if (status === 'in_progress') {
        filters.actualStart = { $exists: true, $ne: null };
        filters.actualEnd = { $exists: false };
      }
    }

    const records = await staffAttendanceTrackingService.getAll(filters);

    res.json(records);
  } catch (err) {
    console.error('Error fetching staff attendance records:', err);
    res.status(500).json({ error: 'Ошибка получения записей посещаемости сотрудников' });
  }
};

export const getStaffAttendanceRecordById = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const record = await staffAttendanceTrackingService.getById(req.params.id);
    res.json(record);
  } catch (err: any) {
    console.error('Error fetching staff attendance record:', err);
    res.status(404).json({ error: err.message || 'Запись посещаемости сотрудника не найдена' });
  }
};

export const createStaffAttendanceRecord = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }


    const { lateMinutes, earlyLeaveMinutes, ...recordData } = req.body;


    if (lateMinutes !== undefined) {
      recordData.lateMinutes = lateMinutes;
    }
    if (earlyLeaveMinutes !== undefined) {
      recordData.earlyLeaveMinutes = earlyLeaveMinutes;
    }

    const record = await staffAttendanceTrackingService.create(recordData, req.user.id as string);
    res.status(201).json(record);
  } catch (err: any) {
    console.error('Error creating staff attendance record:', err);
    res.status(400).json({ error: err.message || 'Ошибка создания записи посещаемости сотрудника' });
  }
};

export const updateStaffAttendanceRecord = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }


    const { lateMinutes, earlyLeaveMinutes, ...recordData } = req.body;


    if (lateMinutes !== undefined) {
      recordData.lateMinutes = lateMinutes;
    }
    if (earlyLeaveMinutes !== undefined) {
      recordData.earlyLeaveMinutes = earlyLeaveMinutes;
    }

    const record = await staffAttendanceTrackingService.update(req.params.id, recordData);
    res.json(record);
  } catch (err: any) {
    console.error('Error updating staff attendance record:', err);
    res.status(404).json({ error: err.message || 'Ошибка обновления записи посещаемости сотрудника' });
  }
};

export const deleteStaffAttendanceRecord = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const result = await staffAttendanceTrackingService.delete(req.params.id);
    res.json(result);
  } catch (err: any) {
    console.error('Error deleting staff attendance record:', err);
    res.status(404).json({ error: err.message || 'Ошибка удаления записи посещаемости сотрудника' });
  }
};

export const getStaffAttendanceRecordsByStaffId = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { staffId } = req.params;
    const { date, status, inZone, startDate, endDate, approvedBy, approvedAt } = req.query;


    const filters: any = {
      date: date as string,
      inZone: inZone === 'true' ? true : inZone === 'false' ? false : undefined,
      startDate: startDate as string,
      endDate: endDate as string
    };


    if (status) {
      if (status === 'absent') {
        filters.actualStart = { $exists: false };
      } else if (status === 'completed') {
        filters.actualStart = { $exists: true, $ne: null };
        filters.actualEnd = { $exists: true, $ne: null };
      } else if (status === 'in_progress') {
        filters.actualStart = { $exists: true, $ne: null };
        filters.actualEnd = { $exists: false };
      }
    }

    const records = await staffAttendanceTrackingService.getByStaffId(staffId, filters);

    res.json(records);
  } catch (err: any) {
    console.error('Error fetching staff attendance records by staff ID:', err);
    res.status(500).json({ error: err.message || 'Ошибка получения записей посещаемости сотрудников по сотруднику' });
  }
};

export const getStaffAttendanceRecordsByDateRange = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Необходимо указать начальную и конечную даты' });
    }

    const { staffId, status, inZone, approvedBy, approvedAt } = req.query;


    const filters: any = {
      staffId: staffId as string,
      inZone: inZone === 'true' ? true : inZone === 'false' ? false : undefined
    };


    if (status) {
      if (status === 'absent') {
        filters.actualStart = { $exists: false };
      } else if (status === 'completed') {
        filters.actualStart = { $exists: true, $ne: null };
        filters.actualEnd = { $exists: true, $ne: null };
      } else if (status === 'in_progress') {
        filters.actualStart = { $exists: true, $ne: null };
        filters.actualEnd = { $exists: false };
      }
    }

    const records = await staffAttendanceTrackingService.getByDateRange(startDate as string, endDate as string, filters);

    res.json(records);
  } catch (err: any) {
    console.error('Error fetching staff attendance records by date range:', err);
    res.status(500).json({ error: err.message || 'Ошибка получения записей посещаемости сотрудников по диапазону дат' });
  }
};

export const getUpcomingAbsences = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { days } = req.query;
    const daysNum = days ? parseInt(days as string) : 7;

    const records = await staffAttendanceTrackingService.getUpcomingAbsences(daysNum);
    res.json(records);
  } catch (err: any) {
    console.error('Error fetching upcoming absences:', err);
    res.status(500).json({ error: err.message || 'Ошибка получения предстоящих отсутствий' });
  }
};

export const updateStaffAttendanceRecordStatus = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Не указан статус' });
    }

    const record = await staffAttendanceTrackingService.updateStatus(req.params.id, status);
    res.json(record);
  } catch (err: any) {
    console.error('Error updating staff attendance record status:', err);
    res.status(404).json({ error: err.message || 'Ошибка обновления статуса записи посещаемости сотрудника' });
  }
};

export const addStaffAttendanceRecordNotes = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { notes } = req.body;

    if (!notes) {
      return res.status(400).json({ error: 'Не указаны заметки' });
    }

    const record = await staffAttendanceTrackingService.addNotes(req.params.id, notes);
    res.json(record);
  } catch (err: any) {
    console.error('Error adding staff attendance record notes:', err);
    res.status(404).json({ error: err.message || 'Ошибка добавления заметок к записи посещаемости сотрудника' });
  }
};

export const approveStaffAttendanceRecord = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { approvedBy } = req.body;

    if (!approvedBy) {
      return res.status(400).json({ error: 'Не указан утверждающий' });
    }

    const record = await staffAttendanceTrackingService.approve(req.params.id, approvedBy);
    res.json(record);
  } catch (err: any) {
    console.error('Error approving staff attendance record:', err);
    res.status(404).json({ error: err.message || 'Ошибка утверждения записи посещаемости сотрудника' });
  }
};

export const getStaffAttendanceStatistics = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const stats = await staffAttendanceTrackingService.getStatistics();
    res.json(stats);
  } catch (err: any) {
    console.error('Error fetching staff attendance statistics:', err);
    res.status(500).json({ error: err.message || 'Ошибка получения статистики посещаемости сотрудников' });
  }
};

export const updateStaffAttendanceAdjustments = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { penalties, bonuses, notes } = req.body;

    const record = await staffAttendanceTrackingService.updateAdjustments(
      req.params.id,
      penalties,
      bonuses,
      notes,
      req.user.id as string
    );

    res.json(record);
  } catch (err: any) {
    console.error('Error updating staff attendance adjustments:', err);
    res.status(400).json({ error: err.message || 'Ошибка обновления корректировок учета времени' });
  }
};

export const approveStaffAttendance = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const record = await staffAttendanceTrackingService.approveAttendance(req.params.id, req.user.id as string);
    res.json(record);
  } catch (err: any) {
    console.error('Error approving staff attendance record:', err);
    res.status(404).json({ error: err.message || 'Ошибка подтверждения записи учета времени' });
  }
};

export const rejectStaffAttendance = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { reason } = req.body;

    const record = await staffAttendanceTrackingService.rejectAttendance(
      req.params.id,
      req.user.id as string,
      reason
    );

    res.json(record);
  } catch (err: any) {
    console.error('Error rejecting staff attendance record:', err);
    res.status(404).json({ error: err.message || 'Ошибка отклонения записи учета времени' });
  }
};

// Methods getPendingApprovals, getApprovedRecords, getRejectedRecords removed as they are no longer supported

export const getLateArrivals = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { threshold } = req.query;
    const thresholdMinutes = threshold ? parseInt(threshold as string) : 15;

    const records = await staffAttendanceTrackingService.getLateArrivals(thresholdMinutes);
    res.json(records);
  } catch (err: any) {
    console.error('Error fetching late arrivals:', err);
    res.status(500).json({ error: err.message || 'Ошибка получения записей об опозданиях' });
  }
};

export const getEarlyLeaves = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { threshold } = req.query;
    const thresholdMinutes = threshold ? parseInt(threshold as string) : 15;

    const records = await staffAttendanceTrackingService.getEarlyLeaves(thresholdMinutes);
    res.json(records);
  } catch (err: any) {
    console.error('Error fetching early leaves:', err);
    res.status(500).json({ error: err.message || 'Ошибка получения записей о ранних уходах' });
  }
};

export const getOvertimeRecords = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { threshold } = req.query;
    const thresholdMinutes = threshold ? parseInt(threshold as string) : 30;

    const records = await staffAttendanceTrackingService.getOvertimeRecords(thresholdMinutes);
    res.json(records);
  } catch (err: any) {
    console.error('Error fetching overtime records:', err);
    res.status(500).json({ error: err.message || 'Ошибка получения записей о сверхурочной работе' });
  }
};

export const getAbsenteeismRecords = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const records = await staffAttendanceTrackingService.getAbsenteeismRecords();
    res.json(records);
  } catch (err: any) {
    console.error('Error fetching absenteeism records:', err);
    res.status(500).json({ error: err.message || 'Ошибка получения записей о прогулах' });
  }
};

export const getWorkDurationStats = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Необходимо указать начальную и конечную даты' });
    }

    const stats = await staffAttendanceTrackingService.getWorkDurationStats(
      startDate as string,
      endDate as string
    );

    res.json(stats);
  } catch (err: any) {
    console.error('Error fetching work duration stats:', err);
    res.status(500).json({ error: err.message || 'Ошибка получения статистики рабочего времени' });
  }
};

export const getBreakDurationStats = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Необходимо указать начальную и конечную даты' });
    }

    const stats = await staffAttendanceTrackingService.getBreakDurationStats(
      startDate as string,
      endDate as string
    );

    res.json(stats);
  } catch (err: any) {
    console.error('Error fetching break duration stats:', err);
    res.status(500).json({ error: err.message || 'Ошибка получения статистики перерывов' });
  }
};

export const getAttendanceRate = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Необходимо указать начальную и конечную даты' });
    }

    const rate = await staffAttendanceTrackingService.getAttendanceRate(
      startDate as string,
      endDate as string
    );

    res.json(rate);
  } catch (err: any) {
    console.error('Error fetching attendance rate:', err);
    res.status(500).json({ error: err.message || 'Ошибка получения процента посещаемости' });
  }
};

export const getLateArrivalRate = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { startDate, endDate, threshold } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Необходимо указать начальную и конечную даты' });
    }

    const thresholdMinutes = threshold ? parseInt(threshold as string) : 15;

    const rate = await staffAttendanceTrackingService.getLateArrivalRate(
      startDate as string,
      endDate as string,
      thresholdMinutes
    );

    res.json(rate);
  } catch (err: any) {
    console.error('Error fetching late arrival rate:', err);
    res.status(500).json({ error: err.message || 'Ошибка получения процента опозданий' });
  }
};

export const getEarlyLeaveRate = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { startDate, endDate, threshold } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Необходимо указать начальную и конечную даты' });
    }

    const thresholdMinutes = threshold ? parseInt(threshold as string) : 15;

    const rate = await staffAttendanceTrackingService.getEarlyLeaveRate(
      startDate as string,
      endDate as string,
      thresholdMinutes
    );

    res.json(rate);
  } catch (err: any) {
    console.error('Error fetching early leave rate:', err);
    res.status(500).json({ error: err.message || 'Ошибка получения процента ранних уходов' });
  }
};

export const getOvertimeRate = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { startDate, endDate, threshold } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Необходимо указать начальную и конечную даты' });
    }

    const thresholdMinutes = threshold ? parseInt(threshold as string) : 30;

    const rate = await staffAttendanceTrackingService.getOvertimeRate(
      startDate as string,
      endDate as string,
      thresholdMinutes
    );

    res.json(rate);
  } catch (err: any) {
    console.error('Error fetching overtime rate:', err);
    res.status(500).json({ error: err.message || 'Ошибка получения процента сверхурочной работы' });
  }
};

export const getAbsenteeismRate = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Необходимо указать начальную и конечную даты' });
    }

    const rate = await staffAttendanceTrackingService.getAbsenteeismRate(
      startDate as string,
      endDate as string
    );

    res.json(rate);
  } catch (err: any) {
    console.error('Error fetching absenteeism rate:', err);
    res.status(500).json({ error: err.message || 'Ошибка получения процента прогулов' });
  }
};

/**
 * Массовое обновление записей посещаемости
 */
export const bulkUpdateStaffAttendanceRecords = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { ids, actualStart, actualEnd, timeStart, timeEnd, notes } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Необходимо указать массив ID записей' });
    }

    const result = await staffAttendanceTrackingService.bulkUpdate(ids, {
      actualStart,
      actualEnd,
      timeStart,
      timeEnd,
      notes
    });

    res.json(result);
  } catch (err: any) {
    console.error('Error bulk updating staff attendance records:', err);
    res.status(400).json({ error: err.message || 'Ошибка массового обновления записей посещаемости' });
  }
};