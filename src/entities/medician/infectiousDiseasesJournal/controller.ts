import { Request, Response } from 'express';
import { InfectiousDiseasesJournalService } from './service';

let service: InfectiousDiseasesJournalService | null = null;

const getService = (): InfectiousDiseasesJournalService => {
  if (!service) {
    service = new InfectiousDiseasesJournalService();
  }
  return service;
};

export const getAllInfectiousDiseasesJournals = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { childId } = req.query;
    const journals = await getService().getAll({ childId: childId as string });
    res.json(journals);
  } catch (err) {
    console.error('Error fetching infectious diseases journals:', err);
    res.status(500).json({ error: 'Ошибка получения записей' });
  }
};

export const getInfectiousDiseasesJournalById = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const journal = await getService().getById(req.params.id);
    res.json(journal);
  } catch (err: any) {
    console.error('Error fetching infectious diseases journal:', err);
    res.status(404).json({ error: err.message || 'Запись не найдена' });
  }
};

export const createInfectiousDiseasesJournal = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const journal = await getService().create(req.body, req.user.id as string);
    res.status(201).json(journal);
  } catch (err: any) {
    console.error('Error creating infectious diseases journal:', err);
    res.status(400).json({ error: err.message || 'Ошибка создания записи' });
  }
};

export const updateInfectiousDiseasesJournal = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const journal = await getService().update(req.params.id, req.body);
    res.json(journal);
  } catch (err: any) {
    console.error('Error updating infectious diseases journal:', err);
    res.status(404).json({ error: err.message || 'Ошибка обновления записи' });
  }
};

export const deleteInfectiousDiseasesJournal = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const result = await getService().delete(req.params.id);
    res.json(result);
  } catch (err: any) {
    console.error('Error deleting infectious diseases journal:', err);
    res.status(404).json({ error: err.message || 'Ошибка удаления записи' });
  }
};

export const getInfectiousDiseasesJournalsByChildId = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { childId } = req.params;
    const journals = await getService().getByChildId(childId);
    res.json(journals);
  } catch (err: any) {
    console.error('Error fetching infectious diseases journals by child ID:', err);
    res.status(500).json({ error: err.message || 'Ошибка получения записей' });
  }
};