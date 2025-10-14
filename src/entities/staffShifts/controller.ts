import { Request, Response } from 'express';
import { ShiftsService } from './service';

const shiftsService = new ShiftsService();

export const getAllShifts = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { staffId, date, status, startDate, endDate } = req.query;
    
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

export const createSimpleShift = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const result = await shiftsService.create(req.body, req.user.id as string);
    res.status(201).json(result);
  } catch (err: any) {
    console.error('Error creating shift:', err);
    if (err.name === 'ValidationError') {
      // Return specific validation error details
      const errors = Object.values(err.errors).map((e: any) => e.message);
      return res.status(400).json({
        error: 'Ошибка валидации данных смены',
        details: errors
      });
    }
    res.status(400).json({ error: err.message || 'Ошибка создания смены' });
  }
};

export const updateSimpleShift = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const result = await shiftsService.update(req.params.id, req.body);
    res.json(result);
  } catch (err) {
    console.error('Error updating shift:', err);
    res.status(400).json({ error: 'Ошибка обновления смены' });
  }
};

export const deleteSimpleShift = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const result = await shiftsService.delete(req.params.id);
    res.json(result);
  } catch (err) {
    console.error('Error deleting shift:', err);
    res.status(400).json({ error: 'Ошибка удаления смены' });
  }
};

export const checkInSimple = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { shiftId } = req.params;
    
    const result = await shiftsService.checkIn(shiftId, req.user.id as string, req.user.role as string);
    res.json(result);
  } catch (err) {
    console.error('Error checking in:', err);
    res.status(500).json({ error: 'Ошибка отметки прихода' });
  }
};

export const checkOutSimple = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { shiftId } = req.params;
    
    const result = await shiftsService.checkOut(shiftId, req.user.id as string, req.user.role as string);
    res.json(result);
  } catch (err) {
    console.error('Error checking out:', err);
    res.status(500).json({ error: 'Ошибка отметки ухода' });
  }
};

export const getTimeTrackingSimple = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { staffId, startDate, endDate } = req.query;
    
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

export const updateAdjustmentsSimple = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
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