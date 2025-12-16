import { Request, Response } from 'express';
import { PayrollService } from './service';
import { AuthUser } from '../../middlewares/authMiddleware';
import { autoCalculatePayroll } from '../../services/payrollAutomationService';
import Payroll from './model';
import User from '../users/model';

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

    const { period, status, month } = req.query;
    const targetPeriod = (period as string) || (month as string) || new Date().toISOString().slice(0, 7);

    // Проверяем и создаем расчетные листы для текущего месяца, если они отсутствуют
    if (targetPeriod === new Date().toISOString().slice(0, 7)) {
      await payrollService.ensurePayrollRecordsForPeriod(targetPeriod);
    }

    // ИСПРАВЛЕНИЕ: Admin/manager видят все записи, остальные - только свои
    const staffIdFilter = (req.user.role === 'admin' || req.user.role === 'manager')
      ? undefined
      : req.user.id;

    const payrolls = await payrollService.getAll({
      staffId: staffIdFilter,
      period: targetPeriod,
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

    const { userId, period, status, month } = req.query;
    const targetPeriod = (period as string) || (month as string) || new Date().toISOString().slice(0, 7);

    // Проверяем и создаем расчетные листы для текущего месяца, если они отсутствуют
    if (targetPeriod === new Date().toISOString().slice(0, 7)) {
      await payrollService.ensurePayrollRecordsForPeriod(targetPeriod);
    }

    const payrolls = await payrollService.getAllWithUsers({
      staffId: userId as string,
      period: targetPeriod,
      status: status as string
    });

    res.json(payrolls);
  } catch (err) {
    console.error('Error fetching payrolls by users:', err);
    res.status(500).json({ error: 'Ошибка получения зарплат' });
  }
};

export const getMyPayrolls = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { period, month } = req.query;
    // Default to current month if not specified
    const targetPeriod = (period as string) || (month as string) || new Date().toISOString().slice(0, 7);



    // Always ensure records are up to date for the current/requested period
    // The service handles existing records by updating them if they are in 'draft' status
    console.log(`Ensuring payroll for user ${req.user.id} in period ${targetPeriod}...`);
    try {
      await payrollService.ensurePayrollForUser(req.user.id, targetPeriod);
    } catch (generationError) {
      console.error('Error generating/updating payroll on-demand:', generationError);
      // Continue without throwing
    }

    const payrolls = await payrollService.getAllWithUsers({
      staffId: req.user.id,
      period: targetPeriod
    });

    res.json(payrolls);
  } catch (err: any) {
    console.error('Error fetching my payrolls:', err);
    res.status(500).json({
      error: 'Ошибка получения данных о зарплате',
      details: err.message || 'Unknown error',
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};

export const getPayrollById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Admin может видеть любые записи, остальные - только свои
    const userId = req.user.role === 'admin' ? undefined : req.user.id;
    const payroll = await payrollService.getById(req.params.id, userId);
    res.json(payroll);
  } catch (err: any) {
    console.error('Error fetching payroll:', err);
    if (err.message === 'Forbidden: Payroll record does not belong to user') {
      console.log(`Access violation: User ${req.user.id} attempted to access payroll ${req.params.id}`);
      return res.status(403).json({ error: err.message });
    }
    res.status(404).json({ error: err.message || 'Зарплата не найдена' });
  }
};

export const createPayroll = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Проверка на отрицательные значения
    const { baseSalary, bonuses, deductions, advance } = req.body;
    if (baseSalary < 0 || bonuses < 0 || deductions < 0 || (advance !== undefined && advance < 0)) {
      return res.status(400).json({ error: 'Значения не могут быть отрицательными' });
    }

    // Ensure payroll is created for the authenticated user
    const payrollData = {
      ...req.body,
      staffId: req.user.id
    };

    const payroll = await payrollService.create(payrollData);
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

    // Проверка на отрицательные значения
    const { baseSalary, bonuses, deductions, advance } = req.body;
    if ((baseSalary !== undefined && baseSalary < 0) ||
      (bonuses !== undefined && bonuses < 0) ||
      (deductions !== undefined && deductions < 0) ||
      (advance !== undefined && advance < 0)) {
      return res.status(400).json({ error: 'Значения не могут быть отрицательными' });
    }

    const payroll = await payrollService.update(req.params.id, req.body, req.user.id);
    res.json(payroll);
  } catch (err: any) {
    console.error('Error updating payroll:', err);
    if (err.message === 'Forbidden: Payroll record does not belong to user') {
      console.log(`Access violation: User ${req.user.id} attempted to update payroll ${req.params.id}`);
      return res.status(403).json({ error: err.message });
    }
    res.status(404).json({ error: err.message || 'Ошибка обновления зарплаты' });
  }
};

