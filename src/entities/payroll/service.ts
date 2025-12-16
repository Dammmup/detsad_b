import Payroll, { IPayroll } from './model';
import User from '../users/model';
import { sendTelegramNotification } from '../../utils/telegramNotify';
import StaffAttendanceTracking from '../staffAttendanceTracking/model';
import {
  calculatePenalties,
  getWorkingDaysInMonth,
  shouldCountAttendance
} from '../../services/payrollAutomationService';

export class PayrollService {
  async getPayrollBreakdown(id: string) {
    return Payroll().findById(id).populate('staffId', 'fullName role');
  }
  async getAll(filters: { staffId?: string, period?: string, status?: string }) {
    const filter: any = {};

    if (filters.staffId) filter.staffId = filters.staffId;
    const targetPeriod = filters.period || new Date().toISOString().slice(0, 7);
    if (targetPeriod) filter.period = targetPeriod;
    if (filters.status) filter.status = filters.status;

    return Payroll().find(filter)
      .populate('staffId', 'fullName role')
      .sort({ period: -1 });
  }

  async getAllWithUsers(filters: { staffId?: string, period?: string, status?: string }) {
    const userFilter: any = {};
    if (filters.status) userFilter.status = filters.status;
    const period = filters.period || new Date().toISOString().slice(0, 7);

    // ИСПРАВЛЕНИЕ: Если указан staffId, фильтруем только его (для /payroll/my)
    if (filters.staffId) {
      userFilter._id = filters.staffId;
    }

    // Получаем пользователей (или одного пользователя если staffId указан)
    // РЕФАКТОРИНГ: Убраны поля salary из users - теперь берутся из payrolls
    const users = await User().find(userFilter)
      .select('_id fullName role iin uniqNumber')
      .sort({ fullName: 1 });

    // Получаем записи зарплат для указанного периода
    let payrollRecords: any[] = [];
    const payrollFilter: any = { period };
    if (filters.staffId) {
      payrollFilter.staffId = filters.staffId;
    }
    payrollRecords = await Payroll().find(payrollFilter)
      .populate('staffId', 'fullName role')
      .sort({ createdAt: -1 });

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
        // Если есть запись в коллекции зарплат - пересчитываем total если он 0
        if (payroll.total === 0 && (payroll.accruals > 0 || payroll.workedShifts > 0)) {
          payroll.total = Math.max(0, (payroll.accruals || 0) - (payroll.penalties || 0));
        }
        return payroll;
      } else {
        // Если нет записи в коллекции зарплат, создаем виртуальную запись
        // РЕФАКТОРИНГ: Используем дефолтные значения вместо чтения из Users
        const baseSalary = 180000; // Дефолтный оклад
        const salaryType: string = 'month'; // Дефолтный тип зарплаты
        const shiftRate = 0; // Дефолтная ставка за смену

        let workedDays = 0;
        let workedShifts = 0;
        let accruals: number;
        let penalties = 0;
        let latePenalties = 0;
        let absencePenalties = 0;

        // Получаем настройки детского сада для определения часового пояса
        let countOfWorkdays = 0;
        if (period) {
          const startDate = new Date(`${period}-01`);
          const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
          endDate.setHours(23, 59, 59, 999);
          let workingDaysInPeriod = await getWorkingDaysInMonth(startDate);
          // ИСПРАВЛЕНИЕ: Если нет настроек, считаем рабочие дни (Пн-Пт) вручную
          if (workingDaysInPeriod <= 0) {
            const year = startDate.getFullYear();
            const month = startDate.getMonth();
            const lastDay = new Date(year, month + 1, 0).getDate();
            for (let d = 1; d <= lastDay; d++) {
              const dayOfWeek = new Date(year, month, d).getDay();
              if (dayOfWeek !== 0 && dayOfWeek !== 6) workingDaysInPeriod++;
            }
          }
          const attendanceRecords = await StaffAttendanceTracking().find({
            staffId: user._id,
            date: { $gte: startDate, $lte: endDate }
          });
          countOfWorkdays = workingDaysInPeriod;
          const countedRecords = attendanceRecords.filter(rec => shouldCountAttendance(rec));
          workedShifts = countedRecords.length;
          workedDays = countedRecords.length; // одна смена — один рабочий день


          accruals = workingDaysInPeriod > 0 ? (baseSalary / workingDaysInPeriod) * workedShifts : 0;

          const attendancePenalties = await calculatePenalties(user._id.toString(), period, user as any);
          penalties = attendancePenalties.totalPenalty;
          latePenalties = attendancePenalties.latePenalties;
          absencePenalties = attendancePenalties.absencePenalties;
        } else {
          accruals = baseSalary;
        }

        // Generate Shift Details (Breakdown) for virtual record too
        const shiftDetails: any[] = [];
        let calculatedDailyPay = 0;

        if (salaryType === 'month' && countOfWorkdays > 0) {
          calculatedDailyPay = Math.round(baseSalary / countOfWorkdays);
        } else if (salaryType === 'shift') {
          calculatedDailyPay = shiftRate;
        } else if (countOfWorkdays > 0) {
          // Fallback для неизвестных типов - рассчитываем как месячный оклад
          calculatedDailyPay = Math.round(baseSalary / countOfWorkdays);
        }

        const periodStartDate = new Date(`${period}-01`);
        const periodEndDate = new Date(periodStartDate.getFullYear(), periodStartDate.getMonth() + 1, 0);
        periodEndDate.setHours(23, 59, 59, 999); // Set to end of the last day

        const attendanceRecordsForDetails = await StaffAttendanceTracking().find({
          staffId: user._id,
          date: { $gte: periodStartDate, $lte: periodEndDate }
        }).sort({ date: 1 }); // Sort by date for consistent ordering

        for (const record of attendanceRecordsForDetails) {
          if (shouldCountAttendance(record)) {
            // ИСПРАВЛЕНИЕ: Убираем штрафы из детализации смен (за них отвечает отдельный раздел)
            shiftDetails.push({
              date: new Date(record.date),
              earnings: calculatedDailyPay,
              fines: 0, // Штрафы отображаются в отдельном разделе
              net: calculatedDailyPay,
              reason: `Смена ${new Date(record.date).toLocaleDateString('ru-RU')}`
            });
          }
        }

        const calculatedTotal = Math.max(0, accruals - penalties); // Убедимся, что итог не отрицательный

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
          baseSalaryType: salaryType,
          shiftRate: shiftRate,
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
          workedShifts: workedShifts,
          // Добавляем детализацию смен
          shiftDetails: shiftDetails
        };
      }
    }));
    return result.filter(item => item !== null); // Фильтруем null значения, если они появились
  }

  async getById(id: string, userId?: string) {
    const payroll = await Payroll().findById(id)
      .populate('staffId', 'fullName role');

    if (!payroll) {
      throw new Error('Зарплата не найдена');
    }

    // ИСПРАВЛЕНИЕ: staffId после populate() - это объект, не строка
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

  /**
   * Получает payroll для конкретного пользователя за период
   * Автоматически обновляет/создаёт запись перед возвратом
   */
  async getPayrollForUser(userId: string, period: string) {
    // Сначала убедимся, что запись актуальна
    await this.ensurePayrollForUser(userId, period);

    // Затем возвращаем обновлённую запись
    const payroll = await Payroll().findOne({ staffId: userId, period })
      .populate('staffId', 'fullName role');

    return payroll;
  }

  async create(payrollData: Partial<IPayroll>) {
    // Вычисляем общую сумму
    const total = Math.max(0, (payrollData.baseSalary || 0) +
      (payrollData.bonuses || 0) -
      (payrollData.penalties || 0) -
      (payrollData.advance || 0) +
      (payrollData.accruals || 0)); // accruals уже содержит рассчитанную сумму начислений

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

  async update(id: string, data: Partial<IPayroll>, userId: string) {
    const payroll = await Payroll().findById(id);
    if (!payroll) {
      throw new Error('Зарплата не найдена');
    }

    // Ownership check
    if (payroll.staffId?.toString() !== userId) {
      throw new Error('Forbidden: Payroll record does not belong to user');
    }

    // Обработка обновления базовой информации и пересчет итоговой суммы
    if (data.baseSalary !== undefined ||
      data.bonuses !== undefined ||
      data.deductions !== undefined ||
      data.advance !== undefined) {

      const baseSalary = data.baseSalary !== undefined ? data.baseSalary : payroll.baseSalary;
      const bonuses = data.bonuses !== undefined ? data.bonuses : payroll.bonuses;
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

    // Обновляем поля, если они переданы в данных
    if (data.shiftDetails !== undefined) {
      payroll.shiftDetails = data.shiftDetails;
    }

    // Обновляем все остальные поля, которые могут быть переданы
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

    const updatedPayroll = await Payroll().findById(payroll._id)
      .populate('staffId', 'fullName role telegramChatId');

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
    payroll.userFines = payroll.fines.reduce((sum, f) => sum + f.amount, 0);

    // Recalculate total penalties (sum of components)
    // This ensures consistency even if previous value was drifted
    payroll.penalties = (payroll.latePenalties || 0) + (payroll.absencePenalties || 0) + payroll.userFines;

    payroll.total = Math.max(0, (payroll.accruals || 0) - (payroll.penalties || 0) - (payroll.advance || 0) + (payroll.bonuses || 0));

    await payroll.save();

    return Payroll().findById(payroll._id).populate('staffId', 'fullName role');
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

    // Обновляем общую сумму штрафов
    payroll.userFines = payroll.fines.reduce((sum, f) => sum + f.amount, 0);

    // Recalculate total penalties (sum of components)
    payroll.penalties = (payroll.latePenalties || 0) + (payroll.absencePenalties || 0) + payroll.userFines;

    // Recalculate total (include advance/bonuses if they exist)
    payroll.total = Math.max(0, (payroll.accruals || 0) - (payroll.penalties || 0) - (payroll.advance || 0) + (payroll.bonuses || 0));

    await payroll.save();

    return Payroll().findById(payroll._id).populate('staffId', 'fullName role');
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
      let existing = await Payroll().findOne({ staffId, period });

      const staff = await User().findById(staffId);
      if (!staff) {
        console.error(`User not found: ${staffId}`);
        throw new Error('User not found');
      }

      // РЕФАКТОРИНГ: Получаем salary данные из существующего payroll или используем дефолты
      // Не читаем baseSalary/salaryType/shiftRate из Users
      const baseSalary = existing?.baseSalary || 180000;
      const baseSalaryType: string = existing?.baseSalaryType || 'month';
      const shiftRate = existing?.shiftRate || 0;

      // Calculate penalties immediately so they aren't 0
      // Use rate 13
      const attendancePenalties = await calculatePenalties(staff._id.toString(), period, staff as any, 13);

      // Используем настройки часового пояса для корректного формирования даты штрафа
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
      // ИСПРАВЛЕНИЕ: Если нет настроек, считаем рабочие дни (Пн-Пт) вручную
      if (workDaysInMonth <= 0) {
        const year = startDate.getFullYear();
        const month = startDate.getMonth();
        const lastDay = new Date(year, month + 1, 0).getDate();
        for (let d = 1; d <= lastDay; d++) {
          const dayOfWeek = new Date(year, month, d).getDay();
          if (dayOfWeek !== 0 && dayOfWeek !== 6) workDaysInMonth++;
        }
      }
      // Logic for attendance counting is now relaxed in "shouldCountAttendance"
      const attendedRecords = attendancePenalties.attendanceRecords.filter((r: any) => shouldCountAttendance(r));

      // ИСПРАВЛЕНИЕ: Учитываем 'month' как дефолт
      if (baseSalaryType === 'month' || !baseSalaryType) {
        workedShifts = attendedRecords.length;
        workedDays = workedShifts;
        accruals = Math.round((baseSalary / workDaysInMonth) * workedShifts);
      } else if (baseSalaryType === 'shift') {
        workedShifts = attendedRecords.length;
        accruals = workedShifts * shiftRate;
      } else {
        // Fallback для неизвестных типов
        workedShifts = attendedRecords.length;
        workedDays = workedShifts;
        accruals = Math.round((baseSalary / workDaysInMonth) * workedShifts);
      }

      // Generate Shift Details (Breakdown)
      const shiftDetails: any[] = [];
      let calculatedDailyPay = 0;

      // ИСПРАВЛЕНИЕ: Если baseSalaryType не указан, используем 'month' по умолчанию
      if ((baseSalaryType === 'month' || !baseSalaryType) && workDaysInMonth > 0) {
        calculatedDailyPay = Math.round(baseSalary / workDaysInMonth);
      } else if (baseSalaryType === 'shift') {
        calculatedDailyPay = shiftRate;
      } else if (workDaysInMonth > 0) {
        // Fallback
        calculatedDailyPay = Math.round(baseSalary / workDaysInMonth);
      }

      for (const record of attendedRecords) {
        // ИСПРАВЛЕНИЕ: Убираем штрафы из детализации смен (за них отвечает отдельный раздел)
        shiftDetails.push({
          date: new Date(record.actualStart),
          earnings: calculatedDailyPay,
          fines: 0, // Штрафы отображаются в отдельном разделе
          net: calculatedDailyPay,
          reason: `Смена ${new Date(record.actualStart).toLocaleDateString('ru-RU')}`
        });
      }

      // Убедимся, что итоговая сумма не отрицательна
      const total = Math.max(0, accruals - totalPenalties);

      if (existing) {
        // Only auto-update if it's draft or we want to force refresh on view
        // Ideally we should check if it's 'approved' before touching.
        if (existing.status === 'draft' || existing.status === 'generated') {
          existing.accruals = accruals;
          existing.penalties = totalPenalties;
          // Merge manual fines potentially? But for ensurePayroll we often want fresh state.
          // Preserving manual fines logic if needed:
          const existingManualFines = existing.fines?.filter(f => f.type === 'manual') || [];
          existing.fines = [...existingManualFines, ...newFines];

          existing.latePenalties = latePenalties;
          existing.absencePenalties = absencePenalties;
          existing.workedDays = workedDays;
          existing.workedShifts = workedShifts;
          existing.shiftDetails = shiftDetails; // Добавляем обновление детализации смен
          existing.total = total;
          // Ensure base salary info is up to date
          existing.baseSalary = baseSalary;
          existing.baseSalaryType = 'month';

          await existing.save();
          return { message: 'Payroll updated', created: 0 };
        }
        return { message: 'Payroll exists (locked)', created: 0 };
      }

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

  /**
   * Проверяет наличие расчетных листов для указанного периода и генерирует их, если они отсутствуют
   */
  async ensurePayrollRecordsForPeriod(period: string) {
    try {
      console.log(`Проверка наличия расчетных листов для периода: ${period}`);

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
        // РЕФАКТОРИНГ: Используем дефолтные значения вместо чтения из Users
        const baseSalary = 180000;
        const baseSalaryType: string = 'month';
        const shiftRate = 0;

        // Calculate penalties immediately so they aren't 0

        // Use rate 13
        const attendancePenalties = await calculatePenalties(staff._id.toString(), period, staff as any, 13);

        // Generate detailed fines array for the new record
        // Используем настройки часового пояса для корректного формирования даты штрафа
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
        let workDaysInMonth = await getWorkingDaysInMonth(startDate);
        // ИСПРАВЛЕНИЕ: Если нет настроек, считаем рабочие дни (Пн-Пт) вручную
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

        // ИСПРАВЛЕНИЕ: Учитываем 'month' как дефолт
        if (baseSalaryType === 'month' || !baseSalaryType) {
          workedShifts = attendedRecords.length;
          workedDays = workedShifts;
          accruals = Math.round((baseSalary / workDaysInMonth) * workedShifts);
        } else if (baseSalaryType === 'shift') {
          workedShifts = attendedRecords.length;
          accruals = workedShifts * shiftRate;
        } else {
          // Fallback для неизвестных типов
          workedShifts = attendedRecords.length;
          workedDays = workedShifts;
          accruals = Math.round((baseSalary / workDaysInMonth) * workedShifts);
        }

        // Generate Shift Details (Breakdown) for the new record
        const shiftDetails: any[] = [];
        let calculatedDailyPay = 0;

        // ИСПРАВЛЕНИЕ: Если baseSalaryType не указан, используем 'month' по умолчанию
        if ((baseSalaryType === 'month' || !baseSalaryType) && workDaysInMonth > 0) {
          calculatedDailyPay = Math.round(baseSalary / workDaysInMonth);
        } else if (baseSalaryType === 'shift') {
          calculatedDailyPay = shiftRate;
        } else if (workDaysInMonth > 0) {
          // Fallback
          calculatedDailyPay = Math.round(baseSalary / workDaysInMonth);
        }

        for (const record of attendedRecords) {
          // ИСПРАВЛЕНИЕ: Убираем штрафы из детализации смен (за них отвечает отдельный раздел)
          shiftDetails.push({
            date: new Date(record.actualStart),
            earnings: calculatedDailyPay,
            fines: 0, // Штрафы отображаются в отдельном разделе
            net: calculatedDailyPay,
            reason: `Смена ${new Date(record.actualStart).toLocaleDateString('ru-RU')}`
          });
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
          shiftDetails: shiftDetails, // Добавляем детализацию смен
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