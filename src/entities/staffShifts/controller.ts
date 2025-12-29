import { Request, Response } from 'express';
import { ShiftsService } from './service';
import { sendLogToTelegram } from '../../utils/telegramLogger';
import User from '../users/model';
import Shift from './model';
import { AuthUser } from '../../middlewares/authMiddleware';

interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

const shiftsService = new ShiftsService();

export const getAllShifts = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    let { staffId, date, status, startDate, endDate } = req.query;



    if (req.user.role !== 'admin' && req.user.role !== 'manager') {

      staffId = req.user.id;
    }

    const shifts = await shiftsService.getAll(
      { staffId: staffId as string, date: date as string, status: status as string, startDate: startDate as string, endDate: endDate as string },
      req.user.id as string,
      req.user.role as string
    );

    res.json(shifts);
  } catch (err) {
    console.error('Error fetching shifts:', err);
    res.status(500).json({ error: 'Ошибка получения смен' });
  }
};

export const createShift = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }


    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      return res.status(403).json({ error: 'Forbidden: Insufficient permissions to create shifts' });
    }


    const { actualStart, actualEnd, breakTime, overtimeMinutes, lateMinutes, earlyLeaveMinutes, userId, ...shiftData } = req.body;

    const processedShiftData = {
      ...shiftData,
      staffId: userId || shiftData.staffId,
      createdBy: req.user.id
    };

    const result = await shiftsService.create(processedShiftData, req.user.id as string);
    res.status(201).json(result);
  } catch (err: any) {
    console.error('Error creating shift:', err);
    if (err.name === 'ValidationError') {

      const errors = Object.values(err.errors).map((e: any) => e.message);
      return res.status(400).json({
        error: 'Ошибка валидации данных смены',
        details: errors
      });
    }
    res.status(400).json({ error: err.message || 'Ошибка создания смены' });
  }
};


export const requestShift = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }



    const { actualStart, actualEnd, breakTime, overtimeMinutes, lateMinutes, earlyLeaveMinutes, userId, ...shiftData } = req.body;


    const processedShiftData = {
      ...shiftData,
      staffId: req.user.id,
      status: 'pending_approval',
      createdBy: req.user.id
    };

    const result = await shiftsService.create(processedShiftData, req.user.id as string);
    res.status(201).json(result);
  } catch (err: any) {
    console.error('Error requesting shift:', err);
    if (err.name === 'ValidationError') {

      const errors = Object.values(err.errors).map((e: any) => e.message);
      return res.status(400).json({
        error: 'Ошибка валидации данных смены',
        details: errors
      });
    }
    res.status(400).json({ error: err.message || 'Ошибка запроса смены' });
  }
};


export const updateShift = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }


    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      return res.status(403).json({ error: 'Forbidden: Insufficient permissions to update shifts' });
    }


    const { actualStart, actualEnd, breakTime, overtimeMinutes, lateMinutes, earlyLeaveMinutes, ...shiftData } = req.body;

    const result = await shiftsService.update(req.params.id, shiftData);
    res.json(result);
  } catch (err) {
    console.error('Error updating shift:', err);
    res.status(400).json({ error: 'Ошибка обновления смены' });
  }
};

export const deleteShift = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }


    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      return res.status(403).json({ error: 'Forbidden: Insufficient permissions to delete shifts' });
    }

    const result = await shiftsService.delete(req.params.id);
    res.json(result);
  } catch (err) {
    console.error('Error deleting shift:', err);
    res.status(400).json({ error: 'Ошибка удаления смены' });
  }
};

export const bulkDeleteShifts = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      return res.status(403).json({ error: 'Forbidden: Insufficient permissions to delete shifts' });
    }

    const { ids } = req.body;
    if (!ids || !Array.isArray(ids)) {
      return res.status(400).json({ error: 'Invalid IDs provided' });
    }

    const result = await shiftsService.bulkDelete(ids);
    res.json(result);
  } catch (err) {
    console.error('Error bulk deleting shifts:', err);
    res.status(500).json({ error: 'Ошибка массового удаления смен' });
  }
};

export const checkInSimple = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { shiftId } = req.params;
    const { latitude, longitude } = req.body;


    const locationData = latitude && longitude ? { latitude, longitude } : undefined;

    const result = await shiftsService.checkIn(shiftId, req.user.id as string, req.user.role as string, locationData);
    const shift = await Shift.findById(shiftId);
    const user = await User.findById(req.user.id);
    if (user && shift) {
      await sendLogToTelegram(`Сотрудник ${user.fullName} отметил приход на смену за ${shift.date}`);
    } else if (user) {
      await sendLogToTelegram(`Сотрудник ${user.fullName} отметил приход на смену ${shiftId}`);
    } else {
      await sendLogToTelegram(`Сотрудник с ID ${req.user.id} отметил приход на смену ${shiftId}`);
    }
    res.json(result);
  } catch (err) {
    console.error('Error checking in:', err);
    res.status(500).json({ error: 'Ошибка отметки прихода' });
  }
};

export const checkOutSimple = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const { date } = req.params;

    const { shiftId } = req.params;
    const { latitude, longitude } = req.body;


    const locationData = latitude && longitude ? { latitude, longitude } : undefined;

    const result = await shiftsService.checkOut(shiftId, req.user.id as string, req.user.role as string, locationData);
    const shift = await Shift.findById(shiftId);
    const user = await User.findById(req.user.id);
    if (user && shift) {
      await sendLogToTelegram(`Сотрудник ${user.fullName} отметил уход со смены за ${shift.date}`);
    } else if (user) {
      await sendLogToTelegram(`Сотрудник ${user.fullName} отметил уход со смены ${shiftId}`);
    } else {
      await sendLogToTelegram(`Сотрудник с ID ${req.user.id} отметил уход со смены ${shiftId}`);
    }
    res.json(result);
  } catch (err) {
    console.error('Error checking out:', err);
    res.status(500).json({ error: 'Ошибка отметки ухода' });
  }
};

export const getTimeTrackingSimple = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    let { staffId, startDate, endDate } = req.query;



    if (req.user.role !== 'admin' && req.user.role !== 'manager') {

      staffId = req.user.id;
    }

    const records = await shiftsService.getTimeTrackingRecords(
      { staffId: staffId as string, startDate: startDate as string, endDate: endDate as string },
      req.user.id as string,
      req.user.role as string
    );

    res.json(records);
  } catch (err) {
    console.error('Error fetching time tracking:', err);
    res.status(500).json({ error: 'Ошибка получения учета времени' });
  }
};

export const updateLateShifts = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }


    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      return res.status(403).json({ error: 'Forbidden: Insufficient permissions to update late shifts' });
    }

    const shiftsService = new ShiftsService();
    const results = await shiftsService.updateLateShifts();

    res.json({
      message: `Обновлено ${results.length} смен с опоздавшими сотрудниками`,
      results
    });
  } catch (err) {
    console.error('Error updating late shifts:', err);
    res.status(500).json({ error: 'Ошибка обновления статусов опоздавших смен' });
  }
};

export const updateAdjustmentsSimple = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }


    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      return res.status(403).json({ error: 'Forbidden: Insufficient permissions to update adjustments' });
    }

    const { penalties, bonuses, notes } = req.body;

    const record = await shiftsService.updateAdjustments(
      req.params.id,
      penalties,
      bonuses,
      notes,
      req.user.id as string
    );

    res.json(record);
  } catch (err) {
    console.error('Error updating adjustments:', err);
    res.status(400).json({ error: 'Ошибка обновления корректировок' });
  }
};