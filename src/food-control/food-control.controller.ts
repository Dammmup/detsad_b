import { Request, Response, NextFunction } from 'express';
import { foodControlService } from './food-control.service';

export class FoodControlController {
  // === Detergent Logs ===
  
  // Получение списка записей о моющих средствах
  async getDetergentLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const { recordedBy, startDate, endDate } = req.query;
      
      const filter: any = {};
      if (recordedBy) filter.recordedBy = recordedBy;
      if (startDate || endDate) {
        filter.date = {};
        if (startDate) filter.date.$gte = new Date(startDate as string);
        if (endDate) filter.date.$lte = new Date(endDate as string);
      }
      
      const logs = await foodControlService.getDetergentLogs(filter);
      res.json({ success: true, data: logs });
    } catch (error) {
      next(error);
    }
  }

  // Получение записи о моющем средстве по ID
  async getDetergentLogById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const log = await foodControlService.getDetergentLogById(id);
      
      if (!log) {
        return res.status(404).json({ success: false, message: 'Запись о моющем средстве не найдена' });
      }
      
      res.json({ success: true, data: log });
    } catch (error) {
      next(error);
    }
  }

  // Создание новой записи о моющем средстве
  async createDetergentLog(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const logData = {
        ...req.body,
        recordedBy: user._id
      };
      
      const log = await foodControlService.createDetergentLog(logData);
      res.status(201).json({ success: true, data: log });
    } catch (error) {
      next(error);
    }
  }

  // Обновление записи о моющем средстве
  async updateDetergentLog(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updated = await foodControlService.updateDetergentLog(id, req.body);
      
      if (!updated) {
        return res.status(404).json({ success: false, message: 'Запись о моющем средстве не найдена' });
      }
      
      res.json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  }

  // Удаление записи о моющем средстве
  async deleteDetergentLog(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const deleted = await foodControlService.deleteDetergentLog(id);
      
      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Запись о моющем средстве не найдена' });
      }
      
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }

  // === Food Staff Health ===
  
  // Получение записей о здоровье сотрудников питания
  async getFoodStaffHealthRecords(req: Request, res: Response, next: NextFunction) {
    try {
      const { staffId, doctorId, startDate, endDate } = req.query;
      
      const filter: any = {};
      if (staffId) filter.staffId = staffId;
      if (doctorId) filter.doctorId = doctorId;
      if (startDate || endDate) {
        filter.date = {};
        if (startDate) filter.date.$gte = new Date(startDate as string);
        if (endDate) filter.date.$lte = new Date(endDate as string);
      }
      
      const records = await foodControlService.getFoodStaffHealthRecords(filter);
      res.json({ success: true, data: records });
    } catch (error) {
      next(error);
    }
  }

  // Получение записи о здоровье сотрудника питания по ID
  async getFoodStaffHealthRecordById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const record = await foodControlService.getFoodStaffHealthRecordById(id);
      
      if (!record) {
        return res.status(404).json({ success: false, message: 'Запись о здоровье сотрудника питания не найдена' });
      }
      
      res.json({ success: true, data: record });
    } catch (error) {
      next(error);
    }
  }

  // Создание новой записи о здоровье сотрудника питания
  async createFoodStaffHealthRecord(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const recordData = {
        ...req.body,
        doctorId: user._id
      };
      
      const record = await foodControlService.createFoodStaffHealthRecord(recordData);
      res.status(201).json({ success: true, data: record });
    } catch (error) {
      next(error);
    }
  }

  // Обновление записи о здоровье сотрудника питания
  async updateFoodStaffHealthRecord(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updated = await foodControlService.updateFoodStaffHealthRecord(id, req.body);
      
      if (!updated) {
        return res.status(404).json({ success: false, message: 'Запись о здоровье сотрудника питания не найдена' });
      }
      
      res.json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  }

  // Удаление записи о здоровье сотрудника питания
  async deleteFoodStaffHealthRecord(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const deleted = await foodControlService.deleteFoodStaffHealthRecord(id);
      
      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Запись о здоровье сотрудника питания не найдена' });
      }
      
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }

  // === Food Stock Logs ===
  
  // Получение записей о запасах продуктов
  async getFoodStockLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const { startDate, endDate, productId } = req.query;
      
      const filter: any = {};
      if (productId) filter.productId = productId;
      if (startDate || endDate) {
        filter.date = {};
        if (startDate) filter.date.$gte = new Date(startDate as string);
        if (endDate) filter.date.$lte = new Date(endDate as string);
      }
      
      const logs = await foodControlService.getFoodStockLogs(filter);
      res.json({ success: true, data: logs });
    } catch (error) {
      next(error);
    }
  }

  // Получение записи о запасе продуктов по ID
  async getFoodStockLogById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const log = await foodControlService.getFoodStockLogById(id);
      
      if (!log) {
        return res.status(404).json({ success: false, message: 'Запись о запасе продуктов не найдена' });
      }
      
      res.json({ success: true, data: log });
    } catch (error) {
      next(error);
    }
  }

  // Создание новой записи о запасе продуктов
  async createFoodStockLog(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const logData = {
        ...req.body,
        recordedBy: user._id
      };
      
      const log = await foodControlService.createFoodStockLog(logData);
      res.status(201).json({ success: true, data: log });
    } catch (error) {
      next(error);
    }
  }

  // Обновление записи о запасе продуктов
  async updateFoodStockLog(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updated = await foodControlService.updateFoodStockLog(id, req.body);
      
      if (!updated) {
        return res.status(404).json({ success: false, message: 'Запись о запасе продуктов не найдена' });
      }
      
      res.json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  }

  // Удаление записи о запасе продуктов
  async deleteFoodStockLog(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const deleted = await foodControlService.deleteFoodStockLog(id);
      
      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Запись о запасе продуктов не найдена' });
      }
      
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }

  // === Organoleptic Records ===
  
  // Получение органолептических записей
  async getOrganolepticRecords(req: Request, res: Response, next: NextFunction) {
    try {
      const { productId, inspectorId, startDate, endDate } = req.query;
      
      const filter: any = {};
      if (productId) filter.productId = productId;
      if (inspectorId) filter.inspectorId = inspectorId;
      if (startDate || endDate) {
        filter.date = {};
        if (startDate) filter.date.$gte = new Date(startDate as string);
        if (endDate) filter.date.$lte = new Date(endDate as string);
      }
      
      const records = await foodControlService.getOrganolepticRecords(filter);
      res.json({ success: true, data: records });
    } catch (error) {
      next(error);
    }
  }

  // Получение органолептической записи по ID
  async getOrganolepticRecordById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const record = await foodControlService.getOrganolepticRecordById(id);
      
      if (!record) {
        return res.status(404).json({ success: false, message: 'Органолептическая запись не найдена' });
      }
      
      res.json({ success: true, data: record });
    } catch (error) {
      next(error);
    }
  }

  // Создание новой органолептической записи
  async createOrganolepticRecord(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const recordData = {
        ...req.body,
        inspectorId: user._id
      };
      
      const record = await foodControlService.createOrganolepticRecord(recordData);
      res.status(201).json({ success: true, data: record });
    } catch (error) {
      next(error);
    }
  }

  // Обновление органолептической записи
  async updateOrganolepticRecord(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updated = await foodControlService.updateOrganolepticRecord(id, req.body);
      
      if (!updated) {
        return res.status(404).json({ success: false, message: 'Органолептическая запись не найдена' });
      }
      
      res.json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  }

  // Удаление органолептической записи
  async deleteOrganolepticRecord(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const deleted = await foodControlService.deleteOrganolepticRecord(id);
      
      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Органолептическая запись не найдена' });
      }
      
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }

  // === Perishable Brak ===
  
  // Получение записей о браке скоропортящихся продуктов
  async getPerishableBrakRecords(req: Request, res: Response, next: NextFunction) {
    try {
      const { productId, responsiblePersonId, startDate, endDate } = req.query;
      
      const filter: any = {};
      if (productId) filter.productId = productId;
      if (responsiblePersonId) filter.responsiblePersonId = responsiblePersonId;
      if (startDate || endDate) {
        filter.date = {};
        if (startDate) filter.date.$gte = new Date(startDate as string);
        if (endDate) filter.date.$lte = new Date(endDate as string);
      }
      
      const records = await foodControlService.getPerishableBrakRecords(filter);
      res.json({ success: true, data: records });
    } catch (error) {
      next(error);
    }
  }

  // Получение записи о браке скоропортящихся продуктов по ID
  async getPerishableBrakRecordById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const record = await foodControlService.getPerishableBrakRecordById(id);
      
      if (!record) {
        return res.status(404).json({ success: false, message: 'Запись о браке скоропортящихся продуктов не найдена' });
      }
      
      res.json({ success: true, data: record });
    } catch (error) {
      next(error);
    }
  }

  // Создание новой записи о браке скоропортящихся продуктов
  async createPerishableBrakRecord(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const recordData = {
        ...req.body,
        responsiblePersonId: user._id
      };
      
      const record = await foodControlService.createPerishableBrakRecord(recordData);
      res.status(201).json({ success: true, data: record });
    } catch (error) {
      next(error);
    }
  }

  // Обновление записи о браке скоропортящихся продуктов
  async updatePerishableBrakRecord(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updated = await foodControlService.updatePerishableBrakRecord(id, req.body);
      
      if (!updated) {
        return res.status(404).json({ success: false, message: 'Запись о браке скоропортящихся продуктов не найдена' });
      }
      
      res.json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  }

  // Удаление записи о браке скоропортящихся продуктов
  async deletePerishableBrakRecord(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const deleted = await foodControlService.deletePerishableBrakRecord(id);
      
      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Запись о браке скоропортящихся продуктов не найдена' });
      }
      
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }

  // === Product Certificates ===
  
  // Получение сертификатов продуктов
  async getProductCertificates(req: Request, res: Response, next: NextFunction) {
    try {
      const { supplierId, startDate, endDate, productType } = req.query;
      
      const filter: any = {};
      if (supplierId) filter.supplierId = supplierId;
      if (productType) filter.productType = productType;
      if (startDate || endDate) {
        filter.issueDate = {};
        if (startDate) filter.issueDate.$gte = new Date(startDate as string);
        if (endDate) filter.issueDate.$lte = new Date(endDate as string);
      }
      
      const certificates = await foodControlService.getProductCertificates(filter);
      res.json({ success: true, data: certificates });
    } catch (error) {
      next(error);
    }
  }

  // Получение сертификата продукта по ID
  async getProductCertificateById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const certificate = await foodControlService.getProductCertificateById(id);
      
      if (!certificate) {
        return res.status(404).json({ success: false, message: 'Сертификат продукта не найден' });
      }
      
      res.json({ success: true, data: certificate });
    } catch (error) {
      next(error);
    }
  }

  // Создание нового сертификата продукта
  async createProductCertificate(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const certificateData = {
        ...req.body,
        supplierId: user._id
      };
      
      const certificate = await foodControlService.createProductCertificate(certificateData);
      res.status(201).json({ success: true, data: certificate });
    } catch (error) {
      next(error);
    }
  }

  // Обновление сертификата продукта
  async updateProductCertificate(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updated = await foodControlService.updateProductCertificate(id, req.body);
      
      if (!updated) {
        return res.status(404).json({ success: false, message: 'Сертификат продукта не найден' });
      }
      
      res.json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  }

  // Удаление сертификата продукта
  async deleteProductCertificate(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const deleted = await foodControlService.deleteProductCertificate(id);
      
      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Сертификат продукта не найден' });
      }
      
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }

  // === Statistics ===
  
  // Получение статистики по контролю питания
  async getFoodControlStatistics(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await foodControlService.getFoodControlStatistics();
      res.json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  }

  // === Search ===
  
  // Поиск записей по названию продукта
  async searchRecordsByName(req: Request, res: Response, next: NextFunction) {
    try {
      const { term } = req.query;
      if (!term) {
        return res.status(400).json({ success: false, message: 'Необходимо указать поисковый термин' });
      }
      
      // Поиск по нескольким сущностям
      const [detergentLogs, foodStockLogs, organolepticRecords, perishableBrakRecords, productCertificates] = await Promise.all([
        foodControlService.getDetergentLogs({ name: { $regex: term, $options: 'i' } }),
        foodControlService.getFoodStockLogs({ productName: { $regex: term, $options: 'i' } }),
        foodControlService.getOrganolepticRecords({ productName: { $regex: term, $options: 'i' } }),
        foodControlService.getPerishableBrakRecords({ productName: { $regex: term, $options: 'i' } }),
        foodControlService.getProductCertificates({ productName: { $regex: term, $options: 'i' } })
      ]);
      
      res.json({
        success: true,
        data: {
          detergentLogs,
          foodStockLogs,
          organolepticRecords,
          perishableBrakRecords,
          productCertificates
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

// Экземпляр контроллера для использования в маршрутах
export const foodController = new FoodControlController();