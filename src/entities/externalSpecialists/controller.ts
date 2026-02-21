
import { Request, Response } from 'express';
import { ExternalSpecialistService } from './service';
import { AuthUser } from '../../middlewares/authMiddleware';
import { logAction } from '../../utils/auditLogger';

interface AuthenticatedRequest extends Request {
    user?: AuthUser;
}

const service = new ExternalSpecialistService();

export const getAll = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { active } = req.query;
        const items = await service.getAll(active === 'true');
        res.json(items);
    } catch (error) {
        res.status(500).json({ error: 'Ошибка получения списка специалистов' });
    }
};

export const create = async (req: AuthenticatedRequest, res: Response) => {
    try {
        if (req.user?.role !== 'admin') {
            return res.status(403).json({ error: 'Доступ запрещен' });
        }
        const item = await service.create(req.body);

        logAction({
            userId: req.user!.id,
            userFullName: req.user!.fullName,
            userRole: req.user!.role,
            action: 'create',
            entityType: 'externalSpecialist',
            entityId: item._id.toString(),
            entityName: item.fullName || item.name || ''
        });

        res.status(201).json(item);
    } catch (error) {
        res.status(400).json({ error: 'Ошибка создания специалиста' });
    }
};

export const update = async (req: AuthenticatedRequest, res: Response) => {
    try {
        if (req.user?.role !== 'admin') {
            return res.status(403).json({ error: 'Доступ запрещен' });
        }
        const item = await service.update(req.params.id, req.body);
        if (!item) return res.status(404).json({ error: 'Специалист не найден' });

        logAction({
            userId: req.user!.id,
            userFullName: req.user!.fullName,
            userRole: req.user!.role,
            action: 'update',
            entityType: 'externalSpecialist',
            entityId: req.params.id,
            entityName: item?.fullName || item?.name || ''
        });

        res.json(item);
    } catch (error) {
        res.status(400).json({ error: 'Ошибка обновления специалиста' });
    }
};

export const remove = async (req: AuthenticatedRequest, res: Response) => {
    try {
        if (req.user?.role !== 'admin') {
            return res.status(403).json({ error: 'Доступ запрещен' });
        }
        await service.delete(req.params.id);

        logAction({
            userId: req.user!.id,
            userFullName: req.user!.fullName,
            userRole: req.user!.role,
            action: 'delete',
            entityType: 'externalSpecialist',
            entityId: req.params.id,
            entityName: ''
        });

        res.json({ message: 'Специалист удален' });
    } catch (error) {
        res.status(400).json({ error: 'Ошибка удаления специалиста' });
    }
};
