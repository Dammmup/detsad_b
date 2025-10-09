import { Request, Response } from 'express';
import { TubPositiveJournalService } from './service';

const tubPositiveJournalService = new TubPositiveJournalService();

export const getAllTubPositiveJournals = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { childId, date, doctorId, status, startDate, endDate } = req.query;
    
    const journals = await tubPositiveJournalService.getAll({
      childId: childId as string,
      date: date as string,
      doctorId: doctorId as string,
      status: status as string,
      startDate: startDate as string,
      endDate: endDate as string
    });
    
    res.json(journals);
  } catch (err) {
    console.error('Error fetching tub positive journals:', err);
    res.status(500).json({ error: 'Ошибка получения записей туберкулеза' });
  }
};

export const getTubPositiveJournalById = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const journal = await tubPositiveJournalService.getById(req.params.id);
    res.json(journal);
  } catch (err: any) {
    console.error('Error fetching tub positive journal:', err);
    res.status(404).json({ error: err.message || 'Запись туберкулеза не найдена' });
  }
};

export const createTubPositiveJournal = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const journal = await tubPositiveJournalService.create(req.body, req.user.id as string);
    res.status(201).json(journal);
  } catch (err: any) {
    console.error('Error creating tub positive journal:', err);
    res.status(400).json({ error: err.message || 'Ошибка создания записи туберкулеза' });
  }
};

export const updateTubPositiveJournal = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const journal = await tubPositiveJournalService.update(req.params.id, req.body);
    res.json(journal);
  } catch (err: any) {
    console.error('Error updating tub positive journal:', err);
    res.status(404).json({ error: err.message || 'Ошибка обновления записи туберкулеза' });
  }
};

export const deleteTubPositiveJournal = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const result = await tubPositiveJournalService.delete(req.params.id);
    res.json(result);
  } catch (err: any) {
    console.error('Error deleting tub positive journal:', err);
    res.status(404).json({ error: err.message || 'Ошибка удаления записи туберкулеза' });
  }
};

export const getTubPositiveJournalsByChildId = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { childId } = req.params;
    const { date, doctorId, status, startDate, endDate } = req.query;
    
    const journals = await tubPositiveJournalService.getByChildId(childId, {
      date: date as string,
      doctorId: doctorId as string,
      status: status as string,
      startDate: startDate as string,
      endDate: endDate as string
    });
    
    res.json(journals);
  } catch (err: any) {
    console.error('Error fetching tub positive journals by child ID:', err);
    res.status(500).json({ error: err.message || 'Ошибка получения записей туберкулеза по ребенку' });
  }
};

export const getTubPositiveJournalsByDoctorId = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { doctorId } = req.params;
    const { childId, status, startDate, endDate } = req.query;
    
    const journals = await tubPositiveJournalService.getByDoctorId(doctorId, {
      childId: childId as string,
      status: status as string,
      startDate: startDate as string,
      endDate: endDate as string
    });
    
    res.json(journals);
  } catch (err: any) {
    console.error('Error fetching tub positive journals by doctor ID:', err);
    res.status(500).json({ error: err.message || 'Ошибка получения записей туберкулеза по врачу' });
  }
};

export const getUpcomingAppointments = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { days } = req.query;
    const daysNum = days ? parseInt(days as string) : 7;
    
    const journals = await tubPositiveJournalService.getUpcomingAppointments(daysNum);
    res.json(journals);
  } catch (err: any) {
    console.error('Error fetching upcoming appointments:', err);
    res.status(500).json({ error: err.message || 'Ошибка получения предстоящих записей' });
  }
};

export const updateTubPositiveJournalStatus = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ error: 'Не указан статус' });
    }
    
    const journal = await tubPositiveJournalService.updateStatus(req.params.id, status);
    res.json(journal);
  } catch (err: any) {
    console.error('Error updating tub positive journal status:', err);
    res.status(404).json({ error: err.message || 'Ошибка обновления статуса записи туберкулеза' });
  }
};

export const addTubPositiveJournalRecommendations = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { recommendations } = req.body;
    
    if (!recommendations) {
      return res.status(400).json({ error: 'Не указаны рекомендации' });
    }
    
    const journal = await tubPositiveJournalService.addRecommendations(req.params.id, recommendations);
    res.json(journal);
  } catch (err: any) {
    console.error('Error adding tub positive journal recommendations:', err);
    res.status(404).json({ error: err.message || 'Ошибка добавления рекомендаций к записи туберкулеза' });
  }
};

export const getTubPositiveJournalStatistics = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const stats = await tubPositiveJournalService.getStatistics();
    res.json(stats);
  } catch (err: any) {
    console.error('Error fetching tub positive journal statistics:', err);
    res.status(500).json({ error: err.message || 'Ошибка получения статистики туберкулеза' });
  }
};