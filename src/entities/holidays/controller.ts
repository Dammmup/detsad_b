import { Request, Response } from 'express';
import { HolidaysService } from './service';

// Отложенное создание экземпляра сервиса
let holidaysService: HolidaysService | null = null;

const getHolidaysService = (): HolidaysService => {
  if (!holidaysService) {
    holidaysService = new HolidaysService();
  }
  return holidaysService;
};

export const getAllHolidays = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { year, month, isRecurring } = req.query;
    
    const filters: any = {};
    if (year) filters.year = parseInt(year as string);
    if (month) filters.month = parseInt(month as string);
    if (isRecurring !== undefined) filters.isRecurring = isRecurring === 'true';
    
    const holidays = await getHolidaysService().getAll(filters);
    res.json(holidays);
  } catch (err) {
    console.error('Error fetching holidays:', err);
    res.status(500).json({ error: 'Ошибка получения праздников' });
 }
};

export const getHolidayById = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const holiday = await getHolidaysService().getById(req.params.id);
    res.json(holiday);
  } catch (err) {
    console.error('Error fetching holiday:', err);
    res.status(50).json({ error: 'Ошибка получения праздника' });
  }
};

export const createHoliday = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Только администраторы могут создавать праздники
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      return res.status(403).json({ error: 'Forbidden: Insufficient permissions to create holidays' });
    }
    
    const holiday = await getHolidaysService().create(req.body);
    res.status(201).json(holiday);
  } catch (err) {
    console.error('Error creating holiday:', err);
    res.status(400).json({ error: 'Ошибка создания праздника' });
  }
};

export const updateHoliday = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Только администраторы могут обновлять праздники
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      return res.status(403).json({ error: 'Forbidden: Insufficient permissions to update holidays' });
    }
    
    const holiday = await getHolidaysService().update(req.params.id, req.body);
    res.json(holiday);
  } catch (err) {
    console.error('Error updating holiday:', err);
    res.status(400).json({ error: 'Ошибка обновления праздника' });
  }
};

export const deleteHoliday = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Только администраторы могут удалять праздники
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      return res.status(403).json({ error: 'Forbidden: Insufficient permissions to delete holidays' });
    }
    
    await getHolidaysService().delete(req.params.id);
    res.json({ message: 'Праздник успешно удален' });
  } catch (err) {
    console.error('Error deleting holiday:', err);
    res.status(400).json({ error: 'Ошибка удаления праздника' });
  }
};

// Метод для проверки, является ли дата праздничной
export const checkIfHoliday = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { date } = req.query;
    
    if (!date) {
      return res.status(400).json({ error: 'Date parameter is required' });
    }
    
    const dateObj = new Date(date as string);
    if (isNaN(dateObj.getTime())) {
      return res.status(400).json({ error: 'Invalid date format' });
    }
    
    const isHoliday = await getHolidaysService().isHoliday(dateObj);
    res.json({ isHoliday, date: dateObj });
  } catch (err) {
    console.error('Error checking holiday:', err);
    res.status(500).json({ error: 'Ошибка проверки праздника' });
  }
};