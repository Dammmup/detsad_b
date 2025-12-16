import Payroll from '.././entities/payroll/model';
import StaffAttendanceTracking from '.././entities/staffAttendanceTracking/model';
import Shift from '.././entities/staffShifts/model';
import User, { IUser } from '.././entities/users/model';
import EmailService from './emailService';
import { SettingsService } from '../entities/settings/service';

// Создаем экземпляр EmailService
const emailService = new EmailService();

interface PayrollAutomationSettings {
  autoCalculationDay: number; // день месяца для автоматического расчета (1-31)
  emailRecipients: string; // email получателей отчетов
  autoClearData: boolean; // очищать ли данные после расчета
}

/**
 * Рассчитывает штрафы для сотрудника на основе посещаемости
 */
export const calculatePenalties = async (staffId: string, month: string, employee: IUser, rateOverride?: number) => {
  // Format month: YYYY-MM
  const startDate = new Date(`${month}-01`);
  const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
  endDate.setHours(23, 59, 59, 999);

  // Получаем настройки детского сада для определения часового пояса
  const settingsService = new SettingsService();
  const settings = await settingsService.getKindergartenSettings();
  const timezone = settings?.timezone || 'Asia/Almaty'; // По умолчанию используем Астану

  // Получаем посещаемость сотрудника за указанный месяц
  const attendanceRecords = await StaffAttendanceTracking().find({
    staffId,
    date: {
      $gte: startDate,
      $lte: endDate
    }
  });

  let totalPenalty = 0;
  let latePenalties = 0;
  let absencePenalties = 0;

  // Получаем настройки штрафов из сотрудника или используем значения по умолчанию
  // Если передан rateOverride, используем его, иначе из профиля сотрудника
  const penaltyType: string = (employee as any).penaltyType || 'per_minute';
  let penaltyAmount: number = 0;

  if (rateOverride !== undefined) {
    penaltyAmount = rateOverride;
  } else {
    penaltyAmount = (employee as any).penaltyAmount || 13;
  }

  // Получаем все смены сотрудника за месяц для более надежного сопоставления
  const shifts = await Shift().find({
    staffId,
    date: { $regex: new RegExp(`^${month}`) }
  });
  const shiftsMap = new Map(shifts.map((s: any) => [s.date, s])); // Map by date string "YYYY-MM-DD"

  for (const record of attendanceRecords) {
    // Пропускаем записи без фактического времени
    if (!record.actualStart) continue;

    // Пытаемся найти смену по shiftId, если нет - по дате
    let shift = null;
    if (record.shiftId && shiftsMap.has(record.shiftId.toString())) {
      // Note: shiftId won't be in shiftsMap keys if keys are dates.
      // We should stick to finding by date.
    }

    // Определяем дату записи в формате YYYY-MM-DD (local time assumed to match Shift)
    const recordDate = new Date(record.date || record.actualStart);
    const dateStr = [
      recordDate.getFullYear(),
      String(recordDate.getMonth() + 1).padStart(2, '0'),
      String(recordDate.getDate()).padStart(2, '0')
    ].join('-');

    shift = shiftsMap.get(dateStr);

    if (!shift) continue;

    // Сравниваем время
    // Shift startTime/endTime format: "HH:MM"
    const [schedStartH, schedStartM] = shift.startTime.split(':').map(Number);

    // ИСПРАВЛЕНИЕ ЧАСОВОГО ПОЯСА:
    // actualStart хранится в UTC. Приводим к локальному времени Казахстана (+05:00)
    const timezoneOffsetMinutes = 5 * 60; // +05:00

    // Получаем время прихода в минутах от полуночи в локальном времени
    const actualStartUTC = new Date(record.actualStart);
    const actualStartMinutesUTC = actualStartUTC.getUTCHours() * 60 + actualStartUTC.getUTCMinutes();
    const actualStartMinutesLocal = actualStartMinutesUTC + timezoneOffsetMinutes;
    // Корректируем если перешли на следующий день
    const actualMinutes = actualStartMinutesLocal >= 1440 ? actualStartMinutesLocal - 1440 : actualStartMinutesLocal;

    // Время начала смены в минутах от полуночи
    const scheduledMinutes = schedStartH * 60 + schedStartM;

    // Если опоздал (actualMinutes > scheduledMinutes)
    let lateMinutes = 0;
    if (actualMinutes > scheduledMinutes) {
      lateMinutes = actualMinutes - scheduledMinutes;

      console.log(`[PENALTY-DEBUG] User: ${employee.fullName}`);
      console.log(`  Shift Time: ${shift.startTime} (${scheduledMinutes} min from midnight)`);
      console.log(`  Actual Start (UTC): ${actualStartUTC.toISOString()}`);
      console.log(`  Actual Local Time: ${Math.floor(actualMinutes / 60)}:${String(actualMinutes % 60).padStart(2, '0')}`);
      console.log(`  Late Minutes: ${lateMinutes}`);
    }

    // Сохраняем рассчитанные минуты в запись (опционально, но полезно для отладки)
    record.lateMinutes = lateMinutes;
    // record.earlyLeaveMinutes = earlyLeaveMinutes; // Removed logic
    // Можно сохранить изменения в record, если нужно: await record.save();

    // Считаем штраф за опоздание
    if (lateMinutes > 0 && penaltyAmount > 0) {
      // Логика штрафа зависит от типа, но пользователь просил "per_minute" по умолчанию в логике
      // "учитывать какой размер штрафа за минуту указан в penaltyType" - возможно penaltyType это '200' (сумма)?
      // Или penaltyType='per_minute', penaltyAmount=200.
      // Предположим penaltyAmount - это сумма за минуту.

      latePenalties += lateMinutes * penaltyAmount;
    }


  }

  // Штрафы за неявки (absence)
  // Находим смены, где статус 'absent' или просто нет attendance record?
  // Обычно attendance record создается при чекине. Если не пришел - записи может не быть.
  // Но есть 'status' в Shift.
  // Для простоты пока берем логику пользователя: "сущность payrolls должна доставать записи с коллекции staffAttendanceTracking"
  // Если там есть записи со статусом 'absent'?
  const absenceRecords = attendanceRecords.filter((record: any) => record.status === 'absent');
  // Пользователь просил "возможность указывать штраф ... если причиной было не опоздание"
  // Это скорее ручные штрафы. Автоматически:
  // Если есть логика для отсутствия, применим. Старая логика была 630 * кол-во.
  // Оставим пока 0 или старую логику, если явно не указано иное.
  // Пользователь не уточнил формулу для прогулов, только "штраф за опоздание или ранний уход".

  totalPenalty = latePenalties + absencePenalties;

  return {
    totalPenalty,
    latePenalties,
    absencePenalties,
    attendanceRecords,
    details: { penaltyType, penaltyAmount }
  };
};

