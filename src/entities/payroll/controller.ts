import { Request, Response } from 'express';
import { PayrollService } from './service';
import { AuthUser } from '../../middlewares/authMiddleware';

// Расширяем интерфейс Request для добавления свойства user
interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

const payrollService = new PayrollService();

export const getAllPayrolls = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { userId, period, status } = req.query;
    
    const payrolls = await payrollService.getAll({
      userId: userId as string,
      period: period as string,
      status: status as string
    });
    
    res.json(payrolls);
  } catch (err) {
    console.error('Error fetching payrolls:', err);
    res.status(500).json({ error: 'Ошибка получения зарплат' });
  }
};

export const getAllPayrollsByUsers = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { userId, period, status } = req.query;
    
    const payrolls = await payrollService.getAllWithUsers({
      userId: userId as string,
      period: period as string,
      status: status as string
    });
    
    res.json(payrolls);
  } catch (err) {
    console.error('Error fetching payrolls by users:', err);
    res.status(500).json({ error: 'Ошибка получения зарплат' });
  }
};

export const getPayrollById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const payroll = await payrollService.getById(req.params.id);
    res.json(payroll);
  } catch (err: any) {
    console.error('Error fetching payroll:', err);
    res.status(404).json({ error: err.message || 'Зарплата не найдена' });
  }
};

export const createPayroll = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const payroll = await payrollService.create(req.body);
    res.status(201).json(payroll);
  } catch (err: any) {
    console.error('Error creating payroll:', err);
    res.status(400).json({ error: err.message || 'Ошибка создания зарплаты' });
  }
};

export const updatePayroll = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const payroll = await payrollService.update(req.params.id, req.body);
    res.json(payroll);
  } catch (err: any) {
    console.error('Error updating payroll:', err);
    res.status(404).json({ error: err.message || 'Ошибка обновления зарплаты' });
  }
};

export const deletePayroll = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const result = await payrollService.delete(req.params.id);
    res.json(result);
  } catch (err: any) {
    console.error('Error deleting payroll:', err);
    res.status(404).json({ error: err.message || 'Ошибка удаления зарплаты' });
  }
};

export const approvePayroll = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const payroll = await payrollService.approve(req.params.id);
    res.json(payroll);
  } catch (err: any) {
    console.error('Error approving payroll:', err);
    res.status(404).json({ error: err.message || 'Ошибка подтверждения зарплаты' });
  }
};

export const markPayrollAsPaid = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const payroll = await payrollService.markAsPaid(req.params.id);
    res.json(payroll);
  } catch (err: any) {
    console.error('Error marking payroll as paid:', err);
    res.status(404).json({ error: err.message || 'Ошибка отметки зарплаты как оплаченной' });
  }
};