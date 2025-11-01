import { Request, Response } from 'express';
import { MantouxJournalService } from './service';

// Отложенное создание экземпляра сервиса
let mantouxJournalService: MantouxJournalService | null = null;

const getMantouxJournalService = (): MantouxJournalService => {
  if (!mantouxJournalService) {
    mantouxJournalService = new MantouxJournalService();
  }
  return mantouxJournalService;
};

export const getAllMantouxJournals = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { childId, date, doctorId, status, reactionType, startDate, endDate } = req.query;
    
    const journals = await getMantouxJournalService().getAll({
      childId: childId as string,
      date: date as string,
      doctorId: doctorId as string,
      status: status as string,
      reactionType: reactionType as string,
      startDate: startDate as string,
      endDate: endDate as string
    });
    
    res.json(journals);
  } catch (err) {
    console.error('Error fetching mantoux journals:', err);
    res.status(500).json({ error: 'Ошибка получения записей манту' });
  }
};

export const getMantouxJournalById = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const journal = await getMantouxJournalService().getById(req.params.id);
    res.json(journal);
  } catch (err: any) {
    console.error('Error fetching mantoux journal:', err);
    res.status(404).json({ error: err.message || 'Запись манту не найдена' });
  }
};

export const createMantouxJournal = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const journal = await getMantouxJournalService().create(req.body, req.user.id as string);
    res.status(201).json(journal);
  } catch (err: any) {
    console.error('Error creating mantoux journal:', err);
    res.status(400).json({ error: err.message || 'Ошибка создания записи манту' });
  }
};

export const updateMantouxJournal = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const journal = await getMantouxJournalService().update(req.params.id, req.body);
    res.json(journal);
  } catch (err: any) {
    console.error('Error updating mantoux journal:', err);
    res.status(404).json({ error: err.message || 'Ошибка обновления записи манту' });
  }
};

export const deleteMantouxJournal = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const result = await getMantouxJournalService().delete(req.params.id);
    res.json(result);
  } catch (err: any) {
    console.error('Error deleting mantoux journal:', err);
    res.status(404).json({ error: err.message || 'Ошибка удаления записи манту' });
  }
};

export const getMantouxJournalsByChildId = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { childId } = req.params;
    const { date, doctorId, status, reactionType, startDate, endDate } = req.query;
    
    const journals = await getMantouxJournalService().getByChildId(childId, {
      date: date as string,
      doctorId: doctorId as string,
      status: status as string,
      reactionType: reactionType as string,
      startDate: startDate as string,
      endDate: endDate as string
    });
    
    res.json(journals);
  } catch (err: any) {
    console.error('Error fetching mantoux journals by child ID:', err);
    res.status(500).json({ error: err.message || 'Ошибка получения записей манту по ребенку' });
  }
};

export const getMantouxJournalsByDoctorId = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { doctorId } = req.params;
    const { childId, status, reactionType, startDate, endDate } = req.query;
    
    const journals = await getMantouxJournalService().getByDoctorId(doctorId, {
      childId: childId as string,
      status: status as string,
      reactionType: reactionType as string,
      startDate: startDate as string,
      endDate: endDate as string
    });
    
    res.json(journals);
  } catch (err: any) {
    console.error('Error fetching mantoux journals by doctor ID:', err);
    res.status(500).json({ error: err.message || 'Ошибка получения записей манту по врачу' });
  }
};

export const getUpcomingAppointments = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { days } = req.query;
    const daysNum = days ? parseInt(days as string) : 7;
    
    const journals = await getMantouxJournalService().getUpcomingAppointments(daysNum);
    res.json(journals);
  } catch (err: any) {
    console.error('Error fetching upcoming appointments:', err);
    res.status(500).json({ error: err.message || 'Ошибка получения предстоящих записей' });
  }
};

export const updateMantouxJournalStatus = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ error: 'Не указан статус' });
    }
    
    const journal = await getMantouxJournalService().updateStatus(req.params.id, status);
    res.json(journal);
  } catch (err: any) {
    console.error('Error updating mantoux journal status:', err);
    res.status(404).json({ error: err.message || 'Ошибка обновления статуса записи манту' });
  }
};

export const addMantouxJournalRecommendations = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { recommendations } = req.body;
    
    if (!recommendations) {
      return res.status(400).json({ error: 'Не указаны рекомендации' });
    }
    
    const journal = await getMantouxJournalService().addRecommendations(req.params.id, recommendations);
    res.json(journal);
  } catch (err: any) {
    console.error('Error adding mantoux journal recommendations:', err);
    res.status(404).json({ error: err.message || 'Ошибка добавления рекомендаций к записи манту' });
  }
};

export const getMantouxJournalStatistics = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const stats = await getMantouxJournalService().getStatistics();
    res.json(stats);
  } catch (err: any) {
    console.error('Error fetching mantoux journal statistics:', err);
    res.status(500).json({ error: err.message || 'Ошибка получения статистики манту' });
  }
};