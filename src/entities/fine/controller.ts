import { Request, Response } from 'express';
import { FineService } from './service';

const fineService = new FineService();

export const getAllFines = async (req: Request, res: Response) => {
  try {
    const fines = await fineService.getAll();
    res.json(fines);
  } catch (error) {
    console.error('Error getting fines:', error);
    res.status(500).json({ error: 'Ошибка получения штрафов' });
 }
};

export const getFineById = async (req: Request, res: Response) => {
  try {
    const fine = await fineService.getById(req.params.id);
    if (!fine) {
      return res.status(404).json({ error: 'Штраф не найден' });
    }
    res.json(fine);
  } catch (error) {
    console.error('Error getting fine:', error);
    res.status(500).json({ error: 'Ошибка получения штрафа' });
  }
};

export const createFine = async (req: Request, res: Response) => {
  try {
    const fine = await fineService.create(req.body);
    res.status(201).json(fine);
  } catch (error) {
    console.error('Error creating fine:', error);
    res.status(400).json({ error: 'Ошибка создания штрафа' });
  }
};

export const updateFine = async (req: Request, res: Response) => {
  try {
    const fine = await fineService.update(req.params.id, req.body);
    if (!fine) {
      return res.status(404).json({ error: 'Штраф не найден' });
    }
    res.json(fine);
  } catch (error) {
    console.error('Error updating fine:', error);
    res.status(400).json({ error: 'Ошибка обновления штрафа' });
  }
};

export const deleteFine = async (req: Request, res: Response) => {
  try {
    const result = await fineService.delete(req.params.id);
    if (!result) {
      return res.status(404).json({ error: 'Штраф не найден' });
    }
    res.json({ message: 'Штраф успешно удален' });
  } catch (error) {
    console.error('Error deleting fine:', error);
    res.status(500).json({ error: 'Ошибка удаления штрафа' });
  }
};

export const getFinesByUserId = async (req: Request, res: Response) => {
 try {
    const fines = await fineService.getByUserId(req.params.userId);
    res.json(fines);
  } catch (error) {
    console.error('Error getting fines by user:', error);
    res.status(500).json({ error: 'Ошибка получения штрафов пользователя' });
  }
};

export const getTotalFinesByUserId = async (req: Request, res: Response) => {
  try {
    const total = await fineService.getTotalByUserId(req.params.userId);
    res.json({ total });
  } catch (error) {
    console.error('Error getting total fines by user:', error);
    res.status(500).json({ error: 'Ошибка получения общей суммы штрафов' });
  }
};