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

export const create = async (req: Request, res: Response): Promise<void> => {
  try {
    const payment = await createChildPayment(req.body);
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
    const payment = await updateChildPayment(req.params.id, req.body);
    if (!payment) {
      res.status(404).json({ error: 'Child payment not found' });
      return;
    }
    res.json(payment);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const success = await deleteChildPayment(req.params.id);
    if (!success) {
      res.status(404).json({ error: 'Child payment not found' });
      return;
    }
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