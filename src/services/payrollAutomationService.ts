import Payroll from '.././entities/payroll/model';
import StaffShift, { IStaffShift } from '.././entities/staffShifts/newModel';
import User, { IUser } from '.././entities/users/model';
import Fine from '.././entities/fine/model';
import EmailService from './emailService';

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
const calculatePenalties = async (staffId: string, month: string, employee: IUser) => {
  // Формат month: YYYY-MM
  const startDate = new Date(`${month}-01`);
  const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
  
  // Получаем посещаемость сотрудника за указанный месяц
  const attendanceRecords: IStaffShift[] = await StaffShift.find({
    staffId,
    "shifts.date": {
      $gte: startDate.toISOString().split('T')[0],
      $lte: endDate.toISOString().split('T')[0]
    }
  });
  
  let totalPenalty = 0;
  let latePenalties = 0;
  let absencePenalties = 0;
  
  // Получаем параметры штрафов из профиля сотрудника
  const penaltyType = employee.penaltyType || 'per_5_minutes';
  const penaltyAmount = employee.penaltyAmount || 0;
  
  // Извлекаем все смены из всех найденных записей
  const allShifts: any[] = [];
  for (const record of attendanceRecords) {
    for (const [date, shift] of Object.entries(record.shifts)) {
      // Проверяем, попадает ли дата в нужный диапазон
      const shiftDate = new Date(date);
      if (shiftDate >= startDate && shiftDate <= endDate) {
        allShifts.push(shift);
      }
    }
  }
  
  // Штрафы за опоздания: рассчитываем в зависимости от типа штрафа
 const lateShifts = allShifts.filter((shift: any) => shift.lateMinutes && shift.lateMinutes > 0);
  
  for (const shift of lateShifts) {
    if (shift.lateMinutes) {
      switch (penaltyType) {
        case 'per_minute':
          // Штраф за каждую минуту опоздания
          latePenalties += shift.lateMinutes * penaltyAmount;
          break;
        case 'per_5_minutes':
          // Штраф за каждые 5 минут опоздания
          latePenalties += Math.ceil(shift.lateMinutes / 5) * penaltyAmount;
          break;
        case 'per_10_minutes':
          // Штраф за каждые 10 минут опоздания
          latePenalties += Math.ceil(shift.lateMinutes / 10) * penaltyAmount;
          break;
        case 'fixed':
          // Фиксированная сумма за опоздание
          latePenalties += penaltyAmount;
          break;
        case 'percent':
          // Процент от ставки за опоздание - для этого нужно знать ставку за день
          // Используем базовую зарплату для расчета
          const dailyRate = calculateDailyRate(employee);
          latePenalties += (dailyRate * penaltyAmount) / 100;
          break;
        default:
          // По умолчанию - штраф за каждые 5 минут
          latePenalties += Math.ceil(shift.lateMinutes / 5) * penaltyAmount;
      }
    }
 }
  
  // Штрафы за неявки: 630 тг за каждый случай (60*10,5 минут как в задании)
  const absenceShifts = allShifts.filter((shift: any) => shift.status === 'no_show');
  absencePenalties = absenceShifts.length * 630;
  
  totalPenalty = latePenalties + absencePenalties;
  
  return {
    totalPenalty,
    latePenalties,
    absencePenalties,
    attendanceRecords
  };
};

/**
 * Рассчитывает дневную ставку сотрудника на основе его зарплаты и типа оплаты
 */