/**
 * Рассчитывает дневную ставку сотрудника на основе его зарплаты и типа оплаты
 */
const calculateDailyRate = (employee: IUser): number => {
  const salaryType = ((employee as any).salaryType as string) || 'month';
  const salary = Number((employee as any).baseSalary ?? (employee as any).salary ?? 0);
  const shiftRate = Number((employee as any).shiftRate || 0);
  switch (salaryType) {
    case 'day':
      return salary;
    case 'shift':
      return shiftRate;
    case 'month':
    default:
      // По умолчанию 22 рабочих дня, реальный расчет ниже при начислении
      return salary / 22;
  }
};

// Рабочие дни в месяце (с учетом выходных и праздников)
export const getWorkingDaysInMonth = async (date: Date): Promise<number> => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const lastDay = new Date(year, month + 1, 0).getDate();
  let workdays = 0;

  const settingsService = new SettingsService();

  for (let d = 1; d <= lastDay; d++) {
    const currentDate = new Date(year, month, d);
    const dateStr = currentDate.toISOString().split('T')[0]; // YYYY-MM-DD

    // Проверяем, является ли день выходным или праздничным
    const isNonWorkingDay = await settingsService.isNonWorkingDay(dateStr);

    if (!isNonWorkingDay) {
      workdays++;
    }

  }
  return workdays;
};