export const deletePayroll = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const payroll = await payrollService.getById(req.params.id, req.user.id);
    const result = await payrollService.delete(req.params.id);
    res.json(result);
  } catch (err: any) {
    console.error('Error deleting payroll:', err);
    if (err.message === 'Forbidden: Payroll record does not belong to user') {
      console.log(`Access violation: User ${req.user.id} attempted to delete payroll ${req.params.id}`);
      return res.status(403).json({ error: err.message });
    }
    res.status(404).json({ error: err.message || 'Ошибка удаления зарплаты' });
  }
};

export const approvePayroll = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Verify ownership before approval
    const payroll = await payrollService.getById(req.params.id, req.user.id);
    const updatedPayroll = await payrollService.approve(req.params.id);
    res.json(updatedPayroll);
  } catch (err: any) {
    console.error('Error approving payroll:', err);
    if (err.message === 'Forbidden: Payroll record does not belong to user') {
      console.log(`Access violation: User ${req.user.id} attempted to approve payroll ${req.params.id}`);
      return res.status(403).json({ error: err.message });
    }
    res.status(404).json({ error: err.message || 'Ошибка подтверждения зарплаты' });
  }
};

export const markPayrollAsPaid = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Verify ownership before marking as paid
    const payroll = await payrollService.getById(req.params.id, req.user.id);
    const updatedPayroll = await payrollService.markAsPaid(req.params.id);
    res.json(updatedPayroll);
  } catch (err: any) {
    console.error('Error marking payroll as paid:', err);
    if (err.message === 'Forbidden: Payroll record does not belong to user') {
      console.log(`Access violation: User ${req.user.id} attempted to mark payroll ${req.params.id} as paid`);
      return res.status(403).json({ error: err.message });
    }
    res.status(404).json({ error: err.message || 'Ошибка отметки зарплаты как оплаченной' });
  }
};

export const generatePayrollSheets = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Проверяем, что пользователь является администратором
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Доступ запрещен. Требуются права администратора.' });
    }

    const { period, month } = req.body;
    const targetPeriod = period || month;

    if (!targetPeriod) {
      return res.status(400).json({ error: 'Период обязателен. Используйте формат YYYY-MM (например, 2025-01)' });
    }

    // Проверяем формат периода
    const periodRegex = /^\d{4}-\d{2}$/;
    if (!periodRegex.test(targetPeriod)) {
      return res.status(400).json({ error: 'Неверный формат периода. Используйте формат YYYY-MM (например, 2025-01)' });
    }

    // Проверяем и создаем расчетные листы для указанного периода, если они отсутствуют
    await payrollService.ensurePayrollRecordsForPeriod(targetPeriod);

    const results = await autoCalculatePayroll(targetPeriod, {
      autoCalculationDay: 0,
      emailRecipients: '',
      autoClearData: false
    });

    res.status(200).json({ message: `Расчетные листы успешно сгенерированы для периода: ${targetPeriod}`, data: results });
  } catch (err: any) {
    console.error('Error generating payroll sheets:', err);
    res.status(500).json({ error: err.message || 'Ошибка генерации расчетных листов' });
  }
};

export const generateRentSheets = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Проверяем, что пользователь является администратором
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Доступ запрещен. Требуются права администратора.' });
    }

    const { period } = req.body;

    if (!period) {
      return res.status(400).json({ error: 'Период обязателен. Используйте формат YYYY-MM (например, 2025-01)' });
    }

    // Проверяем формат периода
    const periodRegex = /^\d{4}-\d{2}$/;
    if (!periodRegex.test(period)) {
      return res.status(400).json({ error: 'Неверный формат периода. Используйте формат YYYY-MM (например, 2025-01)' });
    }

    // Проверяем и создаем расчетные листы для указанного периода, если они отсутствуют
    await payrollService.ensurePayrollRecordsForPeriod(period);

    // Для упрощения предположим, что арендаторы - это пользователи с определенными признаками
    // В реальной системе может быть отдельная коллекция арендаторов или специальная роль
    const allUsers = await User().find({ role: { $ne: 'admin' } });

    // Отфильтруем пользователей, которые потенциально могут быть арендаторами
    // В данном случае будем считать арендаторами всех пользователей, кроме специфических ролей
    const potentialTenants = allUsers.filter(user => {
      // Пользователь считается арендатором, если у него есть какие-то признаки аренды
      // В реальной системе здесь будет логика проверки специфических полей аренды
      return true; // Временно считаем всех пользователями арендаторами для демонстрации
    });

    // Генерируем арендные листы для каждого потенциального арендатора
    for (const tenant of potentialTenants) {
      // Вычисляем арендные данные
      // В реальной системе здесь будет более сложная логика расчета аренды
      // Временно используем фиксированное значение аренды или данные из профиля пользователя
      const rentAmount = 500; // Временное значение аренды, уменьшенное для упрощения

      // Итоговая сумма (нам должны заплатить)
      const total = rentAmount; // В упрощенной версии без штрафов

      // Проверяем, существует ли уже запись для этого арендатора и периода
      let rentRecord = await Payroll().findOne({
        tenantId: tenant._id, // Используем tenantId вместо staffId для аренды
        period: period
      });

      if (rentRecord) {
        // Обновляем существующую запись
        rentRecord.accruals = rentAmount;
        rentRecord.total = total;
        rentRecord.updatedAt = new Date();

        await rentRecord.save();
        console.log(`Обновлена аренда для арендатора ${tenant.fullName}: ${total} тг`);
      } else {
        // Создаем новую запись аренды
        rentRecord = new (Payroll())({
          tenantId: tenant._id, // Используем tenantId для арендатора
          period: period,
          baseSalary: rentAmount, // Базовая сумма аренды
          accruals: rentAmount, // Начисления (аренда)
          total: total, // Итоговая сумма, которую должны заплатить
          status: 'active', // Статус аренды
          createdAt: new Date(),
          updatedAt: new Date()
        });

        await rentRecord.save();
        console.log(`Создана аренда для арендатора ${tenant.fullName}: ${total} тг`);
      }
    }

    res.status(200).json({ message: `Арендные листы успешно сгенерированы для периода: ${period}` });
  } catch (err: any) {
    console.error('Error generating rent sheets:', err);
    res.status(500).json({ error: err.message || 'Ошибка генерации арендных листов' });
  }
};

