import { Request, Response } from 'express';
import { HelminthJournalService } from './service';

// Отложенное создание экземпляра сервиса
let helminthJournalService: HelminthJournalService | null = null;

const getHelminthJournalService = (): HelminthJournalService => {
  if (!helminthJournalService) {
    helminthJournalService = new HelminthJournalService();
  }
  return helminthJournalService;
};

export const getAllHelminthJournals = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { childId, date, doctorId, status, startDate, endDate } = req.query;
    
    const journals = await getHelminthJournalService().getAll({
      childId: childId as string,
      date: date as string,
      doctorId: doctorId as string,
      status: status as string,
      startDate: startDate as string,
      endDate: endDate as string
    });
    
    res.json(journals);
  } catch (err) {
    console.error('Error fetching helminth journals:', err);
    res.status(500).json({ error: 'Ошибка получения записей гельминтов' });
  }
};

export const getHelminthJournalById = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const journal = await getHelminthJournalService().getById(req.params.id);
    res.json(journal);
  } catch (err: any) {
    console.error('Error fetching helminth journal:', err);
    res.status(404).json({ error: err.message || 'Запись гельминтов не найдена' });
  }
};

export const createHelminthJournal = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const journal = await getHelminthJournalService().create(req.body, req.user.id as string);
    res.status(201).json(journal);
  } catch (err: any) {
    console.error('Error creating helminth journal:', err);
    res.status(400).json({ error: err.message || 'Ошибка создания записи гельминтов' });
  }
};

export const updateHelminthJournal = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const journal = await getHelminthJournalService().update(req.params.id, req.body);
    res.json(journal);
  } catch (err: any) {
    console.error('Error updating helminth journal:', err);
    res.status(404).json({ error: err.message || 'Ошибка обновления записи гельминтов' });
  }
};

export const deleteHelminthJournal = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const result = await getHelminthJournalService().delete(req.params.id);
    res.json(result);
  } catch (err: any) {
    console.error('Error deleting helminth journal:', err);
    res.status(404).json({ error: err.message || 'Ошибка удаления записи гельминтов' });
  }
};

export const getHelminthJournalsByChildId = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { childId } = req.params;
    const { date, doctorId, status, startDate, endDate } = req.query;
    
    const journals = await getHelminthJournalService().getByChildId(childId, {
      date: date as string,
      doctorId: doctorId as string,
      status: status as string,
      startDate: startDate as string,
      endDate: endDate as string
    });
    
    res.json(journals);
  } catch (err: any) {
    console.error('Error fetching helminth journals by child ID:', err);
    res.status(500).json({ error: err.message || 'Ошибка получения записей гельминтов по ребенку' });
  }
};

export const getHelminthJournalsByDoctorId = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { doctorId } = req.params;
    const { childId, status, startDate, endDate } = req.query;
    
    const journals = await getHelminthJournalService().getByDoctorId(doctorId, {
      childId: childId as string,
      status: status as string,
      startDate: startDate as string,
      endDate: endDate as string
    });
    
    res.json(journals);
  } catch (err: any) {
    console.error('Error fetching helminth journals by doctor ID:', err);
    res.status(500).json({ error: err.message || 'Ошибка получения записей гельминтов по врачу' });
  }
};

export const getUpcomingAppointments = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { days } = req.query;
    const daysNum = days ? parseInt(days as string) : 7;
    
    const journals = await getHelminthJournalService().getUpcomingAppointments(daysNum);
    res.json(journals);
  } catch (err: any) {
    console.error('Error fetching upcoming appointments:', err);
    res.status(500).json({ error: err.message || 'Ошибка получения предстоящих записей' });
  }
};

export const updateHelminthJournalStatus = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ error: 'Не указан статус' });
    }
    
    const journal = await getHelminthJournalService().updateStatus(req.params.id, status);
    res.json(journal);
  } catch (err: any) {
    console.error('Error updating helminth journal status:', err);
    res.status(404).json({ error: err.message || 'Ошибка обновления статуса записи гельминтов' });
  }
};

export const addHelminthJournalRecommendations = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { recommendations } = req.body;
    
    if (!recommendations) {
      return res.status(400).json({ error: 'Не указаны рекомендации' });
    }
    
    const journal = await getHelminthJournalService().addRecommendations(req.params.id, recommendations);
    res.json(journal);
  } catch (err: any) {
    console.error('Error adding helminth journal recommendations:', err);
    res.status(404).json({ error: err.message || 'Ошибка добавления рекомендаций к записи гельминтов' });
  }
};

export const getHelminthJournalStatistics = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const stats = await getHelminthJournalService().getStatistics();
    res.json(stats);
  } catch (err: any) {
    console.error('Error fetching helminth journal statistics:', err);
    res.status(500).json({ error: err.message || 'Ошибка получения статистики гельминтов' });
  }
};