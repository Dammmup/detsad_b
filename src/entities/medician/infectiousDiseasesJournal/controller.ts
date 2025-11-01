import { Request, Response } from 'express';
import { InfectiousDiseasesJournalService } from './service';

// Отложенное создание экземпляра сервиса
let infectiousDiseasesJournalService: InfectiousDiseasesJournalService | null = null;

const getInfectiousDiseasesJournalService = (): InfectiousDiseasesJournalService => {
  if (!infectiousDiseasesJournalService) {
    infectiousDiseasesJournalService = new InfectiousDiseasesJournalService();
  }
  return infectiousDiseasesJournalService;
};

export const getAllInfectiousDiseasesJournals = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { childId, date, doctorId, status, disease, startDate, endDate } = req.query;
    
    const journals = await getInfectiousDiseasesJournalService().getAll({
      childId: childId as string,
      date: date as string,
      doctorId: doctorId as string,
      status: status as string,
      disease: disease as string,
      startDate: startDate as string,
      endDate: endDate as string
    });
    
    res.json(journals);
  } catch (err) {
    console.error('Error fetching infectious diseases journals:', err);
    res.status(500).json({ error: 'Ошибка получения записей инфекционных заболеваний' });
  }
};

export const getInfectiousDiseasesJournalById = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const journal = await getInfectiousDiseasesJournalService().getById(req.params.id);
    res.json(journal);
  } catch (err: any) {
    console.error('Error fetching infectious diseases journal:', err);
    res.status(404).json({ error: err.message || 'Запись инфекционного заболевания не найдена' });
  }
};

export const createInfectiousDiseasesJournal = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const journal = await getInfectiousDiseasesJournalService().create(req.body, req.user.id as string);
    res.status(201).json(journal);
  } catch (err: any) {
    console.error('Error creating infectious diseases journal:', err);
    res.status(400).json({ error: err.message || 'Ошибка создания записи инфекционного заболевания' });
  }
};

export const updateInfectiousDiseasesJournal = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const journal = await getInfectiousDiseasesJournalService().update(req.params.id, req.body);
    res.json(journal);
  } catch (err: any) {
    console.error('Error updating infectious diseases journal:', err);
    res.status(404).json({ error: err.message || 'Ошибка обновления записи инфекционного заболевания' });
  }
};

export const deleteInfectiousDiseasesJournal = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const result = await getInfectiousDiseasesJournalService().delete(req.params.id);
    res.json(result);
  } catch (err: any) {
    console.error('Error deleting infectious diseases journal:', err);
    res.status(404).json({ error: err.message || 'Ошибка удаления записи инфекционного заболевания' });
  }
};

export const getInfectiousDiseasesJournalsByChildId = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { childId } = req.params;
    const { date, doctorId, status, disease, startDate, endDate } = req.query;
    
    const journals = await getInfectiousDiseasesJournalService().getByChildId(childId, {
      date: date as string,
      doctorId: doctorId as string,
      status: status as string,
      disease: disease as string,
      startDate: startDate as string,
      endDate: endDate as string
    });
    
    res.json(journals);
  } catch (err: any) {
    console.error('Error fetching infectious diseases journals by child ID:', err);
    res.status(500).json({ error: err.message || 'Ошибка получения записей инфекционных заболеваний по ребенку' });
  }
};

export const getInfectiousDiseasesJournalsByDoctorId = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { doctorId } = req.params;
    const { childId, status, disease, startDate, endDate } = req.query;
    
    const journals = await getInfectiousDiseasesJournalService().getByDoctorId(doctorId, {
      childId: childId as string,
      status: status as string,
      disease: disease as string,
      startDate: startDate as string,
      endDate: endDate as string
    });
    
    res.json(journals);
  } catch (err: any) {
    console.error('Error fetching infectious diseases journals by doctor ID:', err);
    res.status(500).json({ error: err.message || 'Ошибка получения записей инфекционных заболеваний по врачу' });
  }
};

export const getUpcomingAppointments = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { days } = req.query;
    const daysNum = days ? parseInt(days as string) : 7;
    
    const journals = await getInfectiousDiseasesJournalService().getUpcomingAppointments(daysNum);
    res.json(journals);
  } catch (err: any) {
    console.error('Error fetching upcoming appointments:', err);
    res.status(500).json({ error: err.message || 'Ошибка получения предстоящих записей' });
  }
};

export const updateInfectiousDiseasesJournalStatus = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ error: 'Не указан статус' });
    }
    
    const journal = await getInfectiousDiseasesJournalService().updateStatus(req.params.id, status);
    res.json(journal);
  } catch (err: any) {
    console.error('Error updating infectious diseases journal status:', err);
    res.status(404).json({ error: err.message || 'Ошибка обновления статуса записи инфекционного заболевания' });
  }
};

export const addInfectiousDiseasesJournalRecommendations = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { recommendations } = req.body;
    
    if (!recommendations) {
      return res.status(400).json({ error: 'Не указаны рекомендации' });
    }
    
    const journal = await getInfectiousDiseasesJournalService().addRecommendations(req.params.id, recommendations);
    res.json(journal);
  } catch (err: any) {
    console.error('Error adding infectious diseases journal recommendations:', err);
    res.status(404).json({ error: err.message || 'Ошибка добавления рекомендаций к записи инфекционного заболевания' });
  }
};

export const getInfectiousDiseasesJournalStatistics = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const stats = await getInfectiousDiseasesJournalService().getStatistics();
    res.json(stats);
  } catch (err: any) {
    console.error('Error fetching infectious diseases journal statistics:', err);
    res.status(500).json({ error: err.message || 'Ошибка получения статистики инфекционных заболеваний' });
  }
};