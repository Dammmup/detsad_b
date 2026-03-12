import { Request, Response } from 'express';
import {
  createChildPayment,
  getChildPayments,
  getChildPaymentById,
  updateChildPayment,
  deleteChildPayment,
  getChildPaymentByPeriod
} from './service';
import { generateMonthlyChildPayments } from '../../services/childPaymentGenerator';
import { logAction, computeChanges } from '../../utils/auditLogger';
import { sendLogToTelegram } from '../../utils/telegramLogger';

export const create = async (req: Request, res: Response): Promise<void> => {
  try {
    const payment = await createChildPayment(req.body);
    const createdPayment = await getChildPaymentById(payment._id.toString());
    const childNameCreate = (createdPayment?.childId as any)?.fullName || '';
    logAction({
      userId: req.user?.id || 'system',
      userFullName: req.user?.fullName || 'Система',
      userRole: req.user?.role || 'system',
      action: 'create',
      entityType: 'childPayment',
      entityId: payment._id.toString(),
      entityName: childNameCreate ? `${childNameCreate} | ${payment.monthPeriod || ''}` : (payment.monthPeriod || '')
    });
    res.status(201).json(payment);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const generate = async (req: Request, res: Response): Promise<void> => {
  try {
    const { date } = req.body;
    if (!date) {
      res.status(400).json({ error: 'Date is required' });
      return;
    }
    await generateMonthlyChildPayments(new Date(date));
    logAction({
      userId: req.user?.id || 'system',
      userFullName: req.user?.fullName || 'Система',
      userRole: req.user?.role || 'system',
      action: 'generate',
      entityType: 'childPayment',
      entityId: date,
      entityName: `Генерация платежей`,
      details: `Генерация платежей за ${date}`
    });
    res.status(200).json({ message: 'Payment generation started successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getAll = async (req: Request, res: Response): Promise<void> => {
  try {
    const filters = req.query;
    const payments = await getChildPayments(filters);
    res.json(payments);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getById = async (req: Request, res: Response): Promise<void> => {
  try {
    const payment = await getChildPaymentById(req.params.id);
    if (!payment) {
      res.status(404).json({ error: 'Child payment not found' });
      return;
    }
    res.json(payment);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const update = async (req: Request, res: Response): Promise<void> => {
  try {
    const oldPayment = await getChildPaymentById(req.params.id);
    const payment = await updateChildPayment(req.params.id, req.body);
    if (!payment) {
      res.status(404).json({ error: 'Child payment not found' });
      return;
    }
    if (oldPayment) {
      const changes = computeChanges(
        oldPayment.toObject ? oldPayment.toObject() : oldPayment as any,
        req.body,
        ['amount', 'status', 'total', 'comments', 'discount']
      );
      const childNameUpdate = (payment?.childId as any)?.fullName || '';
      logAction({
        userId: req.user?.id || 'system',
        userFullName: req.user?.fullName || 'Система',
        userRole: req.user?.role || 'system',
        action: 'update',
        entityType: 'childPayment',
        entityId: req.params.id,
        entityName: childNameUpdate ? `${childNameUpdate} | ${(payment as any).monthPeriod || ''}` : ((payment as any).monthPeriod || ''),
        changes
      });

      // Telegram-уведомление при смене статуса оплаты
      const oldStatus = (oldPayment as any).status;
      const newStatus = req.body.status;
      const operatorName = req.user?.fullName || 'Неизвестный';
      const monthPeriod = (payment as any).monthPeriod || '';

      if (newStatus === 'paid' && oldStatus !== 'paid') {
        const totalAmount = (payment as any).total || (payment as any).amount || 0;
        const accruals = (payment as any).accruals || 0;
        const fullAmount = totalAmount + accruals;
        sendLogToTelegram(
          `💰 <b>Оплата за посещение</b>\n` +
          `Ребёнок: <b>${childNameUpdate}</b>\n` +
          `Период: ${monthPeriod}\n` +
          `Сумма: ${fullAmount.toLocaleString('ru-RU')} ₸\n` +
          `Оператор: ${operatorName}`
        );
      } else if (oldStatus === 'paid' && newStatus === 'active') {
        sendLogToTelegram(
          `❌ <b>Отмена оплаты за посещение</b>\n` +
          `Ребёнок: <b>${childNameUpdate}</b>\n` +
          `Период: ${monthPeriod}\n` +
          `Оператор: ${operatorName}`
        );
      }
    }
    res.json(payment);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const oldPayment = await getChildPaymentById(req.params.id);
    const success = await deleteChildPayment(req.params.id);
    if (!success) {
      res.status(404).json({ error: 'Child payment not found' });
      return;
    }
    const childNameDelete = (oldPayment?.childId as any)?.fullName || '';
    logAction({
      userId: req.user?.id || 'system',
      userFullName: req.user?.fullName || 'Система',
      userRole: req.user?.role || 'system',
      action: 'delete',
      entityType: 'childPayment',
      entityId: req.params.id,
      entityName: childNameDelete ? `${childNameDelete} | ${(oldPayment as any)?.monthPeriod || ''}` : ((oldPayment as any)?.monthPeriod || '')
    });
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getByPeriod = async (req: Request, res: Response): Promise<void> => {
  try {
    const { childId, userId, start, end } = req.query;

    if (!start || !end) {
      res.status(400).json({ error: 'start and end query parameters are required' });
      return;
    }

    const periodObj = { start: start as string, end: end as string };

    const payment = await getChildPaymentByPeriod(
      periodObj,
      childId as string,
      userId as string
    );
    if (!payment) {
      res.status(404).json({ error: 'Child payment not found' });
      return;
    }
    res.json(payment);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};