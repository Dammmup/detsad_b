import { Request, Response } from 'express';
import { ChildService } from './service';
import { AuthenticatedRequest } from '../../types/express';

const childService = new ChildService();

export const getAllChildren = async (req: Request, res: Response) => {
  try {
    const children = await childService.getAll();
    res.json(children);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при получении списка детей' });
  }
};

export const getChildById = async (req: Request, res: Response) => {
  try {
    const child = await childService.getById(req.params.id);
    if (!child) return res.status(404).json({ error: 'Ребенок не найден' });
    res.json(child);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при получении данных ребенка' });
  }
};

export const getChildrenByGroupId = async (req: Request, res: Response) => {
  try {
    const children = await childService.getByGroupId(req.params.groupId);
    res.json(children);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при получении детей по группе' });
  }
};

export const createChild = async (req: Request, res: Response) => {
  try {
    const child = await childService.create(req.body);
    res.status(201).json(child);
  } catch (error) {
    res.status(400).json({ error: 'Ошибка при создании ребенка', details: error });
  }
};

export const updateChild = async (req: Request, res: Response) => {
  try {
    const child = await childService.update(req.params.id, req.body);
    if (!child) return res.status(404).json({ error: 'Ребенок не найден' });
    res.json(child);
  } catch (error) {
    res.status(400).json({ error: 'Ошибка при обновлении данных ребенка', details: error });
  }
};

export const deleteChild = async (req: Request, res: Response) => {
  try {
    const result = await childService.delete(req.params.id);
    if (!result) return res.status(404).json({ error: 'Ребенок не найден' });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при удалении ребенка' });
  }
};