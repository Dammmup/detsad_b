import { Request, Response } from 'express';
import { PerishableBrakService } from './service';

const perishableBrakService = new PerishableBrakService();

export const getAllPerishableBraks = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { productId, inspectorId, status, startDate, endDate, disposalStartDate, disposalEndDate, productName, batchNumber } = req.query;
    
    const braks = await perishableBrakService.getAll({
      productId: productId as string,
      inspectorId: inspectorId as string,
      status: status as string,
      startDate: startDate as string,
      endDate: endDate as string,
      disposalStartDate: disposalStartDate as string,
      disposalEndDate: disposalEndDate as string,
      productName: productName as string,
      batchNumber: batchNumber as string
    });
    
    res.json(braks);
  } catch (err) {
    console.error('Error fetching perishable braks:', err);
    res.status(500).json({ error: 'Ошибка получения записей брака' });
  }
};

export const getPerishableBrakById = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const brak = await perishableBrakService.getById(req.params.id);
    res.json(brak);
  } catch (err: any) {
    console.error('Error fetching perishable brak:', err);
    res.status(404).json({ error: err.message || 'Запись брака не найдена' });
  }
};

export const createPerishableBrak = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const brak = await perishableBrakService.create(req.body, req.user.id as string);
    res.status(201).json(brak);
  } catch (err: any) {
    console.error('Error creating perishable brak:', err);
    res.status(400).json({ error: err.message || 'Ошибка создания записи брака' });
  }
};

export const updatePerishableBrak = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const brak = await perishableBrakService.update(req.params.id, req.body);
    res.json(brak);
  } catch (err: any) {
    console.error('Error updating perishable brak:', err);
    res.status(404).json({ error: err.message || 'Ошибка обновления записи брака' });
  }
};

export const deletePerishableBrak = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const result = await perishableBrakService.delete(req.params.id);
    res.json(result);
  } catch (err: any) {
    console.error('Error deleting perishable brak:', err);
    res.status(404).json({ error: err.message || 'Ошибка удаления записи брака' });
  }
};

export const getPerishableBraksByProductId = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { productId } = req.params;
    const { inspectorId, status, startDate, endDate, disposalStartDate, disposalEndDate, productName, batchNumber } = req.query;
    
    const braks = await perishableBrakService.getByProductId(productId, {
      inspectorId: inspectorId as string,
      status: status as string,
      startDate: startDate as string,
      endDate: endDate as string,
      disposalStartDate: disposalStartDate as string,
      disposalEndDate: disposalEndDate as string,
      productName: productName as string,
      batchNumber: batchNumber as string
    });
    
    res.json(braks);
  } catch (err: any) {
    console.error('Error fetching perishable braks by product ID:', err);
    res.status(500).json({ error: err.message || 'Ошибка получения записей брака по продукту' });
  }
};

export const getPerishableBraksByInspectorId = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { inspectorId } = req.params;
    const { productId, status, startDate, endDate, disposalStartDate, disposalEndDate, productName, batchNumber } = req.query;
    
    const braks = await perishableBrakService.getByInspectorId(inspectorId, {
      productId: productId as string,
      status: status as string,
      startDate: startDate as string,
      endDate: endDate as string,
      disposalStartDate: disposalStartDate as string,
      disposalEndDate: disposalEndDate as string,
      productName: productName as string,
      batchNumber: batchNumber as string
    });
    
    res.json(braks);
  } catch (err: any) {
    console.error('Error fetching perishable braks by inspector ID:', err);
    res.status(500).json({ error: err.message || 'Ошибка получения записей брака по инспектору' });
  }
};

export const getExpiredProducts = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { days } = req.query;
    const daysNum = days ? parseInt(days as string) : 7;
    
    const braks = await perishableBrakService.getExpiredProducts(daysNum);
    res.json(braks);
  } catch (err: any) {
    console.error('Error fetching expired products:', err);
    res.status(500).json({ error: err.message || 'Ошибка получения просроченных продуктов' });
  }
};

export const markPerishableBrakAsDisposed = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { disposedBy, disposalDate } = req.body;
    
    if (!disposedBy) {
      return res.status(400).json({ error: 'Не указан утилизатор' });
    }
    
    const brak = await perishableBrakService.markAsDisposed(req.params.id, disposedBy, disposalDate);
    res.json(brak);
  } catch (err: any) {
    console.error('Error marking perishable brak as disposed:', err);
    res.status(404).json({ error: err.message || 'Ошибка отметки утилизации записи брака' });
  }
};

export const updatePerishableBrakStatus = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ error: 'Не указан статус' });
    }
    
    const brak = await perishableBrakService.updateStatus(req.params.id, status);
    res.json(brak);
  } catch (err: any) {
    console.error('Error updating perishable brak status:', err);
    res.status(404).json({ error: err.message || 'Ошибка обновления статуса записи брака' });
  }
};

export const addPerishableBrakRecommendations = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { recommendations } = req.body;
    
    if (!recommendations) {
      return res.status(400).json({ error: 'Не указаны рекомендации' });
    }
    
    const brak = await perishableBrakService.addRecommendations(req.params.id, recommendations);
    res.json(brak);
  } catch (err: any) {
    console.error('Error adding perishable brak recommendations:', err);
    res.status(404).json({ error: err.message || 'Ошибка добавления рекомендаций к записи брака' });
  }
};

export const getPerishableBrakStatistics = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const stats = await perishableBrakService.getStatistics();
    res.json(stats);
  } catch (err: any) {
    console.error('Error fetching perishable brak statistics:', err);
    res.status(500).json({ error: err.message || 'Ошибка получения статистики брака' });
  }
};