// Запись посещаемости засчитывается, если завершена и checkout не позже расписания
export const shouldCountAttendance = (record: any): boolean => {
  // Relaxed logic: If they checked in (actualStart exists), count it as a working day/shift.
  // This ensures that even if they forgot to check out (and got a fine), they still get the base pay for showing up.
  // The fine will be subtracted from this base pay.
  return !!record.actualStart;
};

/**
 * Автоматически рассчитывает зарплаты для всех сотрудников за указанный месяц
 */
/**
 * Автоматически рассчитывает зарплаты для всех сотрудников за указанный месяц
 */
export const autoCalculatePayroll = async (month: string, settings: PayrollAutomationSettings) => {
  try {
    console.log(`Начинаем автоматический расчет зарплат за ${month}`);

    // Получаем всех активных сотрудников (кроме админов, или всех?)
    // Пользователь сказал "для всех сотрудников". Лучше не исключать никого, кроме, может быть, совсем системных.
    const staff = await User().find({
      role: { $ne: 'admin' }, // Возможно стоит включить админов если они тоже сотрудники? Оставим пока фильтр.
      active: true
    });

    console.log(`Найдено ${staff.length} сотрудников для расчета`);

    const results: Array<{
      staffId: string;
      staffName: string;
      baseSalary: number;
      penalties: number;
      total: number;
    }> = [];

    // YYYY-MM
    const startDate = new Date(`${month}-01`);
    const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
    endDate.setHours(23, 59, 59, 999);

    // Получаем рабочие дни в месяце
    const workDaysInMonth = await getWorkingDaysInMonth(startDate);

    for (const employee of staff) {
      console.log(`🔍 Обработка сотрудника: ${employee.fullName}, ID: ${(employee as any)._id}`);

      const baseSalaryRaw = Number((employee as any).baseSalary);
      const baseSalary = baseSalaryRaw > 0 ? baseSalaryRaw : 180000;

      let salaryType: string = ((employee as any).salaryType as string) || 'month'; // 'month' or 'shift'
      const shiftRate = Number((employee as any).shiftRate || 0);

      // Получаем посещаемость
      // FORCE 13 RATE: Pass 13 explicitly to override any employee settings
      const attendancePenalties = await calculatePenalties((employee as any)._id.toString(), month, employee, 13);
      const attendedRecords = attendancePenalties.attendanceRecords.filter((r: any) => shouldCountAttendance(r));

      let accruals = 0;
      let workedShifts = 0;
      let workedDays = 0;

      if (salaryType === 'month') {
        // Базовая зарплата делится на количество рабочих дней в месяце * количество отработанных смен
        workedShifts = attendedRecords.length;
        workedDays = workedShifts; // Assuming 1 shift = 1 day logic mostly

        if (workDaysInMonth > 0) {
          accruals = Math.round((baseSalary / workDaysInMonth) * workedShifts);
        } else {
          accruals = baseSalary; // Fallback if 0 working days? Or 0. Let's assume 0 working days = 0 pay usually, but maybe full if holiday month? 
          // Logic: "базовая зарплата делится на количество рабочих дней"
          accruals = 0;
        }
      } else if (salaryType === 'shift') {
        // "количество отработанных смен суммируется"
        workedShifts = attendedRecords.length;

        accruals = workedShifts * shiftRate;
      } else {
        // Fallback
        accruals = baseSalary;
      }

      // Получаем ручные штрафы (из сохраненного Payroll, если он уже был, чтобы не потерять manual fines)
      const existingPayroll = await Payroll().findOne({
        staffId: (employee as any)._id,
        period: month
      });

      const manualFines = existingPayroll?.fines?.filter(f => f.type === 'manual') || [];
      const newFines = [];

      // Generate late fines from attendance records
      const lateRate = Number(attendancePenalties.details.penaltyAmount || 0);
      for (const record of attendancePenalties.attendanceRecords) {
        if (record.lateMinutes > 0) {
          const amount = record.lateMinutes * lateRate;
          if (amount > 0) {
            // Получаем настройки часового пояса для корректного формирования даты штрафа
            const fineDate = new Date(record.actualStart);
            newFines.push({
              amount: amount,
              reason: `Опоздание: ${record.lateMinutes} мин`,
              type: 'late',
              date: fineDate,
              createdAt: new Date()
            });
          }
        }
      }

      // Combine fines
      const allFines = [...manualFines, ...newFines];

      // Общие штрафы
      const totalPenalties = allFines.reduce((sum, f) => sum + f.amount, 0);

      // Итого
      const rawTotal = accruals - totalPenalties - (existingPayroll?.advance || 0) + (existingPayroll?.bonuses || 0) - (existingPayroll?.deductions || 0);
      const total = Math.max(0, rawTotal);

      // Сохраняем/Обновляем
      if (existingPayroll) {
        existingPayroll.accruals = accruals;
        existingPayroll.penalties = totalPenalties;
        existingPayroll.fines = allFines;
        existingPayroll.userFines = manualFines.reduce((sum, f) => sum + f.amount, 0);

        existingPayroll.latePenalties = attendancePenalties.latePenalties;
        existingPayroll.latePenaltyRate = lateRate;
        existingPayroll.absencePenalties = attendancePenalties.absencePenalties;

        existingPayroll.total = total;

        // Update base salary info in record just in case it changed
        existingPayroll.baseSalary = baseSalary;
        existingPayroll.baseSalaryType = salaryType;
        existingPayroll.shiftRate = shiftRate;
        existingPayroll.workedDays = workedDays;
        existingPayroll.workedShifts = workedShifts;

        await existingPayroll.save();
      } else {
        const newPayroll = new (Payroll())({
          staffId: employee._id,
          period: month,
          accruals: accruals,
          penalties: totalPenalties,
          fines: allFines,
          latePenalties: attendancePenalties.latePenalties,
          latePenaltyRate: lateRate,
          absencePenalties: attendancePenalties.absencePenalties,
          userFines: 0,
          baseSalary: baseSalary,
          baseSalaryType: salaryType,
          shiftRate: shiftRate,
          workedDays: workedDays,
          workedShifts: workedShifts,
          total: total,
          status: 'approved'
        });
        await newPayroll.save();
      }

      results.push({
        staffId: (employee._id as any).toString(),
        staffName: employee.fullName,
        baseSalary,
        penalties: totalPenalties,
        total
      });
    }

    return results;
  } catch (error) {
    console.error('Ошибка при автоматическом расчете зарплат:', error);
    throw error;
  }
};

