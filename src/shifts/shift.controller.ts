import { Request, Response, NextFunction } from 'express';
import { shiftService } from './shift.service';

export class ShiftController {
  // Получение списка смен
  async getShifts(req: Request, res: Response, next: NextFunction) {
    try {
      const { staffId, date, status } = req.query;
      
      const filter: any = {};
      if (staffId) filter.staffId = staffId;
      if (date) filter.date = new Date(date as string);
      if (status) filter.status = status;
      
      const shifts = await shiftService.getShifts(filter);
      res.json({ success: true, data: shifts });
    } catch (error) {
      next(error);
    }
  }

  // Получение смены по ID
  async getShiftById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const shift = await shiftService.getShiftById(id);
      
      if (!shift) {
        return res.status(404).json({ success: false, message: 'Смена не найдена' });
      }
      
      res.json({ success: true, data: shift });
    } catch (error) {
      next(error);
    }
  }

  // Создание новой смены
  async createShift(req: Request, res: Response, next: NextFunction) {
    try {
      const shift = await shiftService.createShift(req.body);
      res.status(201).json({ success: true, data: shift });
    } catch (error) {
      next(error);
    }
  }

  // Обновление смены
  async updateShift(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updated = await shiftService.updateShift(id, req.body);
      
      if (!updated) {
        return res.status(404).json({ success: false, message: 'Смена не найдена' });
      }
      
      res.json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  }

  // Удаление смены
  async deleteShift(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const deleted = await shiftService.deleteShift(id);
      
      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Смена не найдена' });
      }
      
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }

  // Получение смен сотрудника
  async getShiftsByStaffId(req: Request, res: Response, next: NextFunction) {
    try {
      const { staffId } = req.params;
      const shifts = await shiftService.getShiftsByStaffId(staffId);
      res.json({ success: true, data: shifts });
    } catch (error) {
      next(error);
    }
  }
async getShiftsByDateRange(req: Request, res: Response, next: NextFunction) {
    try {
      const { startDate, endDate } = req.query;
      if (!startDate || !endDate) {
        return res.status(400).json({ success: false, message: 'Необходимо указать startDate и endDate' });
      }
      
      const shifts = await shiftService.getShiftsByDateRange(new Date(startDate as string), new Date(endDate as string));
      res.json({ success: true, data: shifts });
    } catch (error) {
      next(error);
    }
  }
  async getShiftStatistics(req: Request, res: Response, next: NextFunction) {
    try {
 
    
      
      const stats = await shiftService.getShiftStatistics();
      res.json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
}
 async searchShiftsByName(req: Request, res: Response, next: NextFunction) {
    try {
      const { term } = req.query;
      if (!term) {
        return res.status(400).json({ success: false, message: 'Необходимо указать поисковый термин' });
      }
      
      const shifts = await shiftService.searchShiftsByName(term as string);
      res.json({ success: true, data: shifts });
    } catch (error) {
      next(error);
    }
}
}
// Экземпляр контроллера для использования в маршрутах
export const shiftController = new ShiftController();