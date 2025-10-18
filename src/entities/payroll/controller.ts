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
      staffId: userId as string,
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
      staffId: userId as string,
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

export const generatePayrollSheets = async (req: AuthenticatedRequest, res: Response) => {
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
    
    // Импортируем необходимые модели
    const Payroll = (await import('../payroll/model')).default;
    const User = (await import('../users/model')).default;
    const StaffShift = (await import('../staffShifts/model')).default;
    
    // Получаем всех сотрудников
    const staff = await User.find({ role: { $ne: 'admin' } });
    
    // Получаем все смены за указанный период
    const [year, month] = period.split('-').map(Number);
    const startDate = new Date(year, month - 1, 1); // Первый день месяца
    const endDate = new Date(year, month, 0); // Последний день месяца
    
    const shifts = await StaffShift.find({
      date: { $gte: startDate, $lte: endDate }
    }).populate('staffId', '_id');
    
    // Группируем смены по сотрудникам
    const shiftsByStaff: { [key: string]: any[] } = {};
    shifts.forEach(shift => {
      const staffId = (shift.staffId as any)._id.toString();
      if (!shiftsByStaff[staffId]) {
        shiftsByStaff[staffId] = [];
      }
      shiftsByStaff[staffId].push(shift);
    });
    
    // Определяем интерфейс для информации о зарплате сотрудника
    interface EmployeePayrollInfo {
      baseSalary?: number;
      type?: string;
      shiftRate?: number;
      bonuses?: number;
    }

    // Расширяем интерфейс пользователя, чтобы включить информацию о зарплате
    interface IUserWithPayroll {
      _id: string;
      payroll?: EmployeePayrollInfo;
      fullName?: string;
      role: string;
    }
    
    // Генерируем расчетные листы для каждого сотрудника
    for (const rawEmployee of staff) {
      // Приводим тип сотрудника к IUserWithPayroll
      const employeeWithPayroll = rawEmployee as unknown as IUserWithPayroll;
      
      const employeeShifts = shiftsByStaff[employeeWithPayroll._id.toString()] || [];
      
      // Вычисляем базовые значения
      const workedDays = employeeShifts.filter(shift => shift.startTime).length;
      const workedShifts = employeeShifts.length;
      
      // Вычисляем итоговую зарплату
      // В реальном приложении логика начисления зарплаты может быть более сложной
      let baseSalary = employeeWithPayroll.payroll?.baseSalary || 0;
      
      // Если зарплата посменно, вычисляем на основе отработанных смен
      if (employeeWithPayroll.payroll?.type === 'per_shift' && employeeWithPayroll.payroll?.shiftRate) {
        baseSalary = workedShifts * employeeWithPayroll.payroll.shiftRate;
      }
      // Если зарплата посменно с фиксированной частью
      else if (employeeWithPayroll.payroll?.type === 'per_shift_with_fixed' && employeeWithPayroll.payroll?.shiftRate) {
        const fixedPart = employeeWithPayroll.payroll.baseSalary || 0;
        const shiftPart = workedShifts * employeeWithPayroll.payroll.shiftRate;
        baseSalary = fixedPart + shiftPart;
      }
      
      // Бонусы (в реальном приложении могут зависеть от KPI, премий и т.д.)
      const bonuses = employeeWithPayroll.payroll?.bonuses || 0;
      const deductions = 0; // В упрощенной версии без штрафов
      
      // Итоговая сумма
      const total = baseSalary + bonuses - deductions;
      
      // Проверяем, существует ли уже запись для этого сотрудника и периода
      let payroll = await Payroll.findOne({
        staffId: employeeWithPayroll._id,
        period: period
      });
      
      if (payroll) {
        // Обновляем существующую запись
        payroll.accruals = baseSalary;
        payroll.bonuses = bonuses;
        payroll.deductions = deductions;
        payroll.total = total;
        payroll.updatedAt = new Date();
        
        await payroll.save();
        console.log(`Обновлена зарплата для сотрудника ${employeeWithPayroll.fullName}: ${total} тг`);
      } else {
        // Создаем новую запись
        payroll = new Payroll({
          staffId: employeeWithPayroll._id,
          period: period,
          baseSalary: baseSalary,
          accruals: baseSalary,
          bonuses: bonuses,
          deductions: deductions,
          total: total,
          status: 'draft',
          createdAt: new Date(),
          updatedAt: new Date()
        });
        
        await payroll.save();
        console.log(`Создана зарплата для сотрудника ${employeeWithPayroll.fullName}: ${total} тг`);
      }
    }
    
    res.status(200).json({ message: `Расчетные листы успешно сгенерированы для периода: ${period}` });
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
    
    // Импортируем необходимые модели
    const Payroll = (await import('../payroll/model')).default;
    const User = (await import('../users/model')).default;
    
    // Для упрощения предположим, что арендаторы - это пользователи с определенными признаками
    // В реальной системе может быть отдельная коллекция арендаторов или специальная роль
    const allUsers = await User.find({ role: { $ne: 'admin' } });
    
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
      let rentRecord = await Payroll.findOne({
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
        rentRecord = new Payroll({
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