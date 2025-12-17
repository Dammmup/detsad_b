import { Request, Response } from 'express';
import { MedicalJournalsService } from './service';


let medicalJournalsService: MedicalJournalsService | null = null;

const getMedicalJournalsService = (): MedicalJournalsService => {
  if (!medicalJournalsService) {
    medicalJournalsService = new MedicalJournalsService();
  }
  return medicalJournalsService;
};

export const getAllMedicalJournals = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { childId, type, doctorId, status, fromDate, toDate } = req.query;

    const journals = await getMedicalJournalsService().getAll({
      childId: childId as string,
      type: type as string,
      doctorId: doctorId as string,
      status: status as string,
      fromDate: fromDate as string,
      toDate: toDate as string
    });

    res.json(journals);
  } catch (err) {
    console.error('Error fetching medical journals:', err);
    res.status(500).json({ error: 'Ошибка получения медицинских записей' });
  }
};

export const getMedicalJournalById = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const journal = await getMedicalJournalsService().getById(req.params.id);
    res.json(journal);
  } catch (err: any) {
    console.error('Error fetching medical journal:', err);
    res.status(404).json({ error: err.message || 'Медицинская запись не найдена' });
  }
};

export const createMedicalJournal = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }


    const journalData = {
      ...req.body,
      doctor: req.user.id
    };

    const journal = await getMedicalJournalsService().create(journalData);
    res.status(201).json(journal);
  } catch (err: any) {
    console.error('Error creating medical journal:', err);
    res.status(400).json({ error: err.message || 'Ошибка создания медицинской записи' });
  }
};

export const updateMedicalJournal = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const journal = await getMedicalJournalsService().update(req.params.id, req.body);
    res.json(journal);
  } catch (err: any) {
    console.error('Error updating medical journal:', err);
    res.status(404).json({ error: err.message || 'Ошибка обновления медицинской записи' });
  }
};

export const deleteMedicalJournal = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const result = await getMedicalJournalsService().delete(req.params.id);
    res.json(result);
  } catch (err: any) {
    console.error('Error deleting medical journal:', err);
    res.status(404).json({ error: err.message || 'Ошибка удаления медицинской записи' });
  }
};

export const getMedicalJournalsByChildAndType = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { childId, type } = req.params;

    const journals = await getMedicalJournalsService().getByChildAndType(childId, type);
    res.json(journals);
  } catch (err: any) {
    console.error('Error fetching medical journals by child and type:', err);
    res.status(500).json({ error: err.message || 'Ошибка получения медицинских записей по ребенку и типу' });
  }
};

export const getUpcomingAppointments = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { days } = req.query;
    const daysNum = days ? parseInt(days as string) : 7;

    const appointments = await getMedicalJournalsService().getUpcomingAppointments(daysNum);
    res.json(appointments);
  } catch (err: any) {
    console.error('Error fetching upcoming appointments:', err);
    res.status(500).json({ error: err.message || 'Ошибка получения предстоящих записей' });
  }
};

export const updateMedicalJournalStatus = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Не указан статус' });
    }

    const journal = await getMedicalJournalsService().updateStatus(req.params.id, status);
    res.json(journal);
  } catch (err: any) {
    console.error('Error updating medical journal status:', err);
    res.status(404).json({ error: err.message || 'Ошибка обновления статуса медицинской записи' });
  }
};

export const addMedicalJournalRecommendations = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { recommendations } = req.body;

    if (!recommendations) {
      return res.status(400).json({ error: 'Не указаны рекомендации' });
    }

    const journal = await getMedicalJournalsService().addRecommendations(req.params.id, recommendations);
    res.json(journal);
  } catch (err: any) {
    console.error('Error adding medical journal recommendations:', err);
    res.status(404).json({ error: err.message || 'Ошибка добавления рекомендаций к медицинской записи' });
  }
};

export const getMedicalJournalsStatistics = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const stats = await getMedicalJournalsService().getStatistics();
    res.json(stats);
  } catch (err: any) {
    console.error('Error fetching medical journals statistics:', err);
    res.status(500).json({ error: err.message || 'Ошибка получения статистики медицинских записей' });
  }
};