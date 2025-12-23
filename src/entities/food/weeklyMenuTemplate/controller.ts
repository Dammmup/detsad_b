import { Request, Response, NextFunction } from 'express';
import { weeklyMenuTemplateService } from './service';
import { Weekday, WEEKDAYS } from './model';

export class WeeklyMenuTemplateController {
    async getAll(req: Request, res: Response, next: NextFunction) {
        try {
            const { isActive } = req.query;
            const filters: any = {};
            if (isActive !== undefined) filters.isActive = isActive === 'true';

            const templates = await weeklyMenuTemplateService.getAll(filters);
            res.json(templates);
        } catch (error) {
            next(error);
        }
    }

    async getById(req: Request, res: Response, next: NextFunction) {
        try {
            const template = await weeklyMenuTemplateService.getByIdWithDishes(req.params.id);
            res.json(template);
        } catch (error) {
            next(error);
        }
    }

    async create(req: Request, res: Response, next: NextFunction) {
        try {
            const template = await weeklyMenuTemplateService.create({
                ...req.body,
                createdBy: (req as any).user?.id
            });
            res.status(201).json(template);
        } catch (error) {
            next(error);
        }
    }

    async update(req: Request, res: Response, next: NextFunction) {
        try {
            const template = await weeklyMenuTemplateService.update(req.params.id, req.body);
            res.json(template);
        } catch (error) {
            next(error);
        }
    }

    async delete(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await weeklyMenuTemplateService.delete(req.params.id);
            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    async addDishToDay(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const { day, mealType, dishId } = req.body;

            if (!WEEKDAYS.includes(day as Weekday)) {
                return res.status(400).json({ message: 'Некорректный день недели' });
            }

            const template = await weeklyMenuTemplateService.addDishToDay(id, day, mealType, dishId);
            res.json(template);
        } catch (error) {
            next(error);
        }
    }

    async removeDishFromDay(req: Request, res: Response, next: NextFunction) {
        try {
            const { id, day, mealType, dishId } = req.params;

            if (!WEEKDAYS.includes(day as Weekday)) {
                return res.status(400).json({ message: 'Некорректный день недели' });
            }

            const template = await weeklyMenuTemplateService.removeDishFromDay(id, day as Weekday, mealType as any, dishId);
            res.json(template);
        } catch (error) {
            next(error);
        }
    }

    async applyToWeek(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const { startDate, childCount } = req.body;

            if (!startDate) {
                return res.status(400).json({ message: 'Дата начала обязательна' });
            }

            const result = await weeklyMenuTemplateService.applyToWeek(
                id,
                new Date(startDate),
                childCount || 30,
                (req as any).user?.id
            );
            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    async applyToMonth(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const { startDate, childCount } = req.body;

            if (!startDate) {
                return res.status(400).json({ message: 'Дата начала обязательна' });
            }

            const result = await weeklyMenuTemplateService.applyToMonth(
                id,
                new Date(startDate),
                childCount || 30,
                (req as any).user?.id
            );
            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    async calculateRequiredProducts(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const { days, childCount } = req.query;

            const result = await weeklyMenuTemplateService.calculateRequiredProducts(
                id,
                parseInt(days as string) || 7,
                parseInt(childCount as string) || 30
            );
            res.json(result);
        } catch (error) {
            next(error);
        }
    }
}

export const weeklyMenuTemplateController = new WeeklyMenuTemplateController();
