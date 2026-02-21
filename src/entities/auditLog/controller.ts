import { Request, Response } from 'express';
import { AuditLogService } from './service';

const auditLogService = new AuditLogService();

export const getAll = async (req: Request, res: Response) => {
  try {
    const { entityType, userId, action, startDate, endDate, page, limit } = req.query;
    const result = await auditLogService.getAll({
      entityType: entityType as string,
      userId: userId as string,
      action: action as string,
      startDate: startDate as string,
      endDate: endDate as string,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined
    });
    res.json(result);
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ error: 'Ошибка при получении логов' });
  }
};

export const getByEntityType = async (req: Request, res: Response) => {
  try {
    const { entityType } = req.params;
    const { userId, action, startDate, endDate, page, limit } = req.query;
    const result = await auditLogService.getByEntityType(entityType, {
      userId: userId as string,
      action: action as string,
      startDate: startDate as string,
      endDate: endDate as string,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined
    });
    res.json(result);
  } catch (error) {
    console.error('Error fetching audit logs by entity type:', error);
    res.status(500).json({ error: 'Ошибка при получении логов' });
  }
};

export const getByEntity = async (req: Request, res: Response) => {
  try {
    const { entityType, entityId } = req.params;
    const { userId, action, startDate, endDate, page, limit } = req.query;
    const result = await auditLogService.getByEntity(entityType, entityId, {
      userId: userId as string,
      action: action as string,
      startDate: startDate as string,
      endDate: endDate as string,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined
    });
    res.json(result);
  } catch (error) {
    console.error('Error fetching audit logs by entity:', error);
    res.status(500).json({ error: 'Ошибка при получении логов' });
  }
};
