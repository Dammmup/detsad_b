import { Request, Response } from 'express';
import { SomaticJournalService } from './service';

const somaticJournalService = new SomaticJournalService();

export const getAllSomaticJournals = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { childId, date, doctorId, status, startDate, endDate } = req.query;
    
    const journals = await somaticJournalService.getAll({
      childId: childId as string,
      date: date as string,
      doctorId: doctorId as string,
      status: status as string,
      startDate: startDate as string,
      endDate: endDate as string
    });
    
    res.json(journals);
  } catch (err) {
    console.error('Error fetching somatic journals:', err);
    res.status(500).json({ error: 'Ошибка получения записей соматического журнала' });
  }
};

export const getSomaticJournalById = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const journal = await somaticJournalService.getById(req.params.id);
    res.json(journal);
  } catch (err: any) {
    console.error('Error fetching somatic journal:', err);
    res.status(404).json({ error: err.message || 'Запись соматического журнала не найдена' });
  }
};

export const createSomaticJournal = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const journal = await somaticJournalService.create(req.body, req.user.id as string);
    res.status(201).json(journal);
  } catch (err: any) {
    console.error('Error creating somatic journal:', err);
    res.status(400).json({ error: err.message || 'Ошибка создания записи соматического журнала' });
  }
};

export const updateSomaticJournal = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const journal = await somaticJournalService.update(req.params.id, req.body);
    res.json(journal);
  } catch (err: any) {
    console.error('Error updating somatic journal:', err);
    res.status(404).json({ error: err.message || 'Ошибка обновления записи соматического журнала' });
  }
};

export const deleteSomaticJournal = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const result = await somaticJournalService.delete(req.params.id);
    res.json(result);
  } catch (err: any) {
    console.error('Error deleting somatic journal:', err);
    res.status(404).json({ error: err.message || 'Ошибка удаления записи соматического журнала' });
  }
};

export const getSomaticJournalsByChildId = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { childId } = req.params;
    const { date, doctorId, status, startDate, endDate } = req.query;
    
    const journals = await somaticJournalService.getByChildId(childId, {
      date: date as string,
      doctorId: doctorId as string,
      status: status as string,
      startDate: startDate as string,
      endDate: endDate as string
    });
    
    res.json(journals);
  } catch (err: any) {
    console.error('Error fetching somatic journals by child ID:', err);
    res.status(500).json({ error: err.message || 'Ошибка получения записей соматического журнала по ребенку' });
  }
};

export const getSomaticJournalsByDoctorId = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { doctorId } = req.params;
    const { childId, status, startDate, endDate } = req.query;
    
    const journals = await somaticJournalService.getByDoctorId(doctorId, {
      childId: childId as string,
      status: status as string,
      startDate: startDate as string,
      endDate: endDate as string
    });
    
    res.json(journals);
  } catch (err: any) {
    console.error('Error fetching somatic journals by doctor ID:', err);
    res.status(500).json({ error: err.message || 'Ошибка получения записей соматического журнала по врачу' });
  }
};

export const getUpcomingAppointments = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { days } = req.query;
    const daysNum = days ? parseInt(days as string) : 7;
    
    const journals = await somaticJournalService.getUpcomingAppointments(daysNum);
    res.json(journals);
  } catch (err: any) {
    console.error('Error fetching upcoming appointments:', err);
    res.status(500).json({ error: err.message || 'Ошибка получения предстоящих записей' });
  }
};

export const updateSomaticJournalStatus = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ error: 'Не указан статус' });
    }
    
    const journal = await somaticJournalService.updateStatus(req.params.id, status);
    res.json(journal);
  } catch (err: any) {
    console.error('Error updating somatic journal status:', err);
    res.status(404).json({ error: err.message || 'Ошибка обновления статуса записи соматического журнала' });
  }
};

export const addSomaticJournalRecommendations = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { recommendations } = req.body;
    
    if (!recommendations) {
      return res.status(400).json({ error: 'Не указаны рекомендации' });
    }
    
    const journal = await somaticJournalService.addRecommendations(req.params.id, recommendations);
    res.json(journal);
  } catch (err: any) {
    console.error('Error adding somatic journal recommendations:', err);
    res.status(404).json({ error: err.message || 'Ошибка добавления рекомендаций к записи соматического журнала' });
  }
};

export const getSomaticJournalStatistics = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const stats = await somaticJournalService.getStatistics();
    res.json(stats);
  } catch (err: any) {
    console.error('Error fetching somatic journal statistics:', err);
    res.status(500).json({ error: err.message || 'Ошибка получения статистики соматического журнала' });
  }
};