/**
 * Очищает штрафы за указанный месяц
 */
const clearAttendancePenalties = async (month: string) => {
  try {
    console.log(`Очистка штрафов за ${month}`);

    // В реальной системе это может означать сброс данных о штрафах
    // или перемещение их в архив.

    // Для реализации очистки данных мы можем:
    // 1. Архивировать старые записи посещаемости
    // 2. Удалить старые записи посещаемости
    // 3. Пометить записи как обработанные

    // В данном случае мы пометим записи посещаемости как обработанные
    // и обновим статус расчетных листов

    // Обновляем статус расчетных листов
    await Payroll().updateMany(
      { period: month },
      {
        $set: {
          status: 'processed'
        },
        $push: {
          history: {
            date: new Date(),
            action: 'Data cleared after payroll calculation',
            comment: 'Attendance penalties processed and cleared'
          }
        }
      }
    );

    // Помечаем записи посещаемости как обработанные
    // В реальной системе здесь может быть архивирование или удаление записей
    await StaffAttendanceTracking().updateMany(
      {
        date: {
          $gte: new Date(`${month}-01`),
          $lte: new Date(new Date(`${month}-01`).getFullYear(), new Date(`${month}-01`).getMonth() + 1, 0)
        }
      },
      {
        $set: {
          processed: true,
          processedAt: new Date()
        }
      }
    );

    console.log(`Штрафы за ${month} очищены. Записи посещаемости помечены как обработанные.`);
  } catch (error) {
    console.error('Ошибка при очистке штрафов:', error);
    throw error;
  }
};

