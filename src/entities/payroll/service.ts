import { IPayroll } from './model';
import { getPayrollModel, getUserModel, getStaffAttendanceTrackingModel } from '../../config/models';
import { sendTelegramNotification } from '../../utils/telegramNotify';
import {
  calculatePenalties,
  getWorkingDaysInMonth,
  shouldCountAttendance
} from '../../services/payrollAutomationService';

export class PayrollService {
  async getPayrollBreakdown(id: string) {
    return getPayrollModel().findById(id).populate('staffId', 'fullName role');
  }
  async getAll(filters: { staffId?: string, period?: string, status?: string }) {
    const filter: any = {};

    if (filters.staffId) filter.staffId = filters.staffId;
    const targetPeriod = filters.period || new Date().toISOString().slice(0, 7);
    if (targetPeriod) filter.period = targetPeriod;
    if (filters.status) filter.status = filters.status;

    return getPayrollModel().find(filter)
      .populate('staffId', 'fullName role')
      .sort({ period: -1 });
  }

  async getAllWithUsers(filters: { staffId?: string, period?: string, status?: string }) {
    const userFilter: any = {};
    if (filters.status) userFilter.status = filters.status;
    const period = filters.period || new Date().toISOString().slice(0, 7);


    if (filters.staffId) {
      userFilter._id = filters.staffId;
    }



    const users = await getUserModel().find(userFilter)
      .select('_id fullName role iin uniqNumber')
      .sort({ fullName: 1 });


    let payrollRecords: any[] = [];
    const payrollFilter: any = { period };
    if (filters.staffId) {
      payrollFilter.staffId = filters.staffId;
    }
    payrollRecords = await getPayrollModel().find(payrollFilter)
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

        if (payroll.total === 0 && (payroll.accruals > 0 || payroll.workedShifts > 0)) {
          payroll.total = Math.max(0, (payroll.accruals || 0) - (payroll.penalties || 0));
        }
        return payroll;
      } else {


        const baseSalary = 180000;
        const salaryType: string = 'month';
        const shiftRate = 0;

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
          const attendanceRecords = await getStaffAttendanceTrackingModel().find({
            staffId: user._id,
            date: { $gte: startDate, $lte: endDate }
          });
          countOfWorkdays = workingDaysInPeriod;
          const countedRecords = attendanceRecords.filter(rec => shouldCountAttendance(rec));
          workedShifts = countedRecords.length;
          workedDays = countedRecords.length;


          accruals = workingDaysInPeriod > 0 ? (baseSalary / workingDaysInPeriod) * workedShifts : 0;

          const attendancePenalties = await calculatePenalties(user._id.toString(), period, user as any);
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
          calculatedDailyPay = shiftRate;
        } else if (countOfWorkdays > 0) {

          calculatedDailyPay = Math.round(baseSalary / countOfWorkdays);
        }

        const periodStartDate = new Date(`${period}-01`);
        const periodEndDate = new Date(periodStartDate.getFullYear(), periodStartDate.getMonth() + 1, 0);
        periodEndDate.setHours(23, 59, 59, 999);

