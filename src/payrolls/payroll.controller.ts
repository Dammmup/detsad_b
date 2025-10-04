import { Request, Response, NextFunction } from 'express';
import { payrollService } from './payroll.service';

export class PayrollController {
  // Получение списка расчетных листов
  async getPayrolls(req: Request, res: Response, next: NextFunction) {
    try {
      const { staffId, month } = req.query;
      const user = req.user;
      
      if (!user) {
        return res.status(401).json({ success: false, message: 'Пользователь не авторизован' });
      }
      
      // Фильтр по умолчанию
      const filter: any = {};
      
      // Если пользователь не администратор, он может видеть только свои данные
      if (user.role !== 'admin') {
        filter.staffId = user._id;
      } else {
        // Администратор может фильтровать по staffId
        if (staffId) filter.staffId = staffId;
      }
      
      // Фильтр по месяцу
      if (month) filter.month = month;
      
      const data = await payrollService.getPayrolls(filter);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  // Получение расчетного листа по ID
  async getPayrollById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const user = req.user;
      
      if (!user) {
        return res.status(401).json({ success: false, message: 'Пользователь не авторизован' });
      }
      
      const payroll = await payrollService.getPayrollById(id);
      
      if (!payroll) {
        return res.status(404).json({ success: false, message: 'Расчетный лист не найден' });
      }
      
      // Проверяем, что пользователь запрашивает свои данные или является администратором
      if (user.role !== 'admin' && payroll.staffId.toString() !== user._id.toString()) {
        return res.status(403).json({ success: false, message: 'Нет доступа к этим данным' });
      }
      
      res.json({ success: true, data: payroll });
    } catch (error) {
      next(error);
    }
  }

  // Создание нового расчетного листа
  async createPayroll(req: Request, res: Response, next: NextFunction) {
    try {
      const payroll = await payrollService.createPayroll(req.body);
      res.status(201).json({ success: true, data: payroll });
    } catch (error) {
      next(error);
    }
  }

  // Обновление расчетного листа
  async updatePayroll(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updated = await payrollService.updatePayroll(id, req.body);
      res.json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  }

  // Удаление расчетного листа
  async deletePayroll(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const deleted = await payrollService.deletePayroll(id);
      
      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Расчетный лист не найден' });
      }
      
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }

  // Ручной расчет зарплаты
  async calculateManualPayroll(req: Request, res: Response, next: NextFunction) {
    try {
      const { staffId, month } = req.body;
      const payroll = await payrollService.calculateManualPayroll(staffId, month);
      res.json({ success: true, data: payroll });
    } catch (error) {
      next(error);
    }
  }
}

// Экземпляр контроллера для использования в маршрутах
export const payrollController = new PayrollController();