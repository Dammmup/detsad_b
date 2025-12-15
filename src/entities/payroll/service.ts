import Payroll from './model';
import { IPayroll } from './model';
import User from '../users/model';
import { IUser } from '../users/model';
import { sendTelegramNotification } from '../../utils/telegramNotify';
import StaffAttendanceTracking from '../staffAttendanceTracking/model';
import { calculatePenalties, getWorkingDaysInMonth, shouldCountAttendance } from '../../services/payrollAutomationService';

export class PayrollService {
  async getAll(filters: { staffId?: string, period?: string, status?: string }) {
    const filter: any = {};

    if (filters.staffId) filter.staffId = filters.staffId;
    const targetPeriod = filters.period || new Date().toISOString().slice(0, 7);
    if (targetPeriod) filter.period = targetPeriod;
    if (filters.status) filter.status = filters.status;

    const payrolls = await Payroll().find(filter)
      .populate('staffId', 'fullName role')
      .sort({ period: -1 });

    return payrolls;
  }

  async getAllWithUsers(filters: { staffId?: string, period?: string, status?: string }) {
    const filter: any = {};

    // В этом методе мы не фильтруем пользователей по staffId, так как staffId - это поле в модели Payroll()
    // Вместо этого мы получаем всех пользователей и затем фильтруем по наличию записей в Payroll()
    if (filters.status) filter.status = filters.status;
    const period = filters.period || new Date().toISOString().slice(0, 7);

    // Получаем всех пользователей, подходящих под фильтр
    const users = await User().find(filter).select('_id fullName role iin uniqNumber payroll salary baseSalary salaryType shiftRate penaltyType penaltyAmount').sort({ fullName: 1 });

    // Получаем все записи зарплат для указанного периода, если он задан
    let payrollRecords: any[] = [];
    if (period) {
      payrollRecords = await Payroll().find({ period })
        .populate('staffId', 'fullName role')
        .sort({ createdAt: -1 });
    }

    // Создаем мапу для быстрого поиска зарплаты по staffId
    const payrollMap = new Map();
    payrollRecords.forEach(record => {
      if (record.staffId && record.staffId._id) {
        payrollMap.set(record.staffId._id.toString(), record);
      }
    });

    // Объединяем данные пользователей с данными зарплат
    const result = await Promise.all(users.map(async (user) => {
      const payroll = user._id ? payrollMap.get((user._id as any).toString()) : null;

      if (payroll) {
        // Если есть запись в коллекции зарплат, возвращаем её
        return payroll;
      } else {
        // Если нет записи в коллекции зарплат, создаем виртуальную запись на основе данных пользователя
        const baseSalary = Number((user as any).baseSalary ?? (user as any).salary ?? 0);
        let workedDays = 0;
        let workedShifts = 0;
        let accruals = 0;
        let penalties = 0;
        let latePenalties = 0;
        let absencePenalties = 0;

        if (period) {
          const startDate = new Date(`${period}-01`);
          const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
          const attendanceRecords = await StaffAttendanceTracking().find({
            staffId: user._id,
            date: { $gte: startDate, $lte: endDate }
          });

          const countedRecords = attendanceRecords.filter(rec => shouldCountAttendance(rec));
          workedShifts = countedRecords.length;
          workedDays = countedRecords.length; // одна смена — один рабочий день

          const workingDaysInPeriod = await getWorkingDaysInMonth(startDate);
          accruals = workingDaysInPeriod > 0 ? (baseSalary / workingDaysInPeriod) * workedShifts : 0;

          const attendancePenalties = await calculatePenalties(user._id.toString(), period, user as any);
          penalties = attendancePenalties.totalPenalty;
          latePenalties = attendancePenalties.latePenalties;
          absencePenalties = attendancePenalties.absencePenalties;
        } else {
          accruals = baseSalary;
        }

        const calculatedTotal = accruals - penalties;

        return {
          _id: null, // Отсутствие ID указывает на то, что записи в базе нет
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
          baseSalaryType: (user as any).salaryType || 'month',
          shiftRate: (user as any).shiftRate || 0,
          penalties,
          latePenalties,
          latePenaltyRate: 13, // Default fixed rate for virtual record
          absencePenalties,
          createdAt: new Date(),
          updatedAt: new Date(),
          // Поля, которые не существуют в виртуальной записи
          paymentDate: undefined,
          history: undefined,
          // Добавляем поля для отработанных дней/смен
          workedDays: workedDays,
          workedShifts: workedShifts
        };
      }
    }));
    return result.filter(item => item !== null); // Фильтруем null значения, если они появились
  }

