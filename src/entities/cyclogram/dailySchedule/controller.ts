import { Request, Response } from 'express';
import { DailyScheduleService } from './service';
import { logAction } from '../../../utils/auditLogger';

const service = new DailyScheduleService();

export const dailyScheduleController = {
    async getAll(req: Request, res: Response) {
        try {
            const { groupId, date, weekNumber, isTemplate } = req.query;
            const schedules = await service.getAll({
                groupId: groupId as string,
                date: date as string,
                weekNumber: weekNumber ? parseInt(weekNumber as string) : undefined,
                isTemplate: isTemplate === 'true' ? true : isTemplate === 'false' ? false : undefined
            });
            res.json(schedules);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    },

    async getById(req: Request, res: Response) {
        try {
            const schedule = await service.getById(req.params.id);
            res.json(schedule);
        } catch (error: any) {
            res.status(404).json({ error: error.message });
        }
    },

    async getByGroupAndDate(req: Request, res: Response) {
        try {
            const { groupId, date } = req.query;
            const schedule = await service.getByGroupAndDate(groupId as string, date as string);
            res.json(schedule);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    },

    async getWeekSchedule(req: Request, res: Response) {
        try {
            const { groupId, startDate } = req.query;
            const schedules = await service.getWeekSchedule(groupId as string, startDate as string);
            res.json(schedules);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    },

    async create(req: Request, res: Response) {
        try {
            const userId = (req as any).user?.id || (req as any).user?._id;
            const userFullName = (req as any).user?.fullName || 'Система';
            const userRole = (req as any).user?.role || 'system';
            const schedule = await service.create(req.body, userId);

            logAction({
                userId: userId || 'system',
                userFullName,
                userRole,
                action: 'create',
                entityType: 'dailySchedule',
                entityId: schedule._id.toString(),
                entityName: `Расписание для группы ${schedule.groupId}`
            });

            res.status(201).json(schedule);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    },

    async update(req: Request, res: Response) {
        try {
            const userId = (req as any).user?.id || (req as any).user?._id;
            const userFullName = (req as any).user?.fullName || 'Система';
            const userRole = (req as any).user?.role || 'system';
            const schedule = await service.update(req.params.id, req.body);

            logAction({
                userId: userId || 'system',
                userFullName,
                userRole,
                action: 'update',
                entityType: 'dailySchedule',
                entityId: req.params.id,
                entityName: schedule ? `Расписание ${schedule._id}` : ''
            });

            res.json(schedule);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    },

    async updateBlocks(req: Request, res: Response) {
        try {
            const schedule = await service.updateBlocks(req.params.id, req.body.blocks);
            res.json(schedule);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    },

    async delete(req: Request, res: Response) {
        try {
            const userId = (req as any).user?.id || (req as any).user?._id;
            const userFullName = (req as any).user?.fullName || 'Система';
            const userRole = (req as any).user?.role || 'system';
            const result = await service.delete(req.params.id);

            logAction({
                userId: userId || 'system',
                userFullName,
                userRole,
                action: 'delete',
                entityType: 'dailySchedule',
                entityId: req.params.id,
                entityName: ''
            });

            res.json(result);
        } catch (error: any) {
            res.status(404).json({ error: error.message });
        }
    },

    async copyFromPreviousWeek(req: Request, res: Response) {
        try {
            const { groupId, targetDate } = req.body;
            const schedules = await service.copyFromPreviousWeek(groupId, targetDate);
            res.json(schedules);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    },

    async getTemplates(req: Request, res: Response) {
        try {
            const templates = await service.getTemplates();
            res.json(templates);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }
};
