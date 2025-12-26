import { Request, Response } from 'express';
import { MantouxJournalService } from './service';

let service: MantouxJournalService | null = null;

const getService = (): MantouxJournalService => {
  if (!service) {
    service = new MantouxJournalService();
  }
  return service;
};

export const getAllMantouxJournals = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { childId } = req.query;
    const journals = await getService().getAll({ childId: childId as string });
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

    const journal = await getService().getById(req.params.id);
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

    const journal = await getService().create(req.body, req.user.id as string);
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

    const journal = await getService().update(req.params.id, req.body);
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

    const result = await getService().delete(req.params.id);
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
    const journals = await getService().getByChildId(childId);
    res.json(journals);
  } catch (err: any) {
    console.error('Error fetching mantoux journals by child ID:', err);
    res.status(500).json({ error: err.message || 'Ошибка получения записей манту' });
  }
};