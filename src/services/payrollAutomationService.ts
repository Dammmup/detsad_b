import Payroll from '.././entities/payroll/model';
import StaffAttendanceTracking from '.././entities/staffAttendanceTracking/model';
import Shift from '.././entities/staffShifts/model';
import User, { IUser } from '.././entities/users/model';
import EmailService from './emailService';
import { SettingsService } from '../entities/settings/service';


const emailService = new EmailService();

interface PayrollAutomationSettings {
  autoCalculationDay: number;
  emailRecipients: string;
  autoClearData: boolean;
}

export const calculatePenalties = async (staffId: string, month: string, employee: IUser, rateOverride?: number) => {

  const startDate = new Date(`${month}-01T12:00:00+05:00`);
  const year = startDate.getFullYear();
  const monthIdx = startDate.getMonth();
  const lastDay = new Date(year, monthIdx + 1, 0).getDate();
  const endDate = new Date(`${month}-${String(lastDay).padStart(2, '0')}T23:59:59.999+05:00`);


  const settingsService = new SettingsService();
  const settings = await settingsService.getKindergartenSettings();
  const timezone = settings?.timezone || 'Asia/Almaty';
  const globalLatePenaltyRate = settings?.payroll?.latePenaltyRate || 50;


  const attendanceRecords = await StaffAttendanceTracking.find({
    staffId,
    date: {
      $gte: startDate,
      $lte: endDate
    }
  }).lean();

  let totalPenalty = 0;
  let latePenalties = 0;
  let absencePenalties = 0;



  const penaltyType = settings?.payroll?.latePenaltyType || 'per_minute';
  let penaltyAmount = settings?.payroll?.latePenaltyRate || 50;

  if (rateOverride !== undefined) {
    penaltyAmount = rateOverride;
  }


  const staffShiftsDoc = await Shift.findOne({ staffId });
  const shiftsMap = new Map();
  if (staffShiftsDoc) {
    staffShiftsDoc.shifts.forEach((detail: any, date: string) => {
      if (date.startsWith(month)) {
        shiftsMap.set(date, { ...detail.toObject(), date });
      }
    });
  }


  const workDaysInMonth = await getWorkingDaysInMonth(startDate);
  const baseSalary = (employee as any).baseSalary || 180000;
  const salaryType = (employee as any).baseSalaryType || 'month';
  const shiftRate = (employee as any).shiftRate || 0;

  // Рассчитываем дневную ставку в зависимости от типа зарплаты
  let dailyRate = 0;
  if (salaryType === 'shift') {
    // Для типа 'shift' - дневная ставка равна ставке за смену (или baseSalary как fallback)
    dailyRate = shiftRate > 0 ? shiftRate : baseSalary;
  } else {
    // Для типа 'month' - делим месячный оклад на количество рабочих дней
    dailyRate = workDaysInMonth > 0 ? Math.round(baseSalary / workDaysInMonth) : 0;
  }

  for (const record of attendanceRecords) {

    if (!record.actualStart) continue;


    let shift = null;
    if (record.shiftId && shiftsMap.has(record.shiftId.toString())) {


    }


    const dateStr = new Date(record.date || record.actualStart).toLocaleDateString('sv-SE', { timeZone: 'Asia/Almaty' });

    shift = shiftsMap.get(dateStr);

    if (!shift) continue;



    const [schedStartH, schedStartM] = (settings?.workingHours?.start || '09:00').split(':').map(Number);
    const scheduledMinutes = schedStartH * 60 + schedStartM;

    // Get actual start time in Almaty minutes
    const almatyTimeStr = new Date(record.actualStart).toLocaleTimeString('en-GB', { timeZone: 'Asia/Almaty', hour12: false });
    const [actH, actM] = almatyTimeStr.split(':').map(Number);
    const actualMinutes = actH * 60 + actM;

    let lateMinutes = 0;
    if (actualMinutes > scheduledMinutes) {
      lateMinutes = actualMinutes - scheduledMinutes;
      // Round to nearest integer per user request
      lateMinutes = Math.round(lateMinutes);

      console.log(`[PENALTY-DEBUG] User: ${employee.fullName}`);
      console.log(`  Shift Time: ${settings?.workingHours?.start} (${scheduledMinutes} min)`);
      console.log(`  Actual Start (Local Almaty): ${actH}:${String(actM).padStart(2, '0')} (${actualMinutes} min)`);
      console.log(`  Late Minutes: ${lateMinutes}`);
    }

    record.lateMinutes = lateMinutes;




    if (lateMinutes > 0 && penaltyAmount > 0) {
      // Calculate penalty
      let penalty = 0;
      if (penaltyType === 'fixed') {
        penalty = penaltyAmount;
      } else if (penaltyType === 'per_minute') {
        penalty = lateMinutes * penaltyAmount;
      } else if (penaltyType === 'per_5_minutes') {
        penalty = Math.ceil(lateMinutes / 5) * penaltyAmount;
      } else if (penaltyType === 'per_10_minutes') {
        penalty = Math.ceil(lateMinutes / 10) * penaltyAmount;
      } else {
        penalty = lateMinutes * penaltyAmount;
      }

      // Cap single day penalty to daily rate
      // Daily Rate must be strictly checked
      const maxPenalty = dailyRate > 0 ? dailyRate : Infinity;

      if (penalty > maxPenalty) {
        console.log(`[PENALTY-CAP] User ${employee.fullName}: Capping penalty ${penalty} to daily rate ${maxPenalty}`);
        penalty = maxPenalty;
      }

      // Store the capped penalty temporarily on the record for upstream usage if needed
      (record as any).calculatedPenalty = penalty;

      latePenalties += penalty;
    }


  }







  const absenceRecords = attendanceRecords.filter((record: any) => record.status === 'absent');

  if (absenceRecords.length > 0) {
    const workDays = await getWorkingDaysInMonth(startDate);
    const baseSalary = (employee as any).baseSalary || 180000;
    const dailyRate = workDays > 0 ? baseSalary / workDays : 0;
    absencePenalties = Math.round(absenceRecords.length * dailyRate);
    console.log(`Absence Penalty: ${absenceRecords.length} days * ${dailyRate} = ${absencePenalties}`);
  }






  totalPenalty = latePenalties + absencePenalties;

  return {
    totalPenalty,
    latePenalties,
    absencePenalties,
    attendanceRecords,
    details: { penaltyType, penaltyAmount }
  };
};

