import { Request, Response } from 'express';
import { DetergentLogService } from './service';

const detergentLogService = new DetergentLogService();

export const getAllDetergentLogs = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { productId, batchNumber, supplier, status, startDate, endDate, expirationStartDate, expirationEndDate, productName, supplierContact } = req.query;
    
    const logs = await detergentLogService.getAll({
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
    console.error('Error fetching detergent logs:', err);
    res.status(500).json({ error: 'Ошибка получения записей моющих средств' });
  }
};

export const getDetergentLogById = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const log = await detergentLogService.getById(req.params.id);
    res.json(log);
  } catch (err: any) {
    console.error('Error fetching detergent log:', err);
    res.status(404).json({ error: err.message || 'Запись моющего средства не найдена' });
  }
};

export const createDetergentLog = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const log = await detergentLogService.create(req.body, req.user.id as string);
    res.status(201).json(log);
  } catch (err: any) {
    console.error('Error creating detergent log:', err);
    res.status(400).json({ error: err.message || 'Ошибка создания записи моющего средства' });
  }
};

export const updateDetergentLog = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const log = await detergentLogService.update(req.params.id, req.body);
    res.json(log);
  } catch (err: any) {
    console.error('Error updating detergent log:', err);
    res.status(404).json({ error: err.message || 'Ошибка обновления записи моющего средства' });
  }
};

export const deleteDetergentLog = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const result = await detergentLogService.delete(req.params.id);
    res.json(result);
  } catch (err: any) {
    console.error('Error deleting detergent log:', err);
    res.status(404).json({ error: err.message || 'Ошибка удаления записи моющего средства' });
  }
};

export const getDetergentLogsByProductId = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { productId } = req.params;
    const { batchNumber, supplier, status, startDate, endDate, expirationStartDate, expirationEndDate, productName, supplierContact } = req.query;
    
    const logs = await detergentLogService.getByProductId(productId, {
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
    console.error('Error fetching detergent logs by product ID:', err);
    res.status(500).json({ error: err.message || 'Ошибка получения записей моющих средств по продукту' });
  }
};

export const getDetergentLogsByReceiverId = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { receiverId } = req.params;
    const { productId, batchNumber, supplier, status, startDate, endDate, expirationStartDate, expirationEndDate, productName, supplierContact } = req.query;
    
    const logs = await detergentLogService.getByReceiverId(receiverId, {
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
    console.error('Error fetching detergent logs by receiver ID:', err);
    res.status(500).json({ error: err.message || 'Ошибка получения записей моющих средств по получателю' });
  }
};

export const getExpiringSoon = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { days } = req.query;
    const daysNum = days ? parseInt(days as string) : 30;
    
    const logs = await detergentLogService.getExpiringSoon(daysNum);
    res.json(logs);
  } catch (err: any) {
    console.error('Error fetching expiring soon logs:', err);
    res.status(500).json({ error: err.message || 'Ошибка получения скоро истекающих записей' });
  }
};

export const updateDetergentLogStatus = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ error: 'Не указан статус' });
    }
    
    const log = await detergentLogService.updateStatus(req.params.id, status);
    res.json(log);
  } catch (err: any) {
    console.error('Error updating detergent log status:', err);
    res.status(404).json({ error: err.message || 'Ошибка обновления статуса записи моющего средства' });
  }
};


export const addDetergentLogNotes = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { notes } = req.body;
    
    if (!notes) {
      return res.status(400).json({ error: 'Не указаны заметки' });
    }
    
    const log = await detergentLogService.addNotes(req.params.id, notes);
    res.json(log);
  } catch (err: any) {
    console.error('Error adding detergent log notes:', err);
    res.status(404).json({ error: err.message || 'Ошибка добавления заметок к записи моющего средства' });
  }
};

export const getDetergentLogStatistics = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const stats = await detergentLogService.getStatistics();
    res.json(stats);
  } catch (err: any) {
    console.error('Error fetching detergent log statistics:', err);
    res.status(500).json({ error: err.message || 'Ошибка получения статистики моющих средств' });
  }
};