/**
 * Отправляет отчеты о зарплате по email
 */
export const sendPayrollReports = async (month: string, recipients: string) => {
  try {
    console.log(`Отправка отчетов о зарплате за ${month} на ${recipients}`);

    // Получаем все расчетные листы за указанный месяц
    const payrolls = await Payroll().find({ period: month })
      .populate('staffId', 'fullName email');

    // Формируем данные отчета
    const reportData = {
      month,
      totalEmployees: payrolls.length,
      totalPayroll: payrolls.reduce((sum, p) => sum + p.total, 0),
      details: payrolls.map(p => ({
        staffName: (p.staffId as any).fullName,
        baseSalary: p.baseSalary, // используем значение из самой зарплаты
        penalties: p.penalties,
        total: p.total,
        status: p.status
      }))
    };

    // Отправляем отчет по email
    const emailRecipients = recipients.split(',').map(email => email.trim());

    for (const recipient of emailRecipients) {
      try {
        await emailService.sendPayrollReportEmail(recipient, reportData);
        console.log(`Отчет о зарплате успешно отправлен на ${recipient}`);
      } catch (error) {
        console.error(`Ошибка при отправке отчета на ${recipient}:`, error);
        throw error;
      }
    }

    console.log(`Отчеты о зарплате за ${month} отправлены`);
  } catch (error) {
    console.error('Ошибка при отправке отчетов:', error);
    throw error;
  }
};

/**
 * Основная функция, которая запускает автоматический расчет в указанный день
 */
export const runPayrollAutomation = async () => {
  try {
    // В реальной системе настройки автоматизации должны храниться в базе данных
    // или в конфигурационном файле. Для демонстрации используем фиксированные настройки.
    // В продакшене это должно быть реализовано через отдельную модель настроек.

    const currentDate = new Date();
    const currentDay = currentDate.getDate();

    // В целях демонстрации используем фиксированные настройки
    // В реальной системе они должны быть получены из базы данных
    const settings: PayrollAutomationSettings = {
      autoCalculationDay: 25, // по умолчанию 25-е число
      emailRecipients: 'admin@example.com',
      autoClearData: true
    };

    // Проверяем, совпадает ли текущий день с днем автоматического расчета
    if (currentDay === settings.autoCalculationDay) {
      // Определяем предыдущий месяц для расчета
      const previousMonth = `${currentDate.getFullYear()}-${(currentDate.getMonth()).toString().padStart(2, '0')}`;

      console.log(`Запуск автоматического расчета за ${previousMonth} на день ${currentDay}`);

      // Выполняем автоматический расчет
      await autoCalculatePayroll(previousMonth, settings);

      // Отправляем отчеты по email
      await sendPayrollReports(previousMonth, settings.emailRecipients);

      console.log('Автоматический расчет завершен успешно');
    } else {
      console.log(`Сегодня ${currentDay} число, автоматический расчет не требуется (ожидалось ${settings.autoCalculationDay} число)`);
    }
  } catch (error) {
    console.error('Ошибка при выполнении автоматического расчета зарплат:', error);
  }
};

/**
 * Функция для ручного запуска автоматического расчета
 */
export const manualRunPayrollAutomation = async (month: string, settings: PayrollAutomationSettings) => {
  try {
    console.log(`Ручной запуск автоматического расчета за ${month}`);

    // Выполняем автоматический расчет
    await autoCalculatePayroll(month, settings);

    // Отправляем отчеты по email
    await sendPayrollReports(month, settings.emailRecipients);

    console.log(`Ручной автоматический расчет за ${month} завершен успешно`);
  } catch (error) {
    console.error('Ошибка при выполнении ручного автоматического расчета зарплат:', error);
    throw error;
  }
};