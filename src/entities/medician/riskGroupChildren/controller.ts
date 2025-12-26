import { Request, Response } from 'express';
import { RiskGroupChildrenService } from './service';

let service: RiskGroupChildrenService | null = null;

const getService = (): RiskGroupChildrenService => {
  if (!service) {
    service = new RiskGroupChildrenService();
  }
  return service;
};

export const getAllRiskGroupChildren = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { childId } = req.query;
    const records = await getService().getAll({ childId: childId as string });
    res.json(records);
  } catch (err) {
    console.error('Error fetching risk group children:', err);
    res.status(500).json({ error: 'Ошибка получения записей' });
  }
};

export const getRiskGroupChildById = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const record = await getService().getById(req.params.id);
    res.json(record);
  } catch (err: any) {
    console.error('Error fetching risk group child:', err);
    res.status(404).json({ error: err.message || 'Запись не найдена' });
  }
};

export const createRiskGroupChild = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const record = await getService().create(req.body, req.user.id as string);
    res.status(201).json(record);
  } catch (err: any) {
    console.error('Error creating risk group child:', err);
    res.status(400).json({ error: err.message || 'Ошибка создания записи' });
  }
};

export const updateRiskGroupChild = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const record = await getService().update(req.params.id, req.body);
    res.json(record);
  } catch (err: any) {
    console.error('Error updating risk group child:', err);
    res.status(404).json({ error: err.message || 'Ошибка обновления записи' });
  }
};

export const deleteRiskGroupChild = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const result = await getService().delete(req.params.id);
    res.json(result);
  } catch (err: any) {
    console.error('Error deleting risk group child:', err);
    res.status(404).json({ error: err.message || 'Ошибка удаления записи' });
  }
};

export const getRiskGroupChildrenByChildId = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { childId } = req.params;
    const records = await getService().getByChildId(childId);
    res.json(records);
  } catch (err: any) {
    console.error('Error fetching risk group children by child ID:', err);
    res.status(500).json({ error: err.message || 'Ошибка получения записей' });
  }
};