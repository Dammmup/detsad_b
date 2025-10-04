import { Document, Types } from 'mongoose';
import Payroll, { IPayroll } from './payroll.model';
import User from '../users/user.model';
import StaffShift from '../shifts/staff-shift.model';
import Fine from '../finance/finance.model';

// Сервис для работы с расчетами зарплаты
export class PayrollService {
  // Получение расчетных листов с фильтрацией
  async getPayrolls(filter: any = {}) {
    try {
      return await Payroll.find(filter)
        .populate('staffId', 'fullName phone role salary salaryType shiftRate penaltyType penaltyAmount')
        .populate('generatedBy', 'fullName role');
    } catch (error) {
      throw new Error(`Error getting payrolls: ${error}`);
    }
  }

  // Получение расчетного листа по ID
  async getPayrollById(id: string) {
    try {
      return await Payroll.findById(id)
        .populate('staffId', 'fullName phone role salary salaryType shiftRate penaltyType penaltyAmount')
        .populate('generatedBy', 'fullName role');
    } catch (error) {
      throw new Error(`Error getting payroll by id: ${error}`);
    }
  }

  // Создание нового расчетного листа
  async createPayroll(payrollData: Partial<IPayroll>) {
    try {
      const payroll = new Payroll(payrollData);
      return await payroll.save();
    } catch (error) {
      throw new Error(`Error creating payroll: ${error}`);
    }
  }

  // Обновление расчетного листа
  async updatePayroll(id: string, payrollData: Partial<IPayroll>) {
    try {
      return await Payroll.findByIdAndUpdate(id, payrollData, { new: true })
        .populate('staffId', 'fullName phone role salary salaryType shiftRate penaltyType penaltyAmount')
        .populate('generatedBy', 'fullName role');
    } catch (error) {
      throw new Error(`Error updating payroll: ${error}`);
    }
  }

  // Удаление расчетного листа
  async deletePayroll(id: string) {
    try {
      const result = await Payroll.findByIdAndDelete(id);
      return !!result;
    } catch (error) {
      throw new Error(`Error deleting payroll: ${error}`);
    }
  }

