import { Request, Response, NextFunction } from 'express';
import { financeService } from './finance.service';

export class FinanceController {
  // Получение списка финансовых операций
  async getFinances(req: Request, res: Response, next: NextFunction) {
    try {
      const { type, category, status, userId, startDate, endDate, paymentMethod, search, tags } = req.query;
      
      const filter: any = {};
      if (type) filter.type = type;
      if (category) filter.category = category;
      if (status) filter.status = status;
      if (userId) filter.userId = userId;
      if (paymentMethod) filter.paymentMethod = paymentMethod;
      if (tags) {
        filter.tags = { $in: (tags as string).split(',') };
      }
      
      // Фильтр по дате
      if (startDate || endDate) {
        filter.date = {};
        if (startDate) filter.date.$gte = new Date(startDate as string);
        if (endDate) filter.date.$lte = new Date(endDate as string);
      }
      
      // Поиск по названию
      if (search) {
        filter.title = { $regex: search, $options: 'i' };
      }
      
      const finances = await financeService.getFinances(filter);
      res.json({ success: true, data: finances });
    } catch (error) {
      next(error);
    }
  }

  // Получение финансовой операции по ID
  async getFinanceById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const finance = await financeService.getFinanceById(id);
      
      if (!finance) {
        return res.status(404).json({ success: false, message: 'Финансовая операция не найдена' });
      }
      
      res.json({ success: true, data: finance });
    } catch (error) {
      next(error);
    }
  }

  // Создание новой финансовой операции
  async createFinance(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const financeData = {
        ...req.body,
        createdBy: user._id
      };
      
      const finance = await financeService.createFinance(financeData);
      res.status(201).json({ success: true, data: finance });
    } catch (error) {
      next(error);
    }
  }

  // Обновление финансовой операции
  async updateFinance(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const user = (req as any).user;
      const financeData = {
        ...req.body,
        updatedBy: user._id
      };
      
      const updated = await financeService.updateFinance(id, financeData);
      
      if (!updated) {
        return res.status(404).json({ success: false, message: 'Финансовая операция не найдена' });
      }
      
      res.json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  }

  // Удаление финансовой операции
  async deleteFinance(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const deleted = await financeService.deleteFinance(id);
      
      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Финансовая операция не найдена' });
      }
      
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }

  // Получение финансовых операций по типу
  async getFinancesByType(req: Request, res: Response, next: NextFunction) {
    try {
      const { type } = req.params;
      const finances = await financeService.getFinancesByType(type as 'income' | 'expense');
      res.json({ success: true, data: finances });
    } catch (error) {
      next(error);
    }
  }

  // Получение финансовых операций по категории
  async getFinancesByCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const { category } = req.params;
      const finances = await financeService.getFinancesByCategory(category);
      res.json({ success: true, data: finances });
    } catch (error) {
      next(error);
    }
  }

  // Получение финансовых операций по статусу
  async getFinancesByStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { status } = req.params;
      const finances = await financeService.getFinancesByStatus(status as 'pending' | 'completed' | 'cancelled');
      res.json({ success: true, data: finances });
    } catch (error) {
      next(error);
    }
  }

  // Получение финансовых операций по пользователю
  async getFinancesByUserId(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      const finances = await financeService.getFinancesByUserId(userId);
      res.json({ success: true, data: finances });
    } catch (error) {
      next(error);
    }
  }

  // Получение финансовых операций за период
  async getFinancesByDateRange(req: Request, res: Response, next: NextFunction) {
    try {
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ success: false, message: 'Необходимо указать startDate и endDate' });
      }
      
      const finances = await financeService.getFinancesByDateRange(
        new Date(startDate as string),
        new Date(endDate as string)
      );
      res.json({ success: true, data: finances });
    } catch (error) {
      next(error);
    }
  }

  // Получение финансовых операций по способу оплаты
  async getFinancesByPaymentMethod(req: Request, res: Response, next: NextFunction) {
    try {
      const { paymentMethod } = req.params;
      const finances = await financeService.getFinancesByPaymentMethod(paymentMethod as 'cash' | 'bank_transfer' | 'card' | 'other');
      res.json({ success: true, data: finances });
    } catch (error) {
      next(error);
    }
  }

  // Получение статистики по финансовым операциям
  async getFinanceStatistics(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await financeService.getFinanceStatistics();
      res.json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  }

  // Поиск финансовых операций по названию
  async searchFinancesByName(req: Request, res: Response, next: NextFunction) {
    try {
      const { term } = req.query;
      if (!term) {
        return res.status(400).json({ success: false, message: 'Необходимо указать поисковый термин' });
      }
      
      const finances = await financeService.searchFinancesByName(term as string);
      res.json({ success: true, data: finances });
    } catch (error) {
      next(error);
    }
  }

  // Утверждение финансовой операции
  async approveFinance(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const user = (req as any).user;
      const finance = await financeService.approveFinance(id, user._id);
      
      if (!finance) {
        return res.status(404).json({ success: false, message: 'Финансовая операция не найдена' });
      }
      
      res.json({ success: true, data: finance });
    } catch (error) {
      next(error);
    }
  }

  // Отмена финансовой операции
  async cancelFinance(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const user = (req as any).user;
      const finance = await financeService.cancelFinance(id, reason);
      
      if (!finance) {
        return res.status(404).json({ success: false, message: 'Финансовая операция не найдена' });
      }
      
      res.json({ success: true, data: finance });
    } catch (error) {
      next(error);
    }
  }

  // Получение финансовых операций по тегам
  async getFinancesByTags(req: Request, res: Response, next: NextFunction) {
    try {
      const { tags } = req.query;
      if (!tags) {
        return res.status(400).json({ success: false, message: 'Необходимо указать теги' });
      }
      
      const finances = await financeService.getFinancesByTags((tags as string).split(','));
      res.json({ success: true, data: finances });
    } catch (error) {
      next(error);
    }
  }
}

// Экземпляр контроллера для использования в маршрутах
export const financeController = new FinanceController();