import { Request, Response } from 'express';
import { HelminthJournalService } from './service';

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

    const { childId } = req.query;

    const journals = await getHelminthJournalService().getAll({
      childId: childId as string
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
    const journals = await getHelminthJournalService().getByChildId(childId);
    res.json(journals);
  } catch (err: any) {
    console.error('Error fetching helminth journals by child ID:', err);
    res.status(500).json({ error: err.message || 'Ошибка получения записей гельминтов по ребенку' });
  }
};