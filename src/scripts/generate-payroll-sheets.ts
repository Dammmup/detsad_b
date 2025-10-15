import mongoose from 'mongoose';
import Payroll from '../entities/payroll/model';
import User from '../entities/users/model';
import StaffShift from '../entities/staffShifts/model';
import { IUser } from '../entities/users/model';

// Определяем интерфейс для информации о зарплате сотрудника
interface EmployeePayrollInfo {
  baseSalary?: number;
  type?: string;
  shiftRate?: number;
  latePenaltyRate?: number;
  bonuses?: number;
}

// Определяем интерфейс для пользователя с информацией о зарплате
interface IUserWithPayroll {
  _id: string;
  payroll?: EmployeePayrollInfo;
  fullName?: string;
  role: string;
}

// Функция для вычисления количества рабочих дней в месяце
function getWorkingDaysInMonth(year: number, month: number): number {
  // Временно устанавливаем количество рабочих дней в месяце (без учета праздников)
  // В реальном приложении нужно учитывать государственные праздники
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  let workingDays = 0;
  
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const dayOfWeek = date.getDay();
    // Считаем все дни, кроме субботы (6) и воскресенья (0)
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      workingDays++;
    }
 }
  
  return workingDays;
}

// Функция для вычисления штрафов за опоздания
function calculateLatePenalties(shifts: any[], latePenaltyRate: number = 500): number {
  let totalPenalty = 0;
  
  for (const shift of shifts) {
    if (shift.startTime && shift.scheduledStartTime) {
      const scheduledStart = new Date(shift.scheduledStartTime);
      const actualStart = new Date(shift.startTime);
      
      // Вычисляем разницу в минутах между запланированным и фактическим временем начала
      const delayInMinutes = Math.max(0, (actualStart.getTime() - scheduledStart.getTime()) / (1000 * 60));
      
      // Если опоздание больше 5 минут, применяем штраф
      if (delayInMinutes >= 5) {
        // Штрафы применяются за каждые 5 минут опоздания
        const fiveMinuteIntervals = Math.ceil(delayInMinutes / 5);
        totalPenalty += fiveMinuteIntervals * latePenaltyRate;
      }
    }
 }
  
  return totalPenalty;
}

// Функция для вычисления штрафов за неявки
function calculateAbsencePenalties(shifts: any[]): number {
  let totalPenalty = 0;
  
  for (const shift of shifts) {
    // Если смена была запланирована, но не отмечена как отработанная
    if (shift.scheduledStartTime && !shift.startTime) {
      totalPenalty += 5000; // Фиксированная ставка за неявку
    }
  }
  
  return totalPenalty;
}

// Основная функция для генерации расчетных листов
async function generatePayrollSheets(period: string) {
  try {
    // Подключение к базе данных
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/daycare');

    // Разбиваем период на год и месяц
    const [year, month] = period.split('-').map(Number);
    
    // Получаем всех сотрудников
    const staff = await User.find({ role: { $ne: 'admin' } });
    
    // Получаем все смены за указанный период
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
    
    // Генерируем расчетные листы для каждого сотрудника
    for (const rawEmployee of staff) {
      // Приводим тип сотрудника к IUserWithPayroll
      const employeeWithPayroll = rawEmployee as IUserWithPayroll;
      
      const employeeShifts = shiftsByStaff[employeeWithPayroll._id.toString()] || [];
      
      // Вычисляем базовые значения
      const workingDaysInPeriod = getWorkingDaysInMonth(year, month - 1);
      const workedDays = employeeShifts.filter(shift => shift.startTime).length;
      const workedShifts = employeeShifts.length;
      
      // Вычисляем штрафы
      const latePenaltyRate = employeeWithPayroll.payroll?.latePenaltyRate || 500;
      const latePenalties = calculateLatePenalties(employeeShifts, latePenaltyRate);
      const absencePenalties = calculateAbsencePenalties(employeeShifts);
      
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
      
      // Общие штрафы
      const penalties = latePenalties + absencePenalties;
      
      // Итоговая сумма
      const total = baseSalary + bonuses - penalties;
      
      // Проверяем, существует ли уже запись для этого сотрудника и периода
      let payroll = await Payroll.findOne({
        staffId: employeeWithPayroll._id,
        period: period
      });
      
      if (payroll) {
        // Обновляем существующую запись
        payroll.accruals = baseSalary;
        payroll.bonuses = bonuses;
        payroll.penalties = penalties;
        payroll.latePenalties = latePenalties;
        payroll.absencePenalties = absencePenalties;
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
          penalties: penalties,
          latePenalties: latePenalties,
          absencePenalties: absencePenalties,
          total: total,
          status: 'draft',
          createdAt: new Date(),
          updatedAt: new Date()
        });
        
        await payroll.save();
        console.log(`Создана зарплата для сотрудника ${employeeWithPayroll.fullName}: ${total} тг`);
      }
    }
    
    console.log('Расчетные листы успешно сгенерированы для периода:', period);
  } catch (error) {
    console.error('Ошибка при генерации расчетных листов:', error);
  } finally {
    // Закрываем соединение с базой данных
    await mongoose.disconnect();
  }
}

// Проверяем аргументы командной строки
if (require.main === module) {
  const period = process.argv[2]; // Ожидаем период в формате YYYY-MM
  
  if (!period) {
    console.error('Пожалуйста, укажите период в формате YYYY-MM (например, 2025-01)');
    process.exit(1);
  }
  
  // Проверяем формат периода
  const periodRegex = /^\d{4}-\d{2}$/;
  if (!periodRegex.test(period)) {
    console.error('Неверный формат периода. Используйте формат YYYY-MM (например, 2025-01)');
    process.exit(1);
  }
  
  generatePayrollSheets(period);
}

export default generatePayrollSheets;