import { Request, Response, NextFunction } from 'express';
import { foodStaffDailyLogService } from './service';

export class FoodStaffDailyLogController {
    async getAll(req: Request, res: Response, next: NextFunction) {
        try {
            const { staffId, startDate, endDate } = req.query;
            const logs = await foodStaffDailyLogService.getAll({
                staffId: staffId as string,
                startDate: startDate as string,
                endDate: endDate as string
            });
            res.json(logs);
        } catch (error) {
            next(error);
        }
    }

    async create(req: Request, res: Response, next: NextFunction) {
        try {
            const logData = {
                ...req.body,
                doctor: req.user?.id // Ответственное лицо - текущий пользователь
            };
            const log = await foodStaffDailyLogService.create(logData);
            res.status(201).json(log);
        } catch (error) {
            next(error);
        }
    }

    async update(req: Request, res: Response, next: NextFunction) {
        try {
            const log = await foodStaffDailyLogService.update(req.params.id, req.body);
            res.json(log);
        } catch (error) {
            next(error);
        }
    }

    async delete(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await foodStaffDailyLogService.delete(req.params.id);
            res.json(result);
        } catch (error) {
            next(error);
        }
    }
}

export const foodStaffDailyLogController = new FoodStaffDailyLogController();