const calculateDailyRate = (employee: IUser): number => {
  const salary = employee.salary || 0;
  const salaryType = employee.salaryType || 'per_month';
  const shiftRate = employee.shiftRate || 0;
  
  switch (salaryType) {
    case 'per_month':
      // Если зарплата в месяц, делим на 2 рабочих дня
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
};

/**
 * Автоматически рассчитывает зарплаты для всех сотрудников за указанный месяц
 */
export const autoCalculatePayroll = async (month: string, settings: PayrollAutomationSettings) => {
  try {
    console.log(`Начинаем автоматический расчет зарплат за ${month}`);
    
    // Получаем всех активных сотрудников
    const staff = await User.find({ 
      type: 'adult', 
      status: { $ne: 'inactive' } 
    });
    
    console.log(`Найдено ${staff.length} сотрудников для расчета`);
    
    const results = [];
    
    for (const employee of staff) {
      console.log(`🔍 Обработка сотрудника: ${employee.fullName}, ID: ${(employee as any)._id}`);
      
      // Формат month: YYYY-MM
      const startDate = new Date(`${month}-01`);
      const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
      
      // Получаем посещаемость сотрудника за указанный месяц
      const attendanceRecords: IStaffShift[] = await StaffShift.find({
        staffId: (employee as any)._id,
        "shifts.date": {
          $gte: startDate.toISOString().split('T')[0],
          $lte: endDate.toISOString().split('T')[0]
        }
      });
      
      // Рассчитываем штрафы для сотрудника из посещаемости
      const attendancePenalties = await calculatePenalties((employee as any)._id.toString(), month, employee);
      console.log(`📊 Штрафы из посещаемости для ${employee.fullName}:`, attendancePenalties);
      
      // Получаем базовую информацию о сотруднике (оклад и тип оплаты)
      const baseSalary = employee.salary || 0;
      const baseSalaryType = employee.salaryType || 'per_month';
      const shiftRate = employee.shiftRate || 0;
      
      // Рассчитываем начисления в зависимости от типа оплаты
      let accruals = 0;
      switch (baseSalaryType) {
        case 'per_month':
          accruals = baseSalary;
          break;
        case 'per_day':
          // Для дневной оплаты умножаем на количество рабочих дней в месяце
          // Временно используем 22 рабочих дня в месяце
          const workDays = 22;
          accruals = baseSalary * workDays;
          break;
        case 'per_shift':
          // Для оплаты за смену умножаем на количество отработанных смен
          // Извлекаем все смены из всех найденных записей
          const allShiftsForCalc: any[] = [];
          for (const record of attendanceRecords) {
            for (const [date, shift] of Object.entries(record.shifts)) {
              // Проверяем, попадает ли дата в нужный диапазон
              const shiftDate = new Date(date);
              if (shiftDate >= startDate && shiftDate <= endDate) {
                allShiftsForCalc.push(shift);
              }
            }
          }
          const shiftsCount = allShiftsForCalc.filter((shift: any) => shift.status === 'completed' || shift.status === 'in_progress').length;
          accruals = shiftRate * shiftsCount;
          break;
        default:
          accruals = baseSalary;
      }
      
      console.log(`💰 Начисления для ${employee.fullName}: ${accruals} (${baseSalaryType}: ${baseSalary})`);
      
      // Получаем штрафы сотрудника за текущий месяц из коллекции Fine
      const monthStartDate = new Date(`${month}-01`);
      const monthEndDate = new Date(monthStartDate.getFullYear(), monthStartDate.getMonth() + 1, 0);

      const monthlyFines = await Fine.find({
        user: (employee as any)._id,
        date: { $gte: monthStartDate, $lte: monthEndDate }
      });

      const userFinesTotal = monthlyFines.reduce((sum, f) => sum + (f.amount || 0), 0);
      console.log(`📋 Штрафов из коллекции Fine за месяц для ${employee.fullName}: ${monthlyFines.length}, сумма: ${userFinesTotal}`);
      
      // Общий итог штрафов: штрафы из посещаемости + штрафы из профиля сотрудника
      const totalPenalties = attendancePenalties.totalPenalty + userFinesTotal;
      console.log(`💰 Общие штрафы для ${employee.fullName}: ${totalPenalties} (посещаемость: ${attendancePenalties.totalPenalty} + профиль: ${userFinesTotal})`);
      
      // Создаем или обновляем запись о зарплате
      let payroll = await Payroll.findOne({
        staffId: employee._id,
        month
      });
      
      if (payroll) {
        // Обновляем существующую запись
        payroll.accruals = accruals;
        payroll.penalties = totalPenalties;
        payroll.latePenalties = attendancePenalties.latePenalties;
        payroll.absencePenalties = attendancePenalties.absencePenalties;
        payroll.userFines = userFinesTotal;
        payroll.total = accruals - totalPenalties;
        
        // Добавляем дополнительные поля
        payroll.baseSalary = baseSalary;
        // Преобразуем типы из формата User в формат Payroll
        payroll.baseSalaryType = baseSalaryType === 'per_day' ? 'day' :
                                baseSalaryType === 'per_month' ? 'month' :
                                baseSalaryType === 'per_shift' ? 'shift' : 'month';
        payroll.shiftRate = shiftRate;
        payroll.penaltyDetails = {
          type: employee.penaltyType || 'per_5_minutes',
          amount: employee.penaltyAmount || 0,
          latePenalties: attendancePenalties.latePenalties,
          absencePenalties: attendancePenalties.absencePenalties,
          userFines: userFinesTotal
        };
        
        await payroll.save();
      } else {
        // Создаем новую запись
        payroll = new Payroll({
          staffId: employee._id,
          month,
          accruals: accruals,
          penalties: totalPenalties,
          latePenalties: attendancePenalties.latePenalties,
          absencePenalties: attendancePenalties.absencePenalties,
          userFines: userFinesTotal,
          total: accruals - totalPenalties,
          status: 'calculated',
          
          // Добавляем дополнительные поля
          baseSalary: baseSalary,
          // Преобразуем типы из формата User в формат Payroll
          baseSalaryType: baseSalaryType === 'per_day' ? 'day' :
                          baseSalaryType === 'per_month' ? 'month' :
                          baseSalaryType === 'per_shift' ? 'shift' : 'month',
          shiftRate: shiftRate,
          penaltyDetails: {
            type: employee.penaltyType || 'per_5_minutes',
            amount: employee.penaltyAmount || 0,
            latePenalties: attendancePenalties.latePenalties,
            absencePenalties: attendancePenalties.absencePenalties,
            userFines: userFinesTotal
          }
        });
        await payroll.save();
      }
      
      results.push({
        staffId: employee._id,
        staffName: employee.fullName,
        baseSalary,
        penalties: totalPenalties,
        total: payroll.total
      });
      
      console.log(`Рассчитана зарплата для ${employee.fullName}: ${payroll.total}`);
    }
    
    // Если включена автоматическая очистка данных, очищаем штрафы за прошедший период
    if (settings.autoClearData) {
      await clearAttendancePenalties(month);
    }
    
    console.log(`Завершен автоматический расчет зарплат за ${month}. Обработано: ${results.length} сотрудников`);
    
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
    await Payroll.updateMany(
      { month },
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
    await StaffShift.updateMany(
      {
        "shifts.date": {
          $gte: new Date(`${month}-01`).toISOString().split('T')[0],
          $lte: new Date(new Date(`${month}-01`).getFullYear(), new Date(`${month}-01`).getMonth() + 1, 0).toISOString().split('T')[0]
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
    const payrolls = await Payroll.find({ month })
      .populate('staffId', 'fullName email salary');
    
    // Формируем данные отчета
    const reportData = {
      month,
      totalEmployees: payrolls.length,
      totalPayroll: payrolls.reduce((sum, p) => sum + p.total, 0),
      details: payrolls.map(p => ({
        staffName: (p.staffId as any).fullName,
        baseSalary: (p.staffId as any).salary,
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