/**
* Добавляет штраф к записи зарплаты
*/
export const addFine = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Только администратор может добавлять штрафы
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Insufficient permissions to add fines' });
    }

    const { amount, reason, type = 'other', notes } = req.body;
    const payrollId = req.params.id;

    if (!amount || !reason) {
      return res.status(400).json({ error: 'Amount and reason are required' });
    }

    const payrollService = new PayrollService();
    const updatedPayroll = await payrollService.addFine(payrollId, {
      amount: Number(amount),
      reason,
      type,
      notes
    });

    res.status(201).json(updatedPayroll);
  } catch (error) {
    console.error('Error adding fine:', error);
    res.status(500).json({ error: 'Error adding fine' });
  }
};

/**
* Получает все штрафы для записи зарплаты
*/
export const getFines = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const payrollId = req.params.id;

    // Проверяем права доступа
    // Пользователь может получить штрафы только для своей зарплаты или если он администратор
    if (req.user.role !== 'admin') {
      const payrollService = new PayrollService();
      const payroll = await payrollService.getById(payrollId);
      if (!payroll || !payroll.staffId || payroll.staffId._id.toString() !== req.user.id) {
        return res.status(403).json({ error: 'Forbidden: Insufficient permissions to access this payroll fines' });
      }
    }

    const payrollService = new PayrollService();
    const fines = await payrollService.getFines(payrollId);
    res.json({ fines });
  } catch (error) {
    console.error('Error getting fines:', error);
    res.status(500).json({ error: 'Error getting fines' });
  }
};

/**
* Удаляет штраф из записи зарплаты
*/
export const removeFine = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Только администратор может удалять штрафы
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Insufficient permissions to remove fines' });
    }

    const { payrollId, fineIndex } = req.params;

    const payrollService = new PayrollService();
    const updatedPayroll = await payrollService.removeFine(payrollId, Number(fineIndex));

    res.json(updatedPayroll);
  } catch (error) {
    console.error('Error removing fine:', error);
    res.status(500).json({ error: 'Error removing fine' });
  }
};

/**
* Получает общую сумму штрафов для записи зарплаты
*/
export const getTotalFines = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const payrollId = req.params.id;

    // Проверяем права доступа
    // Пользователь может получить информацию о штрафах только для своей зарплаты или если он администратор
    if (req.user.role !== 'admin') {
      const payrollService = new PayrollService();
      const payroll = await payrollService.getById(payrollId);
      if (!payroll || !payroll.staffId || payroll.staffId._id.toString() !== req.user.id) {
        return res.status(403).json({ error: 'Forbidden: Insufficient permissions to access this payroll fines' });
      }
    }

    const payrollService = new PayrollService();
    const totalFines = await payrollService.getTotalFines(payrollId);
    res.json({ totalFines });
  } catch (error) {
    console.error('Error calculating total fines:', error);
    res.status(500).json({ error: 'Error calculating total fines' });
  }
};
export const getPayrollBreakdown = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { id } = req.params;
    const breakdown = await payrollService.getPayrollBreakdown(id);
    res.json(breakdown);
  } catch (err: any) {
    console.error('Error getting payroll breakdown:', err);
    res.status(500).json({ error: err.message || 'Ошибка получения детализации зарплаты' });
  }
};