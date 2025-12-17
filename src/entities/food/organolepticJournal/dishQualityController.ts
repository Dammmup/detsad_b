import { Request, Response } from 'express';
import { DishQualityService } from './dishQualityService';

const dishQualityService = new DishQualityService();

export const getAllDishQualityRecords = async (req: Request, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const { date, group } = req.query;

        const records = await dishQualityService.getAll({
            date: date as string,
            group: group as string
        });

        res.json(records);
    } catch (err) {
        console.error('Error fetching dish quality records:', err);
        res.status(500).json({ error: 'Ошибка получения записей оценки блюд' });
    }
};

export const getDishQualityRecordById = async (req: Request, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const record = await dishQualityService.getById(req.params.id);
        res.json(record);
    } catch (err: any) {
        console.error('Error fetching dish quality record:', err);
        res.status(404).json({ error: err.message || 'Запись оценки блюда не найдена' });
    }
};

export const createDishQualityRecord = async (req: Request, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const record = await dishQualityService.create(req.body, req.user.id as string);
        res.status(201).json(record);
    } catch (err: any) {
        console.error('Error creating dish quality record:', err);
        res.status(400).json({ error: err.message || 'Ошибка создания записи оценки блюда' });
    }
};

export const updateDishQualityRecord = async (req: Request, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const record = await dishQualityService.update(req.params.id, req.body);
        res.json(record);
    } catch (err: any) {
        console.error('Error updating dish quality record:', err);
        res.status(404).json({ error: err.message || 'Ошибка обновления записи оценки блюда' });
    }
};

export const deleteDishQualityRecord = async (req: Request, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const result = await dishQualityService.delete(req.params.id);
        res.json(result);
    } catch (err: any) {
        console.error('Error deleting dish quality record:', err);
        res.status(404).json({ error: err.message || 'Ошибка удаления записи оценки блюда' });
    }
};

export const deleteAllDishQualityRecords = async (req: Request, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const result = await dishQualityService.deleteAll();
        res.json(result);
    } catch (err: any) {
        console.error('Error deleting all dish quality records:', err);
        res.status(500).json({ error: err.message || 'Ошибка удаления записей оценки блюд' });
    }
};

export const generateDishQualityByMenu = async (req: Request, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const { date, group } = req.body;

        if (!date) {
            return res.status(400).json({ error: 'Не указана дата' });
        }

        const records = await dishQualityService.generateByMenu(
            date,
            group || 'all',
            req.user.id as string
        );

        res.status(201).json(records);
    } catch (err: any) {
        console.error('Error generating dish quality records by menu:', err);
        res.status(500).json({ error: err.message || 'Ошибка генерации записей из меню' });
    }
};
