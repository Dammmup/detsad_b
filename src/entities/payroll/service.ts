import { IPayroll } from './model';
import User from '../users/model';
import Payroll from './model';
import StaffAttendanceTracking from '../staffAttendanceTracking/model';
import { sendTelegramNotification } from '../../utils/telegramNotify';
import {
  calculatePenalties,
  getWorkingDaysInMonth,
  shouldCountAttendance
} from '../../services/payrollAutomationService';



export class PayrollService {
  async getPayrollBreakdown(id: string) {
    const payroll = await Payroll.findById(id).populate('staffId', 'fullName role');
    if (!payroll) return null;

    const pObj = payroll.toObject();
    const startDate = new Date(`${pObj.period}-01`);
    (pObj as any).normDays = await getWorkingDaysInMonth(startDate);
    return pObj;
  }
  async getAll(filters: { staffId?: string, period?: string, status?: string }) {
    const filter: any = {};

    if (filters.staffId) filter.staffId = filters.staffId;
    const targetPeriod = filters.period || new Date().toISOString().slice(0, 7);
    if (targetPeriod) filter.period = targetPeriod;
    if (filters.status) filter.status = filters.status;

    let payrolls = await Payroll.find(filter)
      .populate('staffId', 'fullName role')
      .sort({ period: -1 });

    // Исключаем арендаторов и логопедов - они платят нам, а не мы им
    const excludedRoles = ['tenant', 'speech_therapist'];
    payrolls = payrolls.filter((p: any) => {
      const role = p.staffId?.role || '';
      return !excludedRoles.includes(role);
    });

    return await Promise.all(payrolls.map(async (p) => {
      const pObj = p.toObject();
      const targetPeriod = p.period;
      let workingDays = 0;
      if (targetPeriod) {
        const startDate = new Date(`${targetPeriod}-01`);
        workingDays = await getWorkingDaysInMonth(startDate);
      }
      (pObj as any).normDays = workingDays;
      return pObj;
    }));
  }

