import { Request, Response } from 'express';
import { MedicalJournalsService } from './service';

let service: MedicalJournalsService | null = null;

const getService = (): MedicalJournalsService => {
  if (!service) {
    service = new MedicalJournalsService();
  }
  return service;
};

export const getAllMedicalJournals = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { childId, type } = req.query;
    const journals = await getService().getAll({
      childId: childId as string,
      type: type as string
    });
    res.json(journals);
  } catch (err) {
    console.error('Error fetching medical journals:', err);
    res.status(500).json({ error: 'Ошибка получения записей' });
  }
};

export const getMedicalJournalById = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const journal = await getService().getById(req.params.id);
    res.json(journal);
  } catch (err: any) {
    console.error('Error fetching medical journal:', err);
    res.status(404).json({ error: err.message || 'Запись не найдена' });
  }
};

export const createMedicalJournal = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const journal = await getService().create(req.body, req.user.id as string);
    res.status(201).json(journal);
  } catch (err: any) {
    console.error('Error creating medical journal:', err);
    res.status(400).json({ error: err.message || 'Ошибка создания записи' });
  }
};

export const updateMedicalJournal = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const journal = await getService().update(req.params.id, req.body);
    res.json(journal);
  } catch (err: any) {
    console.error('Error updating medical journal:', err);
    res.status(404).json({ error: err.message || 'Ошибка обновления записи' });
  }
};

export const deleteMedicalJournal = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const result = await getService().delete(req.params.id);
    res.json(result);
  } catch (err: any) {
    console.error('Error deleting medical journal:', err);
    res.status(404).json({ error: err.message || 'Ошибка удаления записи' });
  }
};

export const getMedicalJournalsByChildId = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { childId } = req.params;
    const journals = await getService().getByChildId(childId);
    res.json(journals);
  } catch (err: any) {
    console.error('Error fetching medical journals by child ID:', err);
    res.status(500).json({ error: err.message || 'Ошибка получения записей' });
  }
};