  // Ручной расчет зарплаты для сотрудника
  async calculateManualPayroll(staffId: string, month: string) {
    try {
      // Получаем информацию о сотруднике
      const employee = await User.findById(staffId);
      if (!employee) {
        throw new Error('Сотрудник не найден');
      }

      // Формат month: YYYY-MM
      const startDate = new Date(`${month}-01`);
      const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);

      // Получаем смены сотрудника за указанный месяц
      const attendanceRecords = await StaffShift.find({
        staffId: employee._id,
        date: {
          $gte: startDate,
          $lte: endDate
        }
      });

      // Рассчитываем количество отработанных дней и смен
      const workedShifts = attendanceRecords.filter(record => record.status === 'completed' || record.status === 'in_progress').length;
      const workedDays = new Set(attendanceRecords.filter(record => record.status === 'completed' || record.status === 'in_progress').map(record => record.date.toString())).size;

      // Рассчитываем штрафы для сотрудника из посещаемости
      let totalPenalty = 0;
      let latePenalties = 0;
      let absencePenalties = 0;

      // Получаем параметры штрафов из профиля сотрудника
      const penaltyType = (employee as any).penaltyType || 'per_5_minutes';
      const penaltyAmount = (employee as any).penaltyAmount || 0;

      // Штрафы за опоздания: рассчитываем в зависимости от типа штрафа
      const lateRecords = attendanceRecords.filter(record => (record as any).lateMinutes && (record as any).lateMinutes > 0);

      for (const record of lateRecords) {
        if ((record as any).lateMinutes) {
          switch (penaltyType) {
            case 'per_minute':
              // Штраф за каждую минуту опоздания
              latePenalties += (record as any).lateMinutes * penaltyAmount;
              break;
            case 'per_5_minutes':
              // Штраф за каждые 5 минут опоздания
              latePenalties += Math.ceil((record as any).lateMinutes / 5) * penaltyAmount;
              break;
            case 'per_10_minutes':
              // Штраф за каждые 10 минут опоздания
              latePenalties += Math.ceil((record as any).lateMinutes / 10) * penaltyAmount;
              break;
            case 'fixed':
              // Фиксированная сумма за опоздание
              latePenalties += penaltyAmount;
              break;
            case 'percent':
              // Процент от ставки за опоздание - для этого нужно знать ставку за день
              // Используем базовую зарплату для расчета
              const dailyRate = this.calculateDailyRate(employee);
              latePenalties += (dailyRate * penaltyAmount) / 100;
              break;
            default:
              // По умолчанию - штраф за каждые 5 минут
              latePenalties += Math.ceil((record as any).lateMinutes / 5) * penaltyAmount;
          }
        }
      }

      // Штрафы за неявки: 630 тг за каждый случай (60*10,5 минут как в задании)
      const absenceRecords = attendanceRecords.filter(record => record.status === 'no_show');
      absencePenalties = absenceRecords.length * 630;

      // Получаем штрафы сотрудника за текущий месяц
      const monthlyFines = await Fine.find({
        user: employee._id,
        date: { $gte: startDate, $lte: endDate }
      });

      const userFinesTotal = monthlyFines.reduce((sum: number, f: any) => sum + (f.amount || 0), 0);

      totalPenalty = latePenalties + absencePenalties + userFinesTotal;

      // Рассчитываем начисления в зависимости от типа оплаты
      let accruals = 0;
      const baseSalary = (employee as any).salary || 0;
      const baseSalaryType = (employee as any).salaryType || 'per_month';
      const shiftRate = (employee as any).shiftRate || 0;

      switch (baseSalaryType) {
        case 'per_month':
          accruals = baseSalary;
          break;
        case 'per_day':
          // Для дневной оплаты умножаем на количество рабочих дней в месяце
          // Используем отработанные дни
          accruals = baseSalary * workedDays;
          break;
        case 'per_shift':
          // Для оплаты за смену умножаем на количество отработанных смен
          accruals = shiftRate * workedShifts;
          break;
        default:
          accruals = baseSalary;
      }

      // Создаем или обновляем запись о зарплате
      let payroll = await Payroll.findOne({
        staffId: employee._id,
        month
      });

      if (payroll) {
        // Обновляем существующую запись
        payroll.accruals = accruals;
        payroll.penalties = totalPenalty;
        payroll.latePenalties = latePenalties;
        payroll.absencePenalties = absencePenalties;
        payroll.userFines = userFinesTotal;
        payroll.total = accruals - totalPenalty;

        // Добавляем дополнительные поля
        payroll.baseSalary = baseSalary;
        // Преобразуем типы из формата User в формат Payroll
        payroll.baseSalaryType = baseSalaryType === 'per_day' ? 'day' :
                                baseSalaryType === 'per_month' ? 'month' :
                                baseSalaryType === 'per_shift' ? 'shift' : 'month';
        payroll.shiftRate = shiftRate;
        payroll.workedDays = workedDays;
        payroll.workedShifts = workedShifts;
        payroll.penaltyDetails = {
          type: (employee as any).penaltyType || 'per_5_minutes',
          amount: (employee as any).penaltyAmount || 0,
          latePenalties: latePenalties,
          absencePenalties: absencePenalties,
          userFines: userFinesTotal
        };

        await payroll.save();
      } else {
        // Создаем новую запись
        payroll = new Payroll({
          staffId: employee._id,
          month,
          accruals: accruals,
          penalties: totalPenalty,
          latePenalties: latePenalties,
          absencePenalties: absencePenalties,
          userFines: userFinesTotal,
          total: accruals - totalPenalty,
          status: 'calculated',

          // Добавляем дополнительные поля
          baseSalary: baseSalary,
          // Преобразуем типы из формата User в формат Payroll
          baseSalaryType: baseSalaryType === 'per_day' ? 'day' :
                          baseSalaryType === 'per_month' ? 'month' :
                          baseSalaryType === 'per_shift' ? 'shift' : 'month',
          shiftRate: shiftRate,
          workedDays: workedDays,
          workedShifts: workedShifts,
          penaltyDetails: {
            type: (employee as any).penaltyType || 'per_5_minutes',
            amount: (employee as any).penaltyAmount || 0,
            latePenalties: latePenalties,
            absencePenalties: absencePenalties,
            userFines: userFinesTotal
          }
        });
        await payroll.save();
      }

      return payroll;
    } catch (error) {
      throw new Error(`Error calculating manual payroll: ${error}`);
    }
  }

  // Вспомогательная функция для расчета дневной ставки
  private calculateDailyRate(employee: any): number {
    const salary = employee.salary || 0;
    const salaryType = employee.salaryType || 'per_month';
    const shiftRate = employee.shiftRate || 0;

    switch (salaryType) {
      case 'per_month':
        // Если зарплата в месяц, делим на 22 рабочих дня
        return salary / 22;
      case 'per_day':
        // Если зарплата в день, возвращаем как есть
        return salary;
      case 'per_shift':
        // Если зарплата за смену, возвращаем ставку за смену
        return shiftRate;
      default:
        // По умолчанию - месячная ставка
        return salary / 22;
    }
  }

  // Получение расчетных листов по сотруднику
  async getPayrollsByStaffId(staffId: string) {
    try {
      return await Payroll.find({ staffId })
        .populate('staffId', 'fullName phone role salary salaryType shiftRate penaltyType penaltyAmount')
        .populate('generatedBy', 'fullName role')
        .sort({ month: -1 });
    } catch (error) {
      throw new Error(`Error getting payrolls by staff id: ${error}`);
    }
  }

  // Получение расчетных листов по месяцу
  async getPayrollsByMonth(month: string) {
    try {
      return await Payroll.find({ month })
        .populate('staffId', 'fullName phone role salary salaryType shiftRate penaltyType penaltyAmount')
        .populate('generatedBy', 'fullName role')
        .sort({ staffId: 1 });
    } catch (error) {
      throw new Error(`Error getting payrolls by month: ${error}`);
    }
  }

  // Получение статистики по зарплатам
  async getPayrollStatistics() {
    try {
      const totalPayrolls = await Payroll.countDocuments();
      const calculatedPayrolls = await Payroll.countDocuments({ status: 'calculated' });
      const approvedPayrolls = await Payroll.countDocuments({ status: 'approved' });
      const paidPayrolls = await Payroll.countDocuments({ status: 'paid' });
      const draftPayrolls = await Payroll.countDocuments({ status: 'draft' });
      
      // Получаем последние 12 месяцев расчетных листов
      const months = [];
      const now = new Date();
      
      for (let i = 0; i < 12; i++) {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthStr = monthDate.toISOString().slice(0, 7); // YYYY-MM
        
        const count = await Payroll.countDocuments({ month: monthStr });
        months.push({
          month: monthStr,
          count
        });
      }
      
      return {
        total: totalPayrolls,
        calculated: calculatedPayrolls,
        approved: approvedPayrolls,
        paid: paidPayrolls,
        draft: draftPayrolls,
        byMonths: months.reverse()
      };
    } catch (error) {
      throw new Error(`Error getting payroll statistics: ${error}`);
    }
  }

  // Поиск расчетных листов по сотруднику
  async searchPayrollsByStaffName(searchTerm: string) {
    try {
      // Сначала ищем сотрудников по имени
      const employees = await User.find({
        fullName: { $regex: searchTerm, $options: 'i' },
        role: { $in: ['admin', 'manager', 'teacher', 'assistant', 'cook', 'cleaner', 'security', 'nurse', 'doctor', 'psychologist', 'intern'] }
      });
      
      const employeeIds = employees.map(emp => emp._id);
      
      // Затем получаем расчетные листы этих сотрудников
      return await Payroll.find({
        staffId: { $in: employeeIds }
      })
        .populate('staffId', 'fullName phone role salary salaryType shiftRate penaltyType penaltyAmount')
        .populate('generatedBy', 'fullName role')
        .limit(50);
    } catch (error) {
      throw new Error(`Error searching payrolls by staff name: ${error}`);
    }
  }

  // Утверждение расчетного листа
  async approvePayroll(id: string, approverId: string) {
    try {
      return await Payroll.findByIdAndUpdate(
        id,
        {
          status: 'approved',
          approvedBy: approverId,
          approvedAt: new Date()
        },
        { new: true }
      )
        .populate('staffId', 'fullName phone role salary salaryType shiftRate penaltyType penaltyAmount')
        .populate('generatedBy', 'fullName role')
        .populate('approvedBy', 'fullName role');
    } catch (error) {
      throw new Error(`Error approving payroll: ${error}`);
    }
  }

  // Оплата расчетного листа
  async payPayroll(id: string, payerId: string) {
    try {
      return await Payroll.findByIdAndUpdate(
        id,
        {
          status: 'paid',
          paidBy: payerId,
          paidAt: new Date()
        },
        { new: true }
      )
        .populate('staffId', 'fullName phone role salary salaryType shiftRate penaltyType penaltyAmount')
        .populate('generatedBy', 'fullName role')
        .populate('approvedBy', 'fullName role')
        .populate('paidBy', 'fullName role');
    } catch (error) {
      throw new Error(`Error paying payroll: ${error}`);
    }
  }

  // Архивирование расчетного листа
  async archivePayroll(id: string) {
    try {
      return await Payroll.findByIdAndUpdate(
        id,
        {
          status: 'archived',
          archivedAt: new Date()
        },
        { new: true }
      )
        .populate('staffId', 'fullName phone role salary salaryType shiftRate penaltyType penaltyAmount')
        .populate('generatedBy', 'fullName role')
        .populate('approvedBy', 'fullName role')
        .populate('paidBy', 'fullName role');
    } catch (error) {
      throw new Error(`Error archiving payroll: ${error}`);
    }
  }
}

// Экземпляр сервиса для использования в контроллерах
export const payrollService = new PayrollService();