  async getAllWithUsers(filters: { staffId?: string, period?: string, status?: string }) {
    const excludedRoles = ['tenant', 'speech_therapist', 'admin'];
    const userFilter: any = { role: { $nin: excludedRoles } };
    if (filters.status) userFilter.status = filters.status;
    const period = filters.period || new Date().toISOString().slice(0, 7);

    if (filters.staffId) {
      userFilter._id = filters.staffId;
    }

    const users = await User.find(userFilter)
      .select('_id fullName role iin uniqNumber')
      .sort({ fullName: 1 });


    let payrollRecords: any[] = [];
    const payrollFilter: any = { period };
    if (filters.staffId) {
      payrollFilter.staffId = filters.staffId;
    }
    payrollRecords = await Payroll.find(payrollFilter)
      .populate('staffId', 'fullName role')
      .sort({ createdAt: -1 });

    const payrollMap = new Map();
    payrollRecords.forEach(record => {
      if (record.staffId && record.staffId._id) {
        payrollMap.set(record.staffId._id.toString(), record);
      }
    });


    const result = await Promise.all(users.map(async (user) => {
      const payroll = user._id ? payrollMap.get((user._id as any).toString()) : null;

      if (payroll) {
        const pObj = payroll.toObject();
        const targetPeriod = payroll.period;

        let workingDays = 0;
        if (targetPeriod) {
          const startDate = new Date(`${targetPeriod}-01`);
          workingDays = await getWorkingDaysInMonth(startDate);
        }
        pObj.normDays = workingDays;

        if (pObj.total === 0 && (pObj.accruals > 0 || pObj.workedShifts > 0)) {
          pObj.total = (pObj.accruals || 0) - (pObj.penalties || 0);
        }
        return pObj;
      } else {

        // Ищем baseSalary из предыдущих периодов этого сотрудника
        const previousPayroll = await Payroll.findOne({
          staffId: user._id
        }).sort({ period: -1 }); // Берём последнюю запись

        const baseSalary = previousPayroll?.baseSalary || 180000; // Если нет записей - 180000 по умолчанию
        const salaryType: string = previousPayroll?.baseSalaryType || 'month';
        const shiftRate = previousPayroll?.shiftRate || 0;

        let workedDays = 0;
        let workedShifts = 0;
        let accruals: number;
        let penalties = 0;
        let latePenalties = 0;
        let absencePenalties = 0;


        let countOfWorkdays = 0;
        if (period) {
          const startDate = new Date(`${period}-01`);
          const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
          endDate.setHours(23, 59, 59, 999);
          let workingDaysInPeriod = await getWorkingDaysInMonth(startDate);

          if (workingDaysInPeriod <= 0) {
            const year = startDate.getFullYear();
            const month = startDate.getMonth();
            const lastDay = new Date(year, month + 1, 0).getDate();
            for (let d = 1; d <= lastDay; d++) {
              const dayOfWeek = new Date(year, month, d).getDay();
              if (dayOfWeek !== 0 && dayOfWeek !== 6) workingDaysInPeriod++;
            }
          }
          const attendanceRecords = await StaffAttendanceTracking.find({
            staffId: user._id,
            date: { $gte: startDate, $lte: endDate }
          });
          countOfWorkdays = workingDaysInPeriod;
          const countedRecords = attendanceRecords.filter(rec => shouldCountAttendance(rec));
          workedShifts = countedRecords.length;
          workedDays = countedRecords.length;


          if (salaryType === 'shift') {
            accruals = workedShifts * (shiftRate || baseSalary);
          } else {
            accruals = workingDaysInPeriod > 0 ? (baseSalary / workingDaysInPeriod) * workedShifts : 0;
          }


          const attendancePenalties = await calculatePenalties(user._id.toString(), period, user as any, 1000);
          penalties = attendancePenalties.totalPenalty;
          latePenalties = attendancePenalties.latePenalties;
          absencePenalties = attendancePenalties.absencePenalties;
        } else {
          accruals = baseSalary;
        }


        const shiftDetails: any[] = [];
        let calculatedDailyPay = 0;

        if (salaryType === 'month' && countOfWorkdays > 0) {
          calculatedDailyPay = Math.round(baseSalary / countOfWorkdays);
        } else if (salaryType === 'shift') {
          // Если shiftRate не задан, используем baseSalary как ставку за смену
          calculatedDailyPay = shiftRate > 0 ? shiftRate : baseSalary;
        } else if (countOfWorkdays > 0) {

          calculatedDailyPay = Math.round(baseSalary / countOfWorkdays);
        }

        const periodStartDate = new Date(`${period}-01`);
        const periodEndDate = new Date(periodStartDate.getFullYear(), periodStartDate.getMonth() + 1, 0);
        periodEndDate.setHours(23, 59, 59, 999);

        const attendanceRecordsForDetails = await StaffAttendanceTracking.find({
          staffId: user._id,
          date: { $gte: periodStartDate, $lte: periodEndDate }
        }).sort({ date: 1 });

        for (const record of attendanceRecordsForDetails) {
          if (shouldCountAttendance(record)) {

            shiftDetails.push({
              date: new Date(record.date),
              earnings: calculatedDailyPay,
              fines: 0,
              net: calculatedDailyPay,
              reason: `Смена ${new Date(record.date).toLocaleDateString('ru-RU')}`
            });
          }
        }

        const calculatedTotal = accruals - penalties;

        return {
          _id: null,
          staffId: {
            _id: user._id,
            fullName: user.fullName,
            role: user.role
          },
          period: filters.period || null,
          baseSalary: baseSalary,
          bonuses: 0,
          deductions: penalties,
          total: calculatedTotal,
          status: 'draft',
          accruals: accruals,
          baseSalaryType: salaryType,
          shiftRate: shiftRate,
          penalties,
          latePenalties,
          absencePenalties,
          createdAt: new Date(),
          updatedAt: new Date(),

          paymentDate: undefined,
          history: undefined,

          workedDays: workedDays,
          workedShifts: workedShifts,
          normDays: countOfWorkdays,

          shiftDetails: shiftDetails
        };
      }
    }));
    return result.filter(item => item !== null);
  }

  async getById(id: string, userId?: string) {
    const payroll = await Payroll.findById(id)
      .populate('staffId', 'fullName role');

    if (!payroll) {
      throw new Error('Зарплата не найдена');
    }

    let staffIdStr: string | undefined;
    if (payroll.staffId) {
      if (typeof payroll.staffId === 'object' && '_id' in payroll.staffId) {
        staffIdStr = (payroll.staffId as any)._id?.toString();
      } else {
        staffIdStr = String(payroll.staffId);
      }
    }

    if (userId && staffIdStr !== userId) {
      throw new Error('Forbidden: Payroll record does not belong to user');
    }

    return payroll;
  }