  async getById(id: string) {
    const payroll = await Payroll().findById(id)
      .populate('staffId', 'fullName role');

    if (!payroll) {
      throw new Error('Зарплата не найдена');
    }

    return payroll;
  }

  async create(payrollData: Partial<IPayroll>) {
    // Вычисляем общую сумму
    const total = Math.max(0, (payrollData.baseSalary || 0) +
      (payrollData.bonuses || 0) -
      (payrollData.deductions || 0) -
      (payrollData.advance || 0));

    const newPayrollData = {
      ...payrollData,
      total
    };

    const payroll = new (Payroll())(newPayrollData);
    await payroll.save();

    const populatedPayroll = await Payroll().findById(payroll._id).populate('staffId', 'fullName role telegramChatId');
    // Уведомление в Telegram
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

  async update(id: string, data: Partial<IPayroll>) {
    // При обновлении пересчитываем общую сумму
    if (data.baseSalary !== undefined ||
      data.bonuses !== undefined ||
      data.deductions !== undefined ||
      data.advance !== undefined) {

      const payroll = await Payroll().findById(id);
      if (!payroll) {
        throw new Error('Зарплата не найдена');
      }

      const baseSalary = data.baseSalary !== undefined ? data.baseSalary : payroll.baseSalary;
      const bonuses = data.bonuses !== undefined ? data.bonuses : payroll.bonuses;
      const deductions = data.deductions !== undefined ? data.deductions : payroll.deductions;
      const advance = data.advance !== undefined ? data.advance : payroll.advance || 0;

      let currentPenalties = payroll.penalties || 0;
      // Handle latePenaltyRate update
      // The instruction replaces the entire block, so I'll integrate it carefully.
      if (data.latePenaltyRate !== undefined && data.latePenaltyRate !== payroll.latePenaltyRate) {
        // Recalculate late penalties with new rate
        if (payroll.staffId && payroll.period) {
          try {
            const staffId = typeof payroll.staffId === 'object' ? (payroll.staffId as any)._id : payroll.staffId;
            const staff = await User().findById(staffId);

            if (staff) {
              const safeRate = (data.latePenaltyRate !== undefined) ? Number(data.latePenaltyRate) : 13;

              const recalc = await calculatePenalties(staffId.toString(), payroll.period, staff as any, safeRate);

              // Apply new calculations
              payroll.latePenalties = recalc.latePenalties;
              payroll.latePenaltyRate = safeRate;
              payroll.absencePenalties = recalc.absencePenalties;

              // Re-sum total penalties (late + absence + userFines)
              const userFines = payroll.userFines || 0;
              payroll.penalties = (payroll.latePenalties || 0) + (payroll.absencePenalties || 0) + userFines;

              // Update data object to reflect changes for the final update
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

    const updatedPayroll = await Payroll().findByIdAndUpdate(
      id,
      data,
      { new: true }
    ).populate('staffId', 'fullName role telegramChatId');

    if (!updatedPayroll) {
      throw new Error('Зарплата не найдена');
    }
    // Уведомление в Telegram
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
    const result = await Payroll().findByIdAndDelete(id);

    if (!result) {
      throw new Error('Зарплата не найдена');
    }

    return { message: 'Зарплата успешно удалена' };
  }

  async approve(id: string) {
    const payroll = await Payroll().findByIdAndUpdate(
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
    const payroll = await Payroll().findByIdAndUpdate(
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

  /**
   * Добавляет штраф к записи зарплаты
   */
  async addFine(payrollId: string, fineData: { amount: number; reason: string; type: string; notes?: string }) {
    const payroll = await Payroll().findById(payrollId);
    if (!payroll) {
      throw new Error('Зарплата не найдена');
    }

    // Создаем новый штраф
    const fine = {
      amount: Number(fineData.amount),
      reason: fineData.reason,
      type: fineData.type,
      notes: fineData.notes,
      date: new Date(),
      createdAt: new Date()
    };

    // Добавляем штраф в массив
    if (!payroll.fines) {
      payroll.fines = [];
    }
    payroll.fines.push(fine);

    // Обновляем общую сумму штрафов
    const totalFines = payroll.fines.reduce((sum, f) => sum + f.amount, 0);
    payroll.userFines = totalFines;

    // Recalculate total penalties (sum of components)
    // This ensures consistency even if previous value was drifted
    payroll.penalties = (payroll.latePenalties || 0) + (payroll.absencePenalties || 0) + payroll.userFines;

    payroll.total = Math.max(0, (payroll.accruals || 0) - (payroll.penalties || 0) - (payroll.advance || 0) + (payroll.bonuses || 0));

    await payroll.save();

    const populatedPayroll = await Payroll().findById(payroll._id).populate('staffId', 'fullName role');
    return populatedPayroll;
  }

  /**
   * Получает все штрафы для записи зарплаты
   */
  async getFines(payrollId: string) {
    const payroll = await Payroll().findById(payrollId);
    if (!payroll) {
      throw new Error('Зарплата не найдена');
    }

    return payroll.fines || [];
  }

  /**
   * Удаляет штраф из записи зарплаты
   */
  async removeFine(payrollId: string, fineIndex: number) {
    const payroll = await Payroll().findById(payrollId);
    if (!payroll) {
      throw new Error('Зарплата не найдена');
    }

    if (!payroll.fines || fineIndex < 0 || fineIndex >= payroll.fines.length) {
      throw new Error('Штраф не найден');
    }

    // Получаем сумму удаляемого штрафа
    const removedFine = payroll.fines.splice(fineIndex, 1)[0];
    const fineAmount = removedFine.amount;

    // Обновляем общую сумму штрафов
    const totalFines = payroll.fines.reduce((sum, f) => sum + f.amount, 0);
    payroll.userFines = totalFines;

    // Recalculate total penalties (sum of components)
    payroll.penalties = (payroll.latePenalties || 0) + (payroll.absencePenalties || 0) + payroll.userFines;

    // Recalculate total (include advance/bonuses if they exist)
    payroll.total = Math.max(0, (payroll.accruals || 0) - (payroll.penalties || 0) - (payroll.advance || 0) + (payroll.bonuses || 0));

    await payroll.save();

    const populatedPayroll = await Payroll().findById(payroll._id).populate('staffId', 'fullName role');
    return populatedPayroll;
  }

  /**
   * Получает общую сумму штрафов для записи зарплаты
   */
  async getTotalFines(payrollId: string) {
    const payroll = await Payroll().findById(payrollId);
    if (!payroll) {
      throw new Error('Зарплата не найдена');
    }

    return payroll.userFines || 0;
  }

  /**
   * Проверяет и генерирует расчетный лист для конкретного сотрудника
   */
  async ensurePayrollForUser(staffId: string, period: string) {
    try {
      console.log(`Checking payroll for user: ${staffId}, period: ${period}`);

      // Check if exists using model factory
      const existing = await Payroll().findOne({ staffId, period });
      if (existing) {
        return { message: 'Payroll exists', created: 0 };
      }

      const staff = await User().findById(staffId);
      if (!staff) {
        console.error(`User not found: ${staffId}`);
        throw new Error('User not found');
      }

      // Calculation Logic (Reused from ensurePayrollRecordsForPeriod)
      const baseSalaryRaw = Number((staff as any).baseSalary);
      const baseSalary = baseSalaryRaw > 0 ? baseSalaryRaw : 180000;

      const baseSalaryType: string = ((staff as any).salaryType as string) || 'month';
      const shiftRate = Number((staff as any).shiftRate || 0);

      // Calculate penalties immediately so they aren't 0
      // Use rate 13
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
      const workDaysInMonth = await getWorkingDaysInMonth(startDate);
      const attendedRecords = attendancePenalties.attendanceRecords.filter((r: any) => shouldCountAttendance(r));

      if (baseSalaryType === 'month') {
        workedShifts = attendedRecords.length;
        workedDays = workedShifts;
        if (workDaysInMonth > 0) {
          accruals = Math.round((baseSalary / workDaysInMonth) * workedShifts);
        }
      } else if (baseSalaryType === 'shift') {
        workedShifts = attendedRecords.length;
        accruals = workedShifts * shiftRate;
      } else {
        accruals = baseSalary;
      }

      const total = Math.max(0, accruals - totalPenalties);

      const newPayroll = new (Payroll())({
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

  /**
   * Проверяет наличие расчетных листов для указанного периода и генерирует их, если они отсутствуют
   */
  async ensurePayrollRecordsForPeriod(period: string) {
    try {
      console.log(`Проверка наличия расчетных листов для периода: ${period}`);

      // Получаем всех активных сотрудников (кроме админов)
      const allStaff = await User().find({
        role: { $ne: 'admin' },
        active: true
      });

      // Получаем уже существующие записи для этого периода
      const existingPayrolls = await Payroll().find({ period });
      const existingStaffIds = existingPayrolls.map(p => p.staffId?.toString());

      // Находим сотрудников, для которых нет записей в этом периоде
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

      // Создаем новые записи для сотрудников, у которых их нет
      const createdRecords = [];
      for (const staff of staffWithoutPayroll) {
        // Рассчитываем базовые параметры для нового расчетного листа
        const baseSalaryRaw = Number((staff as any).baseSalary);
        const baseSalary = baseSalaryRaw > 0 ? baseSalaryRaw : 180000

        const baseSalaryType: string = ((staff as any).salaryType as string) || 'month';
        const shiftRate = Number((staff as any).shiftRate || 0);

        // Calculate penalties immediately so they aren't 0

        // Use rate 13
        const attendancePenalties = await calculatePenalties(staff._id.toString(), period, staff as any, 13);

        // Generate detailed fines array for the new record
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

        // Calculate Accruals (Simplified Logic similar to autoCalculate)
        let accruals = 0;
        let workedDays = 0;
        let workedShifts = 0;

        // Fetch working days
        const startDate = new Date(`${period}-01`);
        const workDaysInMonth = await getWorkingDaysInMonth(startDate);
        const attendedRecords = attendancePenalties.attendanceRecords.filter((r: any) => shouldCountAttendance(r));

        if (baseSalaryType === 'month') {
          workedShifts = attendedRecords.length;
          workedDays = workedShifts;
          if (workDaysInMonth > 0) {
            accruals = Math.round((baseSalary / workDaysInMonth) * workedShifts);
          }
        } else if (baseSalaryType === 'shift') {
          workedShifts = attendedRecords.length;
          accruals = workedShifts * shiftRate;
        } else {
          accruals = baseSalary;
        }

        const total = Math.max(0, accruals - totalPenalties);

        // Создаем запись с рассчитанными данными
        const newPayroll = new (Payroll())({
          staffId: staff._id,
          period: period,
          baseSalary: baseSalary,
          baseSalaryType: baseSalaryType,
          shiftRate: shiftRate,
          bonuses: 0,
          deductions: 0,
          accruals: accruals,
          penalties: totalPenalties,
          fines: newFines, // Save detailed fines!
          latePenalties: latePenalties,
          latePenaltyRate: 13,
          absencePenalties: absencePenalties,
          userFines: 0,
          workedDays: workedDays,
          workedShifts: workedShifts,
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