        const attendanceRecordsForDetails = await getStaffAttendanceTrackingModel().find({
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

        const calculatedTotal = Math.max(0, accruals - penalties);

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
          latePenaltyRate: 13,
          absencePenalties,
          createdAt: new Date(),
          updatedAt: new Date(),

          paymentDate: undefined,
          history: undefined,

          workedDays: workedDays,
          workedShifts: workedShifts,

          shiftDetails: shiftDetails
        };
      }
    }));
    return result.filter(item => item !== null);
  }

  async getById(id: string, userId?: string) {
    const payroll = await getPayrollModel().findById(id)
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


    const payroll = await getPayrollModel().findOne({ staffId: userId, period })
      .populate('staffId', 'fullName role');

    return payroll;
  }

  async create(payrollData: Partial<IPayroll>) {

    const total = Math.max(0, (payrollData.baseSalary || 0) +
      (payrollData.bonuses || 0) -
      (payrollData.penalties || 0) -
      (payrollData.advance || 0) +
      (payrollData.accruals || 0));

    const newPayrollData = {
      ...payrollData,
      total
    };

    const payroll = new (getPayrollModel())(newPayrollData);
    await payroll.save();

    const populatedPayroll = await getPayrollModel().findById(payroll._id).populate('staffId', 'fullName role telegramChatId');

    if (populatedPayroll?.staffId && (populatedPayroll.staffId as any).telegramChatId) {
      let msg = `Ваша зарплата за период ${populatedPayroll.period}:\n` +
        `Основная: ${populatedPayroll.baseSalary} тг\n` +
        `Бонусы: ${populatedPayroll.bonuses} тг\n` +
        `Вычеты: ${populatedPayroll.deductions} тг\n` +
        `Аванс: ${populatedPayroll.advance || 0} тг\n` +
        `ИТОГО: ${populatedPayroll.total} тг\n` +
        `Статус: ${(populatedPayroll.status === 'paid') ? 'Выплачено' : 'Начислено'}`;
      await sendTelegramNotification((populatedPayroll.staffId as any).telegramChatId, msg);
    }
    return populatedPayroll;
  }

  async update(id: string, data: Partial<IPayroll>, userId: string) {
    const payroll = await getPayrollModel().findById(id);
    if (!payroll) {
      throw new Error('Зарплата не найдена');
    }


    if (payroll.staffId?.toString() !== userId) {
      throw new Error('Forbidden: Payroll record does not belong to user');
    }


    if (data.baseSalary !== undefined ||
      data.bonuses !== undefined ||
      data.deductions !== undefined ||
      data.advance !== undefined) {

      const baseSalary = data.baseSalary !== undefined ? data.baseSalary : payroll.baseSalary;
      const bonuses = data.bonuses !== undefined ? data.bonuses : payroll.bonuses;
      const advance = data.advance !== undefined ? data.advance : payroll.advance || 0;

      let currentPenalties = payroll.penalties || 0;


      if (data.latePenaltyRate !== undefined && data.latePenaltyRate !== payroll.latePenaltyRate) {

        if (payroll.staffId && payroll.period) {
          try {
            const staffId = typeof payroll.staffId === 'object' ? (payroll.staffId as any)._id : payroll.staffId;
            const staff = await getUserModel().findById(staffId);

            if (staff) {
              const safeRate = (data.latePenaltyRate !== undefined) ? Number(data.latePenaltyRate) : 13;

              const recalc = await calculatePenalties(staffId.toString(), payroll.period, staff as any, safeRate);


              payroll.latePenalties = recalc.latePenalties;
              payroll.latePenaltyRate = safeRate;
              payroll.absencePenalties = recalc.absencePenalties;


              const userFines = payroll.userFines || 0;
              payroll.penalties = (payroll.latePenalties || 0) + (payroll.absencePenalties || 0) + userFines;


              data.latePenalties = payroll.latePenalties;
              data.latePenaltyRate = payroll.latePenaltyRate;
              data.absencePenalties = payroll.absencePenalties;
              data.penalties = payroll.penalties;
            }
          } catch (e) {
            console.error('Error recalculating penalties on rate change:', e);
          }
        }
      } else if (data.penalties !== undefined) {
        currentPenalties = data.penalties;
      }

      data.total = Math.max(0, baseSalary + bonuses - currentPenalties - advance);
    }


    if (data.shiftDetails !== undefined) {
      payroll.shiftDetails = data.shiftDetails;
    }


    const allowedFields = [
      'period', 'baseSalary', 'baseSalaryType', 'shiftRate', 'bonuses', 'deductions', 'accruals',
      'penalties', 'latePenalties', 'latePenaltyRate', 'absencePenalties', 'userFines', 'workedDays',
      'workedShifts', 'fines', 'status', 'total', 'paymentDate', 'history'
    ];

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        (payroll as any)[field] = data[field];
      }
    }

    await payroll.save();

    const updatedPayroll = await getPayrollModel().findById(payroll._id)
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
    return updatedPayroll;
  }

  async delete(id: string) {
    const result = await getPayrollModel().findByIdAndDelete(id);

    if (!result) {
      throw new Error('Зарплата не найдена');
    }

    return { message: 'Зарплата успешно удалена' };
  }

  async approve(id: string) {
    const payroll = await getPayrollModel().findByIdAndUpdate(
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
    const payroll = await getPayrollModel().findByIdAndUpdate(
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
    const payroll = await getPayrollModel().findById(payrollId);
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

    payroll.total = Math.max(0, (payroll.accruals || 0) - (payroll.penalties || 0) - (payroll.advance || 0) + (payroll.bonuses || 0));

    await payroll.save();

    return getPayrollModel().findById(payroll._id).populate('staffId', 'fullName role');
  }

  async getFines(payrollId: string) {
    const payroll = await getPayrollModel().findById(payrollId);
    if (!payroll) {
      throw new Error('Зарплата не найдена');
    }

    return payroll.fines || [];
  }

  async removeFine(payrollId: string, fineIndex: number) {
    const payroll = await getPayrollModel().findById(payrollId);
    if (!payroll) {
      throw new Error('Зарплата не найдена');
    }

    if (!payroll.fines || fineIndex < 0 || fineIndex >= payroll.fines.length) {
      throw new Error('Вычет не найден');
    }




    payroll.userFines = payroll.fines.reduce((sum, f) => sum + f.amount, 0);


    payroll.penalties = (payroll.latePenalties || 0) + (payroll.absencePenalties || 0) + payroll.userFines;


    payroll.total = Math.max(0, (payroll.accruals || 0) - (payroll.penalties || 0) - (payroll.advance || 0) + (payroll.bonuses || 0));

    await payroll.save();

    return getPayrollModel().findById(payroll._id).populate('staffId', 'fullName role');
  }

  async getTotalFines(payrollId: string) {
    const payroll = await getPayrollModel().findById(payrollId);
    if (!payroll) {
      throw new Error('Зарплата не найдена');
    }

    return payroll.userFines || 0;
  }

  async ensurePayrollForUser(staffId: string, period: string) {
    try {
      console.log(`Checking payroll for user: ${staffId}, period: ${period}`);


      let existing = await getPayrollModel().findOne({ staffId, period });

      const staff = await getUserModel().findById(staffId);
      if (!staff) {
        console.error(`User not found: ${staffId}`);
        throw new Error('User not found');
      }



      const baseSalary = existing?.baseSalary || 180000;
      const baseSalaryType: string = existing?.baseSalaryType || 'month';
      const shiftRate = existing?.shiftRate || 0;



      const attendancePenalties = await calculatePenalties(staff._id.toString(), period, staff as any, 13);


      const newFines = attendancePenalties.attendanceRecords
        .filter((r: any) => r.lateMinutes > 0)
        .map((r: any) => ({
          amount: r.lateMinutes * 13,
          reason: `Опоздание: ${r.lateMinutes} мин`,
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

      const startDate = new Date(`${period}-01`);
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
        accruals = workedShifts * shiftRate;
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
        calculatedDailyPay = shiftRate;
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


      const total = Math.max(0, accruals - totalPenalties);

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
          existing.total = total;

          existing.baseSalary = baseSalary;
          existing.baseSalaryType = 'month';

          await existing.save();
          return { message: 'Payroll updated', created: 0 };
        }
        return { message: 'Payroll exists (locked)', created: 0 };
      }

      const newPayroll = new (getPayrollModel())({
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
        latePenaltyRate: 13,
        absencePenalties: absencePenalties,
        userFines: 0,
        workedDays: workedDays,
        workedShifts: workedShifts,
        shiftDetails: shiftDetails,
        total: total,
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
      console.log(`Проверка наличия расчетных листов для периода: ${period}`);

      const allStaff = await getUserModel().find({
        role: { $ne: 'admin' },
        active: true
      });


      const existingPayrolls = await getPayrollModel().find({ period });
      const existingStaffIds = existingPayrolls.map(p => p.staffId?.toString());


      const staffWithoutPayroll = allStaff.filter(staff =>
        !existingStaffIds.includes(staff._id.toString())
      );

      console.log(`Найдено ${staffWithoutPayroll.length} сотрудников без расчетных листов для периода ${period}`);

      if (staffWithoutPayroll.length === 0) {
        console.log(`Все сотрудники имеют расчетные листы для периода ${period}`);
        return {
          message: `Все сотрудники имеют расчетные листы для периода ${period}`,
          created: 0,
          totalStaff: allStaff.length
        };
      }


      const createdRecords = [];
      for (const staff of staffWithoutPayroll) {

        const baseSalary = 180000;
        const baseSalaryType: string = 'month';
        const shiftRate = 0;




        const attendancePenalties = await calculatePenalties(staff._id.toString(), period, staff as any, 13);



        const newFines = attendancePenalties.attendanceRecords
          .filter((r: any) => r.lateMinutes > 0)
          .map((r: any) => ({
            amount: r.lateMinutes * 13,
            reason: `Опоздание: ${r.lateMinutes} мин`,
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


        const startDate = new Date(`${period}-01`);
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
          accruals = workedShifts * shiftRate;
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
          calculatedDailyPay = shiftRate;
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

        const total = Math.max(0, accruals - totalPenalties);


        const newPayroll = new (getPayrollModel())({
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
          latePenaltyRate: 13,
          absencePenalties: absencePenalties,
          userFines: 0,
          workedDays: workedDays,
          workedShifts: workedShifts,
          shiftDetails: shiftDetails,
          total: total,
          status: 'draft',
          createdAt: new Date(),
          updatedAt: new Date()
        });

        await newPayroll.save();
        createdRecords.push(newPayroll);

        console.log(`Создан расчетный лист для сотрудника: ${staff.fullName}, ID: ${staff._id}`);
      }

      console.log(`Создано ${createdRecords.length} новых расчетных листов для периода ${period}`);

      return {
        message: `Создано ${createdRecords.length} новых расчетных листов для периода ${period}`,
        created: createdRecords.length,
        totalStaff: allStaff.length,
        staffWithoutPayroll: staffWithoutPayroll.map(s => ({ id: s._id, name: s.fullName }))
      };
    } catch (error) {
      console.error('Ошибка при проверке и создании расчетных листов:', error);
      let errorMessage = 'Неизвестная ошибка';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      throw new Error(`Ошибка при проверке и создании расчетных листов: ${errorMessage}`);
    }
  }
}