  async getPayrollForUser(userId: string, period: string) {


    await this.ensurePayrollForUser(userId, period);

    const payroll = await Payroll.findOne({ staffId: userId, period })
      .populate('staffId', 'fullName role');

    if (!payroll) return null;

    const pObj = payroll.toObject();
    const startDate = new Date(`${pObj.period}-01`);
    (pObj as any).normDays = await getWorkingDaysInMonth(startDate);

    return pObj;
  }

  async create(payrollData: Partial<IPayroll>) {

    const total = (payrollData.baseSalary || 0) +
      (payrollData.bonuses || 0) -
      (payrollData.penalties || 0) -
      (payrollData.advance || 0) +
      (payrollData.accruals || 0);

    const newPayrollData = {
      ...payrollData,
      total
    };

    const payroll = new Payroll(newPayrollData);
    await payroll.save();

    const populatedPayroll = await Payroll.findById(payroll._id).populate('staffId', 'fullName role telegramChatId');

    if (!populatedPayroll) return null;

    if (populatedPayroll.staffId && (populatedPayroll.staffId as any).telegramChatId) {
      let msg = `Ваша зарплата за период ${populatedPayroll.period}:\n` +
        `Основная: ${populatedPayroll.baseSalary} тг\n` +
        `Бонусы: ${populatedPayroll.bonuses} тг\n` +
        `Вычеты: ${populatedPayroll.deductions} тг\n` +
        `Аванс: ${populatedPayroll.advance || 0} тг\n` +
        `ИТОГО: ${populatedPayroll.total} тг\n` +
        `Статус: ${(populatedPayroll.status === 'paid') ? 'Выплачено' : 'Начислено'}`;
      await sendTelegramNotification((populatedPayroll.staffId as any).telegramChatId, msg);
    }

    const pObj = populatedPayroll.toObject();
    const startDate = new Date(`${pObj.period}-01`);
    (pObj as any).normDays = await getWorkingDaysInMonth(startDate);

    return pObj;
  }

