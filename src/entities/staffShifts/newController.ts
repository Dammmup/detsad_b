import { Request, Response } from 'express';
import { StaffShiftsService } from './newService';

const staffShiftsService = new StaffShiftsService();

export const getAllShifts = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { staffId, date, status, startDate, endDate } = req.query;

    const shifts = await staffShiftsService.getAll(
      { staffId: staffId as string, date: date as string, status: status as string, startDate: startDate as string, endDate: endDate as string },
      req.user.id as string,
      req.user.role as string
    );
    res.json(shifts);
  } catch (err: any) {
    console.error('Error getting shifts:', err);
    res.status(400).json({ error: err.message || 'Ошибка получения смен' });
  }
};

export const createShift = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const shift = await staffShiftsService.create(req.body, req.user.id as string);
    res.status(201).json(shift);
 } catch (err: any) {
    console.error('Error creating shift:', err);
    res.status(400).json({ error: err.message || 'Ошибка создания смены' });
  }
};

export const bulkCreateShifts = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const shifts = await staffShiftsService.bulkCreate(req.body.shifts, req.user.id as string);
    res.status(201).json(shifts);
  } catch (err: any) {
    console.error('Error bulk creating shifts:', err);
    res.status(400).json({ error: err.message || 'Ошибка создания смен' });
  }
};

export const updateShift = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const shift = await staffShiftsService.update(req.params.id, req.body);
    res.json(shift);
  } catch (err: any) {
    console.error('Error updating shift:', err);
    res.status(400).json({ error: err.message || 'Ошибка обновления смены' });
  }
};

export const checkIn = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const result = await staffShiftsService.checkIn(req.params.shiftId, req.user.id as string, req.user.role as string);
    res.json(result);
 } catch (err: any) {
    console.error('Error checking in:', err);
    res.status(400).json({ error: err.message || 'Ошибка отметки прихода' });
  }
};

export const checkOut = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const result = await staffShiftsService.checkOut(req.params.shiftId, req.user.id as string, req.user.role as string);
    res.json(result);
  } catch (err: any) {
    console.error('Error checking out:', err);
    res.status(400).json({ error: err.message || 'Ошибка отметки ухода' });
 }
};

export const getTimeTracking = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const records = await staffShiftsService.getTimeTrackingRecords(req.query as any, req.user.id as string, req.user.role as string);
    res.json(records);
 } catch (err: any) {
    console.error('Error getting time tracking records:', err);
    res.status(400).json({ error: err.message || 'Ошибка получения данных о посещаемости' });
  }
};

export const updateAdjustments = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const record = await staffShiftsService.updateAdjustments(
      req.params.id,
      req.body.penalties,
      req.body.bonuses,
      req.body.notes,
      req.user?.id as string
    );
    res.json(record);
  } catch (err: any) {
    console.error('Error updating adjustments:', err);
    res.status(400).json({ error: err.message || 'Ошибка обновления корректировок' });
  }
};