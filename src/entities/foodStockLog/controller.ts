import { Request, Response } from 'express';
import { FoodStockLogService } from './service';

const foodStockLogService = new FoodStockLogService();

export const getAllFoodStockLogs = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { productId, batchNumber, supplier, status, startDate, endDate, expirationStartDate, expirationEndDate, productName, supplierContact } = req.query;
    
    const logs = await foodStockLogService.getAll({
      productId: productId as string,
      batchNumber: batchNumber as string,
      supplier: supplier as string,
      status: status as string,
      startDate: startDate as string,
      endDate: endDate as string,
      expirationStartDate: expirationStartDate as string,
      expirationEndDate: expirationEndDate as string,
      productName: productName as string,
      supplierContact: supplierContact as string
    });
    
    res.json(logs);
  } catch (err) {
    console.error('Error fetching food stock logs:', err);
    res.status(500).json({ error: 'Ошибка получения записей продуктового склада' });
  }
};

export const getFoodStockLogById = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const log = await foodStockLogService.getById(req.params.id);
    res.json(log);
  } catch (err: any) {
    console.error('Error fetching food stock log:', err);
    res.status(404).json({ error: err.message || 'Запись продуктового склада не найдена' });
  }
};

export const createFoodStockLog = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const log = await foodStockLogService.create(req.body, req.user.id as string);
    res.status(201).json(log);
  } catch (err: any) {
    console.error('Error creating food stock log:', err);
    res.status(400).json({ error: err.message || 'Ошибка создания записи продуктового склада' });
  }
};

export const updateFoodStockLog = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const log = await foodStockLogService.update(req.params.id, req.body);
    res.json(log);
  } catch (err: any) {
    console.error('Error updating food stock log:', err);
    res.status(404).json({ error: err.message || 'Ошибка обновления записи продуктового склада' });
  }
};

export const deleteFoodStockLog = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const result = await foodStockLogService.delete(req.params.id);
    res.json(result);
  } catch (err: any) {
    console.error('Error deleting food stock log:', err);
    res.status(404).json({ error: err.message || 'Ошибка удаления записи продуктового склада' });
  }
};

export const getFoodStockLogsByProductId = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { productId } = req.params;
    const { batchNumber, supplier, status, startDate, endDate, expirationStartDate, expirationEndDate, productName, supplierContact } = req.query;
    
    const logs = await foodStockLogService.getByProductId(productId, {
      batchNumber: batchNumber as string,
      supplier: supplier as string,
      status: status as string,
      startDate: startDate as string,
      endDate: endDate as string,
      expirationStartDate: expirationStartDate as string,
      expirationEndDate: expirationEndDate as string,
      productName: productName as string,
      supplierContact: supplierContact as string
    });
    
    res.json(logs);
  } catch (err: any) {
    console.error('Error fetching food stock logs by product ID:', err);
    res.status(500).json({ error: err.message || 'Ошибка получения записей продуктового склада по продукту' });
  }
};

export const getFoodStockLogsByReceiverId = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { receiverId } = req.params;
    const { productId, batchNumber, supplier, status, startDate, endDate, expirationStartDate, expirationEndDate, productName, supplierContact } = req.query;
    
    const logs = await foodStockLogService.getByReceiverId(receiverId, {
      productId: productId as string,
      batchNumber: batchNumber as string,
      supplier: supplier as string,
      status: status as string,
      startDate: startDate as string,
      endDate: endDate as string,
      expirationStartDate: expirationStartDate as string,
      expirationEndDate: expirationEndDate as string,
      productName: productName as string,
      supplierContact: supplierContact as string
    });
    
    res.json(logs);
  } catch (err: any) {
    console.error('Error fetching food stock logs by receiver ID:', err);
    res.status(500).json({ error: err.message || 'Ошибка получения записей продуктового склада по получателю' });
  }
};

export const getExpiringSoon = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { days } = req.query;
    const daysNum = days ? parseInt(days as string) : 7;
    
    const logs = await foodStockLogService.getExpiringSoon(daysNum);
    res.json(logs);
  } catch (err: any) {
    console.error('Error fetching expiring soon logs:', err);
    res.status(500).json({ error: err.message || 'Ошибка получения скоро истекающих записей' });
  }
};

export const updateFoodStockLogStatus = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ error: 'Не указан статус' });
    }
    
    const log = await foodStockLogService.updateStatus(req.params.id, status);
    res.json(log);
  } catch (err: any) {
    console.error('Error updating food stock log status:', err);
    res.status(404).json({ error: err.message || 'Ошибка обновления статуса записи продуктового склада' });
  }
};

export const markFoodStockLogAsUsed = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { usageDate, usagePerson } = req.body;
    
    if (!usageDate) {
      return res.status(400).json({ error: 'Не указана дата использования' });
    }
    if (!usagePerson) {
      return res.status(400).json({ error: 'Не указан пользователь' });
    }
    
    const log = await foodStockLogService.markAsUsed(req.params.id, new Date(usageDate), usagePerson);
    res.json(log);
  } catch (err: any) {
    console.error('Error marking food stock log as used:', err);
    res.status(404).json({ error: err.message || 'Ошибка отметки использования записи продуктового склада' });
  }
};

export const markFoodStockLogAsDisposed = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { disposalDate, disposalMethod } = req.body;
    
    if (!disposalDate) {
      return res.status(400).json({ error: 'Не указана дата утилизации' });
    }
    if (!disposalMethod) {
      return res.status(400).json({ error: 'Не указан метод утилизации' });
    }
    
    const log = await foodStockLogService.markAsDisposed(req.params.id, new Date(disposalDate), disposalMethod);
    res.json(log);
  } catch (err: any) {
    console.error('Error marking food stock log as disposed:', err);
    res.status(404).json({ error: err.message || 'Ошибка отметки утилизации записи продуктового склада' });
  }
};

export const addFoodStockLogNotes = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { notes } = req.body;
    
    if (!notes) {
      return res.status(400).json({ error: 'Не указаны заметки' });
    }
    
    const log = await foodStockLogService.addNotes(req.params.id, notes);
    res.json(log);
  } catch (err: any) {
    console.error('Error adding food stock log notes:', err);
    res.status(404).json({ error: err.message || 'Ошибка добавления заметок к записи продуктового склада' });
  }
};

export const getFoodStockLogStatistics = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const stats = await foodStockLogService.getStatistics();
    res.json(stats);
  } catch (err: any) {
    console.error('Error fetching food stock log statistics:', err);
    res.status(500).json({ error: err.message || 'Ошибка получения статистики продуктового склада' });
  }
};