  async update(id: string, data: Partial<IPayroll>, userId: string) {
    const payroll = await Payroll.findById(id);
    if (!payroll) {
      throw new Error('Зарплата не найдена');
    }


    if (userId && payroll.staffId?.toString() !== userId) {
      throw new Error('Forbidden: Payroll record does not belong to user');
    }


    if (data.baseSalary !== undefined ||
      data.bonuses !== undefined ||
      data.deductions !== undefined ||
      data.advance !== undefined ||
      data.accruals !== undefined ||
      data.latePenalties !== undefined ||
      data.absencePenalties !== undefined ||
      data.userFines !== undefined) {

      // Рассчитываем total по той же формуле, что и в модели (pre-save hook)
      const accruals = data.accruals !== undefined ? data.accruals : payroll.accruals || 0;
      const bonuses = data.bonuses !== undefined ? data.bonuses : payroll.bonuses || 0;
      const advance = data.advance !== undefined ? data.advance : payroll.advance || 0;
      const deductions = data.deductions !== undefined ? data.deductions : payroll.deductions || 0;
      const latePenalties = data.latePenalties !== undefined ? data.latePenalties : payroll.latePenalties || 0;
      const absencePenalties = data.absencePenalties !== undefined ? data.absencePenalties : payroll.absencePenalties || 0;
      const userFines = data.userFines !== undefined ? data.userFines : payroll.userFines || 0;
      const carryOverDebt = payroll.carryOverDebt || 0; // Долг с прошлого месяца

      data.total = accruals + bonuses - latePenalties - absencePenalties - userFines - advance - deductions - carryOverDebt;
    }


    if (data.shiftDetails !== undefined) {
      payroll.shiftDetails = data.shiftDetails;
    }


    const allowedFields = [
      'period', 'baseSalary', 'baseSalaryType', 'shiftRate', 'bonuses', 'deductions', 'accruals', 'advance',
      'penalties', 'latePenalties', 'absencePenalties', 'userFines', 'workedDays',
      'workedShifts', 'fines', 'status', 'total', 'paymentDate', 'history'
    ];

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        (payroll as any)[field] = data[field];
      }
    }

    await payroll.save();

    const updatedPayroll = await Payroll.findById(payroll._id)
      .populate('staffId', 'fullName role telegramChatId');

    if (!updatedPayroll) {
      throw new Error('Зарплата не найдена');
    }

    if (updatedPayroll?.staffId && (updatedPayroll.staffId as any).telegramChatId) {
      let msg = `Ваша зарплата за период ${updatedPayroll.period}:\n` +
        `Основная: ${updatedPayroll.baseSalary} тг\n` +
        `Бонусы: ${updatedPayroll.bonuses} тг\n` +
        `Вычеты: ${updatedPayroll.deductions} тг\n` +
        `Аванс: ${updatedPayroll.advance || 0} тг\n` +
        `ИТОГО: ${updatedPayroll.total} тг\n` +
        `Статус: ${(updatedPayroll.status === 'paid') ? 'Выплачено' : 'Начислено'}`;
      await sendTelegramNotification((updatedPayroll.staffId as any).telegramChatId, msg);
    }


    const pObj = updatedPayroll.toObject();
    const startDate = new Date(`${pObj.period}-01`);
    (pObj as any).normDays = await getWorkingDaysInMonth(startDate);

    return pObj;
  }

  async delete(id: string) {
    const result = await Payroll.findByIdAndDelete(id);

    if (!result) {
      throw new Error('Зарплата не найдена');
    }

    return { message: 'Зарплата успешно удалена' };
  }

  async approve(id: string) {
    const payroll = await Payroll.findByIdAndUpdate(
      id,
      {
        status: 'approved',
        paymentDate: new Date()
      },
      { new: true }
    ).populate('staffId', 'fullName role');

    if (!payroll) {
      throw new Error('Зарплата не найдена');
    }

    return payroll;
  }

  async markAsPaid(id: string) {
    const payroll = await Payroll.findByIdAndUpdate(
      id,
      {
        status: 'paid',
        paymentDate: new Date()
      },
      { new: true }
    ).populate('staffId', 'fullName role');

    if (!payroll) {
      throw new Error('Зарплата не найдена');
    }

    return payroll;
  }

  async addFine(payrollId: string, fineData: { amount: number; reason: string; type: string; notes?: string }) {
    const payroll = await Payroll.findById(payrollId);
    if (!payroll) {
      throw new Error('Зарплата не найдена');
    }

    const fine = {
      amount: Number(fineData.amount),
      reason: fineData.reason,
      type: fineData.type,
      notes: fineData.notes,
      date: new Date(),
      createdAt: new Date()
    };

    if (!payroll.fines) {
      payroll.fines = [];
    }
    payroll.fines.push(fine);

    payroll.userFines = payroll.fines.reduce((sum, f) => sum + f.amount, 0);

    payroll.penalties = (payroll.latePenalties || 0) + (payroll.absencePenalties || 0) + payroll.userFines;

    const accruals = payroll.accruals || 0;
    const bonuses = payroll.bonuses || 0;
    const advance = payroll.advance || 0;
    const deductions = payroll.deductions || 0;
    const penalties = (payroll.latePenalties || 0) + (payroll.absencePenalties || 0) + (payroll.userFines || 0);
    const carryOverDebt = payroll.carryOverDebt || 0;

    payroll.total = accruals + bonuses - penalties - advance - deductions - carryOverDebt;

    await payroll.save();

    return Payroll.findById(payroll._id).populate('staffId', 'fullName role');
  }

  async getFines(payrollId: string) {
    const payroll = await Payroll.findById(payrollId);
    if (!payroll) {
      throw new Error('Зарплата не найдена');
    }

    return payroll.fines || [];
  }

  async removeFine(payrollId: string, fineIndex: number) {
    const payroll = await Payroll.findById(payrollId);
    if (!payroll) {
      throw new Error('Зарплата не найдена');
    }

    if (!payroll.fines || fineIndex < 0 || fineIndex >= payroll.fines.length) {
      throw new Error('Вычет не найден');
    }

    payroll.fines.splice(fineIndex, 1);

    payroll.userFines = payroll.fines.reduce((sum, f) => sum + f.amount, 0);

    payroll.penalties = (payroll.latePenalties || 0) + (payroll.absencePenalties || 0) + payroll.userFines;

    const accruals = payroll.accruals || 0;
    const bonuses = payroll.bonuses || 0;
    const advance = payroll.advance || 0;
    const deductions = payroll.deductions || 0;
    const penalties = (payroll.latePenalties || 0) + (payroll.absencePenalties || 0) + (payroll.userFines || 0);
    const carryOverDebt = payroll.carryOverDebt || 0;

    payroll.total = accruals + bonuses - penalties - advance - deductions - carryOverDebt;

    await payroll.save();

    return Payroll.findById(payroll._id).populate('staffId', 'fullName role');
  }

  async getTotalFines(payrollId: string) {
    const payroll = await Payroll.findById(payrollId);
    if (!payroll) {
      throw new Error('Зарплата не найдена');
    }

    return payroll.userFines || 0;
  }

  async ensurePayrollForUser(staffId: string, period: string) {
    try {
      console.log(`Checking payroll for user: ${staffId}, period: ${period}`);


      let existing = await Payroll.findOne({ staffId, period });

      const staff = await User.findById(staffId);
      if (!staff) {
        console.error(`User not found: ${staffId}`);
        throw new Error('User not found');
      }



      // Если нет текущей записи - ищем из предыдущих периодов
      let baseSalary = existing?.baseSalary;
      let baseSalaryType: string = existing?.baseSalaryType || 'month';
      let shiftRate = existing?.shiftRate || 0;

      if (!baseSalary) {
        const previousPayroll = await Payroll.findOne({ staffId }).sort({ period: -1 });
        baseSalary = previousPayroll?.baseSalary || 180000;
        baseSalaryType = previousPayroll?.baseSalaryType || 'month';
        shiftRate = previousPayroll?.shiftRate || 0;
      }


      // Обогащаем объект staff данными из payroll для корректного расчета штрафов
      const staffWithPayrollData = {
        ...staff.toObject(),
        baseSalary,
        baseSalaryType,
        shiftRate
      };

      const attendancePenalties = await calculatePenalties(staff._id.toString(), period, staffWithPayrollData as any);


      const newFines = attendancePenalties.attendanceRecords
        .filter((r: any) => r.lateMinutes > 0 && r.calculatedPenalty > 0)
        .map((r: any) => ({
          amount: r.calculatedPenalty || (r.lateMinutes * 50),
          reason: `Опоздание: ${Math.round(r.lateMinutes)} мин`,
          type: 'late',
          date: new Date(r.actualStart),
          createdAt: new Date()
        }));

      const latePenalties = attendancePenalties.latePenalties;
      const absencePenalties = attendancePenalties.absencePenalties;
      const totalPenalties = latePenalties + absencePenalties;

      let accruals = 0;
      let workedDays = 0;
      let workedShifts = 0;

      const startDate = new Date(`${period}-01T00:00:00+05:00`);
      let workDaysInMonth = await getWorkingDaysInMonth(startDate);

      if (workDaysInMonth <= 0) {
        const year = startDate.getFullYear();
        const month = startDate.getMonth();
        const lastDay = new Date(year, month + 1, 0).getDate();
        for (let d = 1; d <= lastDay; d++) {
          const dayOfWeek = new Date(year, month, d).getDay();
          if (dayOfWeek !== 0 && dayOfWeek !== 6) workDaysInMonth++;
        }
      }

      const attendedRecords = attendancePenalties.attendanceRecords.filter((r: any) => shouldCountAttendance(r));


      if (baseSalaryType === 'month' || !baseSalaryType) {
        workedShifts = attendedRecords.length;
        workedDays = workedShifts;
        accruals = Math.round((baseSalary / workDaysInMonth) * workedShifts);
      } else if (baseSalaryType === 'shift') {
        workedShifts = attendedRecords.length;
        // Если shiftRate не задан, используем baseSalary как ставку за смену
        const effectiveShiftRate = shiftRate > 0 ? shiftRate : baseSalary;
        accruals = workedShifts * effectiveShiftRate;
      } else {

        workedShifts = attendedRecords.length;
        workedDays = workedShifts;
        accruals = Math.round((baseSalary / workDaysInMonth) * workedShifts);
      }


      const shiftDetails: any[] = [];
      let calculatedDailyPay = 0;


      if ((baseSalaryType === 'month' || !baseSalaryType) && workDaysInMonth > 0) {
        calculatedDailyPay = Math.round(baseSalary / workDaysInMonth);
      } else if (baseSalaryType === 'shift') {
        // Если shiftRate не задан, используем baseSalary как ставку за смену
        calculatedDailyPay = shiftRate > 0 ? shiftRate : baseSalary;
      } else if (workDaysInMonth > 0) {

        calculatedDailyPay = Math.round(baseSalary / workDaysInMonth);
      }

      for (const record of attendedRecords) {

        shiftDetails.push({
          date: new Date(record.actualStart),
          earnings: calculatedDailyPay,
          fines: 0,
          net: calculatedDailyPay,
          reason: `Смена ${new Date(record.actualStart).toLocaleDateString('ru-RU')}`
        });
      }


      // Учитываем долг из user.debt
      const userDebt = staff.debt || 0;
      const total = accruals - totalPenalties;

      if (existing) {


        if (existing.status === 'draft' || existing.status === 'generated') {
          existing.accruals = accruals;
          existing.penalties = totalPenalties;


          const existingManualFines = existing.fines?.filter(f => f.type === 'manual') || [];
          existing.fines = [...existingManualFines, ...newFines];

          existing.latePenalties = latePenalties;
          existing.absencePenalties = absencePenalties;
          existing.workedDays = workedDays;
          existing.workedShifts = workedShifts;
          existing.shiftDetails = shiftDetails;
          existing.carryOverDebt = userDebt; // Долг из user.debt
          existing.total = total - userDebt; // Учитываем долг

          existing.baseSalary = baseSalary;
          existing.baseSalaryType = baseSalaryType as any;

          await existing.save();
          return { message: 'Payroll updated', created: 0 };
        }
        return { message: 'Payroll exists (locked)', created: 0 };
      }

      const newPayroll = new Payroll({
        staffId: staff._id,
        period: period,
        baseSalary: baseSalary,
        baseSalaryType: baseSalaryType,
        shiftRate: shiftRate,
        bonuses: 0,
        deductions: 0,
        accruals: accruals,
        penalties: totalPenalties,
        fines: newFines,
        latePenalties: latePenalties,
        absencePenalties: absencePenalties,
        userFines: 0,
        workedDays: workedDays,
        workedShifts: workedShifts,
        shiftDetails: shiftDetails,
        carryOverDebt: userDebt, // Долг из user.debt
        total: total - userDebt, // Учитываем долг
        status: 'draft',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      await newPayroll.save();
      console.log(`Created payroll for user: ${staff.fullName}`);
      return { message: 'Payroll created', created: 1 };

    } catch (err) {
      console.error('Error ensuring payroll for user:', err);
      throw err;
    }
  }

  async ensurePayrollRecordsForPeriod(period: string) {
    try {
      console.log(`Проверка и формирование расчетных листов для периода: ${period}`);

      const excludedRoles = ['tenant', 'speech_therapist', 'admin'];
      const allStaff = await User.find({
        role: { $nin: excludedRoles },
        active: true
      });

      console.log(`Найдено ${allStaff.length} активных сотрудников.`);

      let created = 0;
      let updated = 0;

      for (const staff of allStaff) {
        try {
          const result = await this.ensurePayrollForUser(staff._id.toString(), period);
          if (result.created) created++;
          else updated++;
        } catch (err) {
          console.error(`Ошибка при обработке сотрудника ${staff.fullName}:`, err);
        }
      }

      return {
        message: `Обработка завершена: создано ${created}, обновлено ${updated}`,
        created,
        totalStaff: allStaff.length
      };
    } catch (error) {
      console.error('Ошибка при массовой проверке расчетных листов:', error);
      throw new Error(`Ошибка при массовой проверке расчетных листов: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Расчёт долга для отдельного сотрудника
   * Если итоговая сумма к выплате отрицательная, разница записывается в user.debt
   */
  async calculateDebtForUser(staffId: string, period: string) {
    const payroll = await Payroll.findOne({ staffId, period });
    if (!payroll) {
      throw new Error('Расчётный лист не найден');
    }

    // Если долг уже рассчитан - пропускаем
    if (payroll.carryOverDebtCalculated) {
      return {
        staffId,
        period,
        debt: 0,
        message: 'Долг уже рассчитан для этого периода'
      };
    }

    const user = await User.findById(staffId);
    if (!user) {
      throw new Error('Пользователь не найден');
    }

    const accruals = payroll.accruals || 0;
    const bonuses = payroll.bonuses || 0;
    const penalties = (payroll.latePenalties || 0) + (payroll.absencePenalties || 0) + (payroll.userFines || 0);
    const deductions = payroll.deductions || 0;
    const advance = payroll.advance || 0;
    const previousDebt = user.debt || 0; // Долг с user, а не с payroll

    // Рассчитываем сумму, которая должна быть к выплате (учитывая долг из user.debt)
    const totalBeforeDebt = accruals + bonuses - penalties - deductions - advance - previousDebt;

    // Если итоговая сумма отрицательная, это означает, что сотрудник должен денег
    // В этом случае, нужно записать эту сумму как долг в user.debt
    const newDebt = Math.max(0, -totalBeforeDebt); // Положительное значение долга

    // Обновляем user.debt
    user.debt = newDebt;
    await user.save();
    console.log(`Долг ${newDebt} тг записан для сотрудника ${staffId} (было: ${previousDebt} тг)`);

    // Обновляем carryOverDebt в текущем payroll для отображения
    payroll.carryOverDebt = previousDebt;

    // Обновляем total с учётом долга
    payroll.total = Math.max(0, totalBeforeDebt); // К выплате не может быть отрицательной

    // Отмечаем что долг за этот период рассчитан
    payroll.carryOverDebtCalculated = true;
    await payroll.save();

    return {
      staffId,
      period,
      accruals,
      advance,
      previousDebt,
      totalBeforeDebt,
      debt: newDebt,
      message: newDebt > 0 ? `Новый долг ${newDebt} тг записан в профиль сотрудника` : 'Долга нет'
    };
  }

  /**
   * Расчёт долга для всех сотрудников за период
   * Вызывается по команде директора
   */
  async calculateDebtForPeriod(period: string) {
    console.log(`Расчёт долга для всех сотрудников за период: ${period}`);

    const payrolls = await Payroll.find({
      period,
      carryOverDebtCalculated: { $ne: true }
    }).populate('staffId', 'fullName');

    let processed = 0;
    let totalDebt = 0;
    const details: any[] = [];

    for (const payroll of payrolls) {
      try {
        const staffIdStr = payroll.staffId?._id?.toString() || payroll.staffId?.toString();
        if (!staffIdStr) continue;

        const result = await this.calculateDebtForUser(staffIdStr, period);
        processed++;
        totalDebt += result.debt;

        if (result.debt > 0) {
          details.push({
            staffName: (payroll.staffId as any)?.fullName || 'Неизвестно',
            debt: result.debt
          });
        }
      } catch (err) {
        console.error(`Ошибка расчёта долга для payroll ${payroll._id}:`, err);
      }
    }

    return {
      message: `Обработано ${processed} расчётных листов. Общий долг: ${totalDebt} тг`,
      processed,
      totalDebt,
      details
    };
  }

  /**
   * Получить долг с предыдущего месяца для сотрудника
   */
  async getCarryOverDebt(staffId: string, period: string): Promise<number> {
    // Рассчитываем предыдущий период
    const [year, month] = period.split('-').map(Number);
    const prevDate = new Date(year, month - 1 - 1, 1); // Переходим к предыдущему месяцу (месяцы в Date 0-based)
    const prevPeriod = prevDate.toISOString().slice(0, 7);

    const prevPayroll = await Payroll.findOne({ staffId, period: prevPeriod });

    if (!prevPayroll || !prevPayroll.carryOverDebtCalculated) {
      return 0;
    }

    const accruals = prevPayroll.accruals || 0;
    const bonuses = prevPayroll.bonuses || 0;
    const penalties = (prevPayroll.latePenalties || 0) + (prevPayroll.absencePenalties || 0) + (prevPayroll.userFines || 0);
    const advance = prevPayroll.advance || 0;

    const netPay = accruals + bonuses - penalties;
    return Math.max(0, advance - netPay);
  }
}