const calculateDailyRate = (
  baseSalary: number = 180000,
  salaryType: string = 'month',
  shiftRate: number = 0,
  workDaysInMonth: number = 22
): number => {
  switch (salaryType) {
    case 'day':
      return baseSalary;
    case 'shift':
      return Math.round(shiftRate);
    case 'month':
    default:
      return workDaysInMonth > 0 ? Math.round(baseSalary / workDaysInMonth) : Math.round(baseSalary / 22);
  }
};


import { getProductionWorkingDays, getWeekdaysInMonth, isNonWorkingDay } from '../utils/productionCalendar';

export const getWorkingDaysInMonth = async (date: Date): Promise<number> => {
  const year = date.getFullYear();
  const month = date.getMonth();

  // Use Production Calendar count (including holidays and transfers) as the norm
  return getProductionWorkingDays(year, month);
};


export const shouldCountAttendance = (record: any): boolean => {



  return !!record.actualStart;
};

export const autoCalculatePayroll = async (month: string, settings: PayrollAutomationSettings) => {
  try {
    console.log(`Начинаем автоматический расчет зарплат за ${month}`);



    const staff = await User.find({
      role: { $ne: 'admin' },
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


    const startDate = new Date(`${month}-01T12:00:00+05:00`);
    const year = startDate.getFullYear();
    const monthIdx = startDate.getMonth();
    const lastDay = new Date(year, monthIdx + 1, 0).getDate();
    const endDate = new Date(`${month}-${String(lastDay).padStart(2, '0')}T23:59:59.999+05:00`);


    const workDaysInMonth = await getWorkingDaysInMonth(startDate);

    for (const employee of staff) {
      console.log(`🔍 Обработка сотрудника: ${employee.fullName}, ID: ${(employee as any)._id}`);


      const existingPayrollCheck = await Payroll.findOne({
        staffId: (employee as any)._id,
        period: month
      });

      // Если нет записи за текущий период - ищем из предыдущих периодов
      // Сначала ищем в текущем пейролле, потом в настройках пользователя, потом в предыдущих пейроллах
      let baseSalary = existingPayrollCheck?.baseSalary || (employee as any).baseSalary;
      let salaryType = existingPayrollCheck?.baseSalaryType || (employee as any).baseSalaryType || 'month';
      let shiftRate = existingPayrollCheck?.shiftRate || (employee as any).shiftRate || 0;

      if (!baseSalary) {
        const previousPayroll = await Payroll.findOne({ staffId: (employee as any)._id }).sort({ period: -1 });
        baseSalary = previousPayroll?.baseSalary || 180000;
        salaryType = previousPayroll?.baseSalaryType || 'month';
        shiftRate = previousPayroll?.shiftRate || 0;
      }


      // Обогащаем объект employee данными из payroll для корректного расчета штрафов
      const employeeWithPayrollData = {
        ...(employee as any).toObject ? (employee as any).toObject() : employee,
        baseSalary,
        baseSalaryType: salaryType,
        shiftRate
      };

      const attendancePenalties = await calculatePenalties((employee as any)._id.toString(), month, employeeWithPayrollData as any);
      const attendedRecords = attendancePenalties.attendanceRecords.filter((r: any) => shouldCountAttendance(r));

      let accruals = 0;
      let workedShifts = 0;
      let workedDays = 0;

      if (salaryType === 'month') {

        workedShifts = attendedRecords.length;
        workedDays = workedShifts;

        if (workDaysInMonth > 0) {
          // Calculate accruals
          accruals = Math.round(baseSalary / workDaysInMonth) * workedShifts;

          // Holiday Pay Logic
          const dailyRate = Math.round(baseSalary / workDaysInMonth);
          const holidayRecords = attendedRecords.filter((r: any) => {
            const d = new Date(r.actualStart);
            const dateStr = d.toLocaleDateString('sv-SE', { timeZone: 'Asia/Almaty' });

            const isWeekend = d.getDay() === 0 || d.getDay() === 6;
            return isNonWorkingDay(d) && !isWeekend;
          });

          if (holidayRecords.length > 0) {
            const holidayPay = holidayRecords.length * dailyRate;
            console.log(`Holiday Pay for ${employee.fullName}: ${holidayRecords.length} days = ${holidayPay}`);
            // Add to bonuses as implicit modification 
            if (!existingPayrollCheck?.bonuses) {
              // If we are creating or updating, add to bonuses
              // Note: existingPayrollCheck might be null logic handled below
              // But here we are just calculating 'accruals'.
              // We should add to 'bonuses' variable if we had one.
              // But 'bonuses' is read from existingPayrollCheck.
            }
            // For cleaner logic, let's add it to 'accruals' or explicitly handle it
            // User snippet showed "State Holiday... 7826". It seems separate.
            // But in our model we have 'bonuses'.
            // Let's add to bonuses in the 'if (existingPayroll)' block or here?
            // The 'accruals' variable is used later.
            // We should probably add it to 'penalties' (no) or 'bonuses'.
          }
        } else {
          accruals = baseSalary;

          accruals = 0;
        }
      } else if (salaryType === 'shift') {

        workedShifts = attendedRecords.length;
        // Если shiftRate не задан, используем baseSalary как ставку за смену
        const effectiveShiftRate = shiftRate > 0 ? shiftRate : baseSalary;
        accruals = workedShifts * effectiveShiftRate;
      } else {

        accruals = baseSalary;
      }


      const existingPayroll = await Payroll.findOne({
        staffId: (employee as any)._id,
        period: month
      });

      const manualFines = existingPayroll?.fines?.filter(f => f.type === 'manual') || [];
      const newFines = [];


      const lateRate = Number(attendancePenalties.details.penaltyAmount || 0);
      for (const record of attendancePenalties.attendanceRecords) {
        if (record.lateMinutes > 0) {

          // Use pre-calculated capped penalty from calculatePenalties if available
          let amount = (record as any).calculatedPenalty;
          if (amount === undefined) {
            // Fallback if not set (should not happen with new logic)
            amount = record.lateMinutes * lateRate;
          }

          if (amount > 0) {
            const fineDate = new Date(record.actualStart);
            newFines.push({
              amount: amount,
              reason: `Опоздание: ${Math.round(record.lateMinutes)} мин`,
              type: 'late',
              date: fineDate,
              createdAt: new Date()
            });
          }
        }
      }


      const allFines = [...manualFines, ...newFines];


      const totalPenalties = allFines.reduce((sum, f) => sum + f.amount, 0);


      // Recalculate bonuses to include Holiday Pay if not already added?
      // Actually, let's detect holidays again here or carry it over.
      // Better: Calculate Holiday Pay and ADD to existing bonuses or create new bonuses.

      let holidayPay = 0;
      if (salaryType === 'month' && workDaysInMonth > 0) {
        const dailyRate = baseSalary / workDaysInMonth;
        const holidayRecords = attendedRecords.filter((r: any) => {
          const d = new Date(r.actualStart);
          const isWeekend = d.getDay() === 0 || d.getDay() === 6;
          return isNonWorkingDay(d) && !isWeekend;
        });
        holidayPay = Math.round(holidayRecords.length * dailyRate);
      }

      const currentBonuses = (existingPayroll?.bonuses || 0);
      // We don't want to double add if we re-run.
      // If we are re-running, 'existingPayroll.bonuses' might already include it if we saved it before?
      // No, usually bonuses are manual.
      // Let's assume holiday pay is dynamic.
      // But we need to save it. 
      // If we save it to 'bonuses', next time it reads 'bonuses', it keeps growing?
      // Yes, potentially dangerous to mutate 'bonuses' if it's considered manual input.
      // BUT current User snippet shows "Holiday... 7826" separate from "Oklad".
      // Our model doesn't have a specific 'holidayPay' field.
      // 'bonuses' is the best fit.
      // To avoid accumulation: We should probably NOT add it to 'existingPayroll.bonuses' which comes from DB.
      // We should calculate total bonuses = Manual_Bonuses + Holiday_Pay.
      // But we don't know what part is manual.
      // SOLUTION: Use 'accruals'. 
      // User snippet: "Income: 187k" (180k + 7k).
      // 180k is "Oklad". 7k is "Holiday".
      // If we put 180k + 7k into 'accruals', it matches Total.
      // The breakdown UI might show it combined or we can use 'shiftDetails'.

      // Let's add to 'accruals' for now to ensure NET total is correct.
      // 180k (23/23 days) + 7k (1 holiday) = 187k.
      accruals += holidayPay;

      // total рассчитается автоматически в pre-save хуке модели


      if (existingPayroll) {
        existingPayroll.accruals = accruals;
        existingPayroll.penalties = totalPenalties;
        existingPayroll.fines = allFines;
        existingPayroll.userFines = manualFines.reduce((sum, f) => sum + f.amount, 0);

        existingPayroll.latePenalties = attendancePenalties.latePenalties;
        existingPayroll.absencePenalties = attendancePenalties.absencePenalties;

        // total рассчитает pre-save хук


        existingPayroll.baseSalary = baseSalary;
        existingPayroll.baseSalaryType = salaryType;
        existingPayroll.shiftRate = shiftRate;
        existingPayroll.workedDays = workedDays;
        existingPayroll.workedShifts = workedShifts;

        await existingPayroll.save();
      } else {
        const newPayroll = new Payroll({
          staffId: employee._id,
          period: month,
          accruals: accruals,
          penalties: totalPenalties,
          fines: allFines,
          latePenalties: attendancePenalties.latePenalties,
          absencePenalties: attendancePenalties.absencePenalties,
          userFines: 0,
          baseSalary: baseSalary,
          baseSalaryType: salaryType,
          shiftRate: shiftRate,
          workedDays: workedDays,
          workedShifts: workedShifts,
          // total рассчитает pre-save хук
          status: 'draft'
        });
        await newPayroll.save();
      }

      // Читаем total из сохранённого документа (рассчитан pre-save хуком)
      const savedPayroll = await Payroll.findOne({ staffId: (employee as any)._id, period: month });

      results.push({
        staffId: (employee._id as any).toString(),
        staffName: employee.fullName,
        baseSalary,
        penalties: totalPenalties,
        total: savedPayroll?.total || 0
      });
    }

    return results;
  } catch (error) {
    console.error('Ошибка при автоматическом расчете зарплат:', error);
    throw error;
  }
};

const clearAttendancePenalties = async (month: string) => {
  try {
    console.log(`Очистка Вычетов за ${month}`);













    await Payroll.updateMany(
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



    await StaffAttendanceTracking.updateMany(
      {
        date: {
          $gte: new Date(`${month}-01T12:00:00+05:00`),
          $lte: new Date(new Date(`${month}-01T12:00:00+05:00`).getFullYear(), new Date(`${month}-01T12:00:00+05:00`).getMonth() + 1, 0, 23, 59, 59)
        }
      },
      {
        $set: {
          processed: true,
          processedAt: new Date()
        }
      }
    );

    console.log(`Вычеты за ${month} очищены. Записи посещаемости помечены как обработанные.`);
  } catch (error) {
    console.error('Ошибка при очистке Вычетов:', error);
    throw error;
  }
};

export const sendPayrollReports = async (month: string, recipients: string) => {
  try {
    console.log(`Отправка отчетов о зарплате за ${month} на ${recipients}`);


    const payrolls = await Payroll.find({ period: month })
      .populate('staffId', 'fullName email');


    const reportData = {
      month,
      totalEmployees: payrolls.length,
      totalPayroll: payrolls.reduce((sum, p) => sum + p.total, 0),
      details: payrolls.map(p => ({
        staffName: (p.staffId as any).fullName,
        baseSalary: p.baseSalary,
        penalties: p.penalties,
        total: p.total,
        status: p.status
      }))
    };


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

export const runPayrollAutomation = async () => {
  try {




    const currentDate = new Date();
    const currentDay = currentDate.getDate();



    const settings: PayrollAutomationSettings = {
      autoCalculationDay: 25,
      emailRecipients: 'admin@example.com',
      autoClearData: true
    };


    if (currentDay === settings.autoCalculationDay) {

      const previousMonth = `${currentDate.getFullYear()}-${(currentDate.getMonth()).toString().padStart(2, '0')}`;

      console.log(`Запуск автоматического расчета за ${previousMonth} на день ${currentDay}`);


      await autoCalculatePayroll(previousMonth, settings);


      await sendPayrollReports(previousMonth, settings.emailRecipients);

      console.log('Автоматический расчет завершен успешно');
    } else {
      console.log(`Сегодня ${currentDay} число, автоматический расчет не требуется (ожидалось ${settings.autoCalculationDay} число)`);
    }
  } catch (error) {
    console.error('Ошибка при выполнении автоматического расчета зарплат:', error);
  }
};

export const manualRunPayrollAutomation = async (month: string, settings: PayrollAutomationSettings) => {
  try {
    console.log(`Ручной запуск автоматического расчета за ${month}`);


    await autoCalculatePayroll(month, settings);


    await sendPayrollReports(month, settings.emailRecipients);

    console.log(`Ручной автоматический расчет за ${month} завершен успешно`);
  } catch (error) {
    console.error('Ошибка при выполнении ручного автоматического расчета зарплат:', error);
    throw error;
  }
};