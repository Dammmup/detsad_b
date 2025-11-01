import { Request, Response } from 'express';
import { OrganolepticJournalService } from './service';

const organolepticJournalService = new OrganolepticJournalService();

export const getAllOrganolepticJournals = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { childId, date, inspectorId, status, productName, supplier, startDate, endDate } = req.query;
    
    const journals = await organolepticJournalService.getAll({
      childId: childId as string,
      date: date as string,
      inspectorId: inspectorId as string,
      status: status as string,
      productName: productName as string,
      supplier: supplier as string,
      startDate: startDate as string,
      endDate: endDate as string
    });
    
    res.json(journals);
  } catch (err) {
    console.error('Error fetching organoleptic journals:', err);
    res.status(500).json({ error: 'Ошибка получения записей органолептического контроля' });
  }
};

export const getOrganolepticJournalById = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const journal = await organolepticJournalService.getById(req.params.id);
    res.json(journal);
  } catch (err: any) {
    console.error('Error fetching organoleptic journal:', err);
    res.status(404).json({ error: err.message || 'Запись органолептического контроля не найдена' });
  }
};

export const createOrganolepticJournal = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const journal = await organolepticJournalService.create(req.body, req.user.id as string);
    res.status(201).json(journal);
  } catch (err: any) {
    console.error('Error creating organoleptic journal:', err);
    res.status(400).json({ error: err.message || 'Ошибка создания записи органолептического контроля' });
  }
};

export const updateOrganolepticJournal = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const journal = await organolepticJournalService.update(req.params.id, req.body);
    res.json(journal);
  } catch (err: any) {
    console.error('Error updating organoleptic journal:', err);
    res.status(404).json({ error: err.message || 'Ошибка обновления записи органолептического контроля' });
  }
};

export const deleteOrganolepticJournal = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const result = await organolepticJournalService.delete(req.params.id);
    res.json(result);
  } catch (err: any) {
    console.error('Error deleting organoleptic journal:', err);
    res.status(404).json({ error: err.message || 'Ошибка удаления записи органолептического контроля' });
  }
};

export const getOrganolepticJournalsByChildId = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { childId } = req.params;
    const { date, inspectorId, status, productName, supplier, startDate, endDate } = req.query;
    
    const journals = await organolepticJournalService.getByChildId(childId, {
      date: date as string,
      inspectorId: inspectorId as string,
      status: status as string,
      productName: productName as string,
      supplier: supplier as string,
      startDate: startDate as string,
      endDate: endDate as string
    });
    
    res.json(journals);
  } catch (err: any) {
    console.error('Error fetching organoleptic journals by child ID:', err);
    res.status(500).json({ error: err.message || 'Ошибка получения записей органолептического контроля по ребенку' });
  }
};

export const getOrganolepticJournalsByInspectorId = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { inspectorId } = req.params;
    const { childId, status, productName, supplier, startDate, endDate } = req.query;
    
    const journals = await organolepticJournalService.getByInspectorId(inspectorId, {
      childId: childId as string,
      status: status as string,
      productName: productName as string,
      supplier: supplier as string,
      startDate: startDate as string,
      endDate: endDate as string
    });
    
    res.json(journals);
  } catch (err: any) {
    console.error('Error fetching organoleptic journals by inspector ID:', err);
    res.status(500).json({ error: err.message || 'Ошибка получения записей органолептического контроля по инспектору' });
  }
};

export const getUpcomingInspections = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { days } = req.query;
    const daysNum = days ? parseInt(days as string) : 7;
    
    const journals = await organolepticJournalService.getUpcomingInspections(daysNum);
    res.json(journals);
  } catch (err: any) {
    console.error('Error fetching upcoming inspections:', err);
    res.status(500).json({ error: err.message || 'Ошибка получения предстоящих проверок' });
  }
};

export const updateOrganolepticJournalStatus = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ error: 'Не указан статус' });
    }
    
    const journal = await organolepticJournalService.updateStatus(req.params.id, status);
    res.json(journal);
  } catch (err: any) {
    console.error('Error updating organoleptic journal status:', err);
    res.status(404).json({ error: err.message || 'Ошибка обновления статуса записи органолептического контроля' });
  }
};

export const addOrganolepticJournalRecommendations = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { recommendations } = req.body;
    
    if (!recommendations) {
      return res.status(400).json({ error: 'Не указаны рекомендации' });
    }
    
    const journal = await organolepticJournalService.addRecommendations(req.params.id, recommendations);
    res.json(journal);
  } catch (err: any) {
    console.error('Error adding organoleptic journal recommendations:', err);
    res.status(404).json({ error: err.message || 'Ошибка добавления рекомендаций к записи органолептического контроля' });
  }
};

export const getOrganolepticJournalStatistics = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const stats = await organolepticJournalService.getStatistics();
    res.json(stats);
  } catch (err: any) {
    console.error('Error fetching organoleptic journal statistics:', err);
    res.status(500).json({ error: err.message || 'Ошибка получения статистики органолептического контроля' });
  }
};