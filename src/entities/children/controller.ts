import { Request, Response } from 'express';
import { ChildService } from './service';
import { AuthenticatedRequest } from '../../types/express';
import { getChildPayments, createChildPayment } from '../childPayment/service';
import mongoose from 'mongoose';
import { logAction, computeChanges } from '../../utils/auditLogger';

const childService = new ChildService();
const DEFAULT_PAYMENT_AMOUNT = 40000;

export const getAllChildren = async (req: Request, res: Response) => {
  try {
    const children = await childService.getAll();
    res.json(children);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при получении списка детей' });
  }
};

export const getChildById = async (req: Request, res: Response) => {
  try {
    const child = await childService.getById(req.params.id);
    if (!child) return res.status(404).json({ error: 'Ребенок не найден' });
    res.json(child);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при получении данных ребенка' });
  }
};

export const getChildrenByGroupId = async (req: Request, res: Response) => {
  try {
    const children = await childService.getByGroupId(req.params.groupId);
    res.json(children);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при получении детей по группе' });
  }
};

export const createChild = async (req: Request, res: Response) => {
  try {
    const child = await childService.create(req.body);
    logAction({
      userId: req.user?.id || 'system',
      userFullName: req.user?.fullName || 'Система',
      userRole: req.user?.role || 'system',
      action: 'create',
      entityType: 'child',
      entityId: child._id.toString(),
      entityName: child.fullName || ''
    });
    res.status(201).json(child);
  } catch (error) {
    res.status(400).json({ error: 'Ошибка при создании ребенка', details: error });
  }
};

export const updateChild = async (req: Request, res: Response) => {
  try {
    const oldChild = await childService.getById(req.params.id);
    const child = await childService.update(req.params.id, req.body);
    if (!child) return res.status(404).json({ error: 'Ребенок не найден' });
    if (oldChild) {
      const changes = computeChanges(
        oldChild.toObject ? oldChild.toObject() : oldChild,
        req.body,
        ['fullName', 'groupId', 'active', 'birthday', 'parentName', 'parentPhone', 'paymentAmount', 'notes']
      );
      logAction({
        userId: req.user?.id || 'system',
        userFullName: req.user?.fullName || 'Система',
        userRole: req.user?.role || 'system',
        action: 'update',
        entityType: 'child',
        entityId: req.params.id,
        entityName: child.fullName || oldChild.fullName || '',
        changes
      });
    }
    res.json(child);
  } catch (error) {
    res.status(400).json({ error: 'Ошибка при обновлении данных ребенка', details: error });
  }
};

export const deleteChild = async (req: Request, res: Response) => {
  try {
    const oldChild = await childService.getById(req.params.id);
    const result = await childService.delete(req.params.id);
    if (!result) return res.status(404).json({ error: 'Ребенок не найден' });
    logAction({
      userId: req.user?.id || 'system',
      userFullName: req.user?.fullName || 'Система',
      userRole: req.user?.role || 'system',
      action: 'delete',
      entityType: 'child',
      entityId: req.params.id,
      entityName: oldChild?.fullName || ''
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при удалении ребенка' });
  }
};

/**
 * Генерация недостающих платежей для детей
 * POST /children/generate-payments
 * Body: { date?: string } - опциональная дата для генерации за определенный месяц
 */
export const generateMissingPayments = async (req: Request, res: Response) => {
  try {
    const { date } = req.body;
    const now = date ? new Date(date) : new Date();

    const almatyDateStr = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Almaty' });
    const [year, month] = almatyDateStr.split('-').map(Number);

    const targetYear = year;
    const targetMonth = month - 1; // 0-indexed

    // Начало и конец месяца по Астане
    const currentMonthStart = new Date(Date.UTC(targetYear, targetMonth, 1, 0, 0, 0));
    currentMonthStart.setUTCHours(currentMonthStart.getUTCHours() - 5);

    const currentMonthEnd = new Date(Date.UTC(targetYear, targetMonth + 1, 1, 0, 0, 0));
    currentMonthEnd.setUTCMilliseconds(-1);
    currentMonthEnd.setUTCHours(currentMonthEnd.getUTCHours() - 5);

    const monthPeriod = `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}`;

    // Получаем всех активных детей
    const allChildren = await childService.getAll();
    const activeChildren = allChildren.filter(c => c.active !== false);

    let createdCount = 0;
    let skippedCount = 0;
    const errors: string[] = [];

    for (const child of activeChildren) {
      try {
        // Проверяем есть ли уже платеж за этот месяц
        const existingPayments = await getChildPayments({
          childId: child._id.toString(),
          monthPeriod,
        });

        if (existingPayments.length > 0) {
          skippedCount++;
          continue;
        }

        // Создаем платеж
        const amount = child.paymentAmount || DEFAULT_PAYMENT_AMOUNT;

        await createChildPayment({
          childId: child._id as mongoose.Types.ObjectId,
          period: {
            start: currentMonthStart,
            end: currentMonthEnd,
          },
          monthPeriod,
          amount,
          total: amount,
          status: 'active',
          comments: 'Сгенерировано вручную',
        });

        createdCount++;
      } catch (error) {
        errors.push(`${child.fullName}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    logAction({
      userId: req.user?.id || 'system',
      userFullName: req.user?.fullName || 'Система',
      userRole: req.user?.role || 'system',
      action: 'generate',
      entityType: 'childPayment',
      entityId: monthPeriod,
      entityName: `Генерация за ${monthPeriod}`,
      details: `Создано: ${createdCount}, пропущено: ${skippedCount}, ошибок: ${errors.length}`
    });
    res.json({
      success: true,
      message: `Генерация завершена за ${monthPeriod}`,
      stats: {
        created: createdCount,
        skipped: skippedCount,
        errors: errors.length,
      },
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Ошибка при генерации платежей',
      details: error instanceof Error ? error.message : String(error),
    });
  }
};