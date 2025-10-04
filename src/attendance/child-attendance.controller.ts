import { Request, Response, NextFunction } from 'express';
import { childAttendanceService } from './child-attendance.service';

export class ChildAttendanceController {
  // Получение списка записей посещаемости
  async getChildAttendances(req: Request, res: Response, next: NextFunction) {
    try {
      const { childId, groupId, startDate, endDate, status } = req.query;
      
      const filter: any = {};
      if (childId) filter.childId = childId;
      if (status) filter.status = status;
      
      // Фильтр по дате
      if (startDate || endDate) {
        filter.date = {};
        if (startDate) filter.date.$gte = new Date(startDate as string);
        if (endDate) filter.date.$lte = new Date(endDate as string);
      }
      
      const attendances = await childAttendanceService.getChildAttendances(filter);
      res.json({ success: true, data: attendances });
    } catch (error) {
      next(error);
    }
  }

  // Получение записи посещаемости по ID
  async getChildAttendanceById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const attendance = await childAttendanceService.getChildAttendanceById(id);
      
      if (!attendance) {
        return res.status(404).json({ success: false, message: 'Запись посещаемости не найдена' });
      }
      
      res.json({ success: true, data: attendance });
    } catch (error) {
      next(error);
    }
  }

  // Создание новой записи посещаемости
  async createChildAttendance(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user;
      
      if (!user) {
        return res.status(401).json({ success: false, message: 'Пользователь не авторизован' });
      }
      
      const attendanceData = {
        ...req.body,
        recordedBy: user._id
      };
      
      const attendance = await childAttendanceService.createChildAttendance(attendanceData);
      res.status(201).json({ success: true, data: attendance });
    } catch (error) {
      next(error);
    }
  }

  // Обновление записи посещаемости
  async updateChildAttendance(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updated = await childAttendanceService.updateChildAttendance(id, req.body);
      
      if (!updated) {
        return res.status(404).json({ success: false, message: 'Запись посещаемости не найдена' });
      }
      
      res.json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  }

  // Удаление записи посещаемости
  async deleteChildAttendance(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const deleted = await childAttendanceService.deleteChildAttendance(id);
      
      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Запись посещаемости не найдена' });
      }
      
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }

  // Получение посещаемости по ребенку
  async getChildAttendancesByChildId(req: Request, res: Response, next: NextFunction) {
    try {
      const { childId } = req.params;
      const attendances = await childAttendanceService.getChildAttendancesByChildId(childId);
      res.json({ success: true, data: attendances });
    } catch (error) {
      next(error);
    }
  }

  // Получение посещаемости по группе
  async getChildAttendancesByGroupId(req: Request, res: Response, next: NextFunction) {
    try {
      const { groupId } = req.params;
      const attendances = await childAttendanceService.getChildAttendancesByGroupId(groupId);
      res.json({ success: true, data: attendances });
    } catch (error) {
      next(error);
    }
  }

  // Получение посещаемости за период
  async getChildAttendancesByDateRange(req: Request, res: Response, next: NextFunction) {
    try {
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ success: false, message: 'Необходимо указать startDate и endDate' });
      }
      
      const attendances = await childAttendanceService.getChildAttendancesByDateRange(
        new Date(startDate as string),
        new Date(endDate as string)
      );
      res.json({ success: true, data: attendances });
    } catch (error) {
      next(error);
    }
  }

  // Получение сводки посещаемости
  async getAttendanceSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const { startDate, endDate, groupId } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ success: false, message: 'Необходимо указать startDate и endDate' });
      }
      
      const summary = await childAttendanceService.getAttendanceSummary(
        new Date(startDate as string),
        new Date(endDate as string),
        groupId as string
      );
      res.json({ success: true, data: summary });
    } catch (error) {
      next(error);
    }
  }
}

// Экземпляр контроллера для использования в маршрутах
export const childAttendanceController = new ChildAttendanceController();