import { Request, Response } from 'express';
import { ActivityTemplateService } from './service';

const service = new ActivityTemplateService();

export const activityTemplateController = {
    async getAll(req: Request, res: Response) {
        try {
            const { type, ageGroup, isActive } = req.query;
            const templates = await service.getAll({
                type: type as any,
                ageGroup: ageGroup as string,
                isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined
            });
            res.json(templates);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    },

    async getById(req: Request, res: Response) {
        try {
            const template = await service.getById(req.params.id);
            res.json(template);
        } catch (error: any) {
            res.status(404).json({ error: error.message });
        }
    },

    async getByType(req: Request, res: Response) {
        try {
            const templates = await service.getByType(req.params.type as any);
            res.json(templates);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    },

    async create(req: Request, res: Response) {
        try {
            const template = await service.create(req.body);
            res.status(201).json(template);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    },

    async update(req: Request, res: Response) {
        try {
            const template = await service.update(req.params.id, req.body);
            res.json(template);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    },

    async delete(req: Request, res: Response) {
        try {
            const result = await service.delete(req.params.id);
            res.json(result);
        } catch (error: any) {
            res.status(404).json({ error: error.message });
        }
    },

    async getActivityTypes(req: Request, res: Response) {
        try {
            const types = await service.getActivityTypes();
            res.json(types);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }
};
