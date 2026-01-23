import { Request, Response } from 'express';
import { PayrollService } from './service';
import { AuthUser } from '../../middlewares/authMiddleware';
import { autoCalculatePayroll } from '../../services/payrollAutomationService';
import Payroll from './model';
import User from '../users/model';
import mongoose from 'mongoose';

export const getSalarySummary = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { startDate, endDate, userId } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate and endDate are required' });
    }

    // Извлекаем период (YYYY-MM) из дат. 
    // Чтобы избежать проблем с границами (00:00:00), берем середину диапазона между startDate и endDate.
    const startObj = new Date(startDate as string);
    const endObj = new Date(endDate as string);
    const middleDate = new Date((startObj.getTime() + endObj.getTime()) / 2);

    const startPeriod = (startDate as string).substring(0, 7);
    const endPeriod = (endDate as string).substring(0, 7);
    const targetPeriod = middleDate.toISOString().substring(0, 7);

    // Убрано автоматическое формирование расчетных листов при просмотре статистики,
    // чтобы не изменять данные без явного действия пользователя.

    const filter: any = {};

    // Если администратор, всегда показываем общую сводку по всем сотрудникам.
    // Если не админ (хотя роут защищен), или если в будущем разрешим сотрудникам смотреть свою сводку.
    if (req.user.role !== 'admin' && userId) {
      filter.staffId = new mongoose.Types.ObjectId(userId as string);
    }

    if (startPeriod === endPeriod) {
      filter.period = startPeriod;
    } else {
      // Если запрос пришел с дашборда (где мы поправили даты), startPeriod и endPeriod будут одинаковы.
      // На всякий случай оставляем поддержку диапазона через targetPeriod.
      filter.period = targetPeriod;
    }

    // Фильтруем записи: учитываем только тех, у кого есть отработанные смены или дни,
    // либо если есть начисления (могут быть ручные бонусы без смен, но требование пользователя 
    // говорит о "хотя бы 1 смене").
    filter.$or = [
      { workedShifts: { $gt: 0 } },
      { workedDays: { $gt: 0 } }
    ];

    const payrolls = await Payroll.find(filter).populate('staffId');

    // Роли, которые не должны отображаться в зарплатах
    const excludedRoles = ['tenant', 'speech_therapist'];

    const filteredPayrolls = payrolls.filter((p: any) => {
      const role = p.staffId?.role || '';
      return !excludedRoles.includes(role);
    });

    const stats = filteredPayrolls.reduce((acc: any, p: any) => {
      // Начисления = база (оклад по сменам/дням) + бонусы
      const totalAccrued = (p.accruals || 0) + (p.bonuses || 0);
      const advance = (p.advance || 0);
      const penalties = (p.penalties || 0); // penalties уже включает latePenalties, absencePenalties, userFines согласно хуку модели

      acc.totalAccruals += totalAccrued;
      acc.totalAdvance += advance;
      acc.totalPenalties += penalties;
      acc.totalPayout += (p.total || 0);
      acc.totalAccrualsCount += (totalAccrued > 0 ? 1 : 0);
      acc.totalPenaltiesCount += (penalties > 0 ? 1 : 0);
      return acc;
    }, {
      totalAccruals: 0,
      totalAdvance: 0,
      totalPenalties: 0,
      totalPayout: 0,
      totalEmployees: new Set(filteredPayrolls.map(p => p.staffId?._id?.toString() || p.staffId?.toString())).size,
      totalAccrualsCount: 0,
      totalPenaltiesCount: 0
    });

    res.json(stats);
  } catch (error) {
    console.error('Error in getSalarySummary:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};


interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

const payrollService = new PayrollService();

export const getAllPayrolls = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { userId, period, status, month } = req.query;
    const targetPeriod = (period as string) || (month as string) || new Date().toISOString().slice(0, 7);

    const isStaffRequest = req.user.role !== 'admin' && req.user.role !== 'manager';
    const staffIdFilter = isStaffRequest
      ? req.user.id
      : (userId as string); // Для админов позволяем фильтровать по userId если он передан

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
    // Убрано автоматическое обновление - расчетные листы обновляются только по кнопке "Обновить всё"
    // if (targetPeriod === new Date().toISOString().slice(0, 7)) {
    //   await payrollService.ensurePayrollRecordsForPeriod(targetPeriod);
    // }

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

    const targetPeriod = (period as string) || (month as string) || new Date().toISOString().slice(0, 7);





    console.log(`Ensuring payroll for user ${req.user.id} in period ${targetPeriod}...`);
    try {
      await payrollService.ensurePayrollForUser(req.user.id, targetPeriod);
    } catch (generationError) {
      console.error('Error generating/updating payroll on-demand:', generationError);

    }

    const payrolls = await payrollService.getAllWithUsers({
      staffId: req.user.id,
      period: targetPeriod
    });


    if (payrolls.length > 0) {
      const p = payrolls[0];
      console.log('=== DEBUG getMyPayrolls ===');
      console.log(`  staffId: ${req.user.id}, period: ${targetPeriod}`);
      console.log(`  Found ${payrolls.length} payroll(s)`);
      console.log(`  First payroll: total=${p.total}, accruals=${p.accruals}, workedShifts=${p.workedShifts}`);
      console.log(`  shiftDetails count: ${p.shiftDetails?.length || 0}`);
      if (p.shiftDetails?.length > 0) {
        console.log(`  First shiftDetail: earnings=${p.shiftDetails[0].earnings}`);
      }
      console.log('=========================');
    }

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


    const { baseSalary, bonuses, deductions, advance } = req.body;
    if (baseSalary < 0 || bonuses < 0 || deductions < 0 || (advance !== undefined && advance < 0)) {
      return res.status(400).json({ error: 'Значения не могут быть отрицательными' });
    }


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


    const { baseSalary, bonuses, deductions, advance } = req.body;
    if ((baseSalary !== undefined && baseSalary < 0) ||
      (bonuses !== undefined && bonuses < 0) ||
      (deductions !== undefined && deductions < 0) ||
      (advance !== undefined && advance < 0)) {
      return res.status(400).json({ error: 'Значения не могут быть отрицательными' });
    }

    const updaterId = (req.user.role === 'admin' || req.user.role === 'manager') ? undefined : req.user.id;
    const payroll = await payrollService.update(req.params.id, req.body, updaterId);
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

    const checkUser = (req.user.role === 'admin' || req.user.role === 'manager') ? undefined : req.user.id;
    const payroll = await payrollService.getById(req.params.id, checkUser);
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


    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Доступ запрещен. Требуются права администратора.' });
    }

    const { period, month } = req.body;
    const targetPeriod = period || month;

    if (!targetPeriod) {
      return res.status(400).json({ error: 'Период обязателен. Используйте формат YYYY-MM (например, 2025-01)' });
    }


    const periodRegex = /^\d{4}-\d{2}$/;
    if (!periodRegex.test(targetPeriod)) {
      return res.status(400).json({ error: 'Неверный формат периода. Используйте формат YYYY-MM (например, 2025-01)' });
    }


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


    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Доступ запрещен. Требуются права администратора.' });
    }

    const { period } = req.body;

    if (!period) {
      return res.status(400).json({ error: 'Период обязателен. Используйте формат YYYY-MM (например, 2025-01)' });
    }


    const periodRegex = /^\d{4}-\d{2}$/;
    if (!periodRegex.test(period)) {
      return res.status(400).json({ error: 'Неверный формат периода. Используйте формат YYYY-MM (например, 2025-01)' });
    }


    await payrollService.ensurePayrollRecordsForPeriod(period);



    const allUsers = await User.find({ role: { $ne: 'admin' } });



    const potentialTenants = allUsers.filter(user => {


      return true;
    });


    for (const tenant of potentialTenants) {



      const rentAmount = 500;


      const total = rentAmount;


      let rentRecord = await Payroll.findOne({
        tenantId: tenant._id,
        period: period
      });

      if (rentRecord) {

        rentRecord.accruals = rentAmount;
        rentRecord.total = total;
        rentRecord.updatedAt = new Date();

        await rentRecord.save();
        console.log(`Обновлена аренда для арендатора ${tenant.fullName}: ${total} тг`);
      } else {

        rentRecord = new Payroll({
          tenantId: tenant._id,
          period: period,
          baseSalary: rentAmount,
          accruals: rentAmount,
          total: total,
          status: 'active',
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

export const addFine = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }


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

export const getFines = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const payrollId = req.params.id;



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

export const removeFine = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }


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

export const getTotalFines = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const payrollId = req.params.id;



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

/**
 * Расчёт долга по авансу для периода
 * Переносит долг на следующий месяц если аванс > начислений
 * POST /payroll/calculate-debt
 */
export const calculateDebt = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Только админ может рассчитывать долг
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Доступ запрещен. Требуются права администратора.' });
    }

    const { period } = req.body;

    if (!period) {
      return res.status(400).json({ error: 'Период обязателен. Используйте формат YYYY-MM' });
    }

    const periodRegex = /^\d{4}-\d{2}$/;
    if (!periodRegex.test(period)) {
      return res.status(400).json({ error: 'Неверный формат периода. Используйте формат YYYY-MM' });
    }

    const result = await payrollService.calculateDebtForPeriod(period);
    res.json(result);
  } catch (err: any) {
    console.error('Error calculating debt:', err);
    res.status(500).json({ error: err.message || 'Ошибка расчёта долга' });
  }
};