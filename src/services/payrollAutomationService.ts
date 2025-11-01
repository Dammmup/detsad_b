import Payroll from '.././entities/payroll/model';
import Shift, { IShift } from '.././entities/staffShifts/model';
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
const calculatePenalties = async (staffId: string, month: string, employee: IUser) => {
  // Формат month: YYYY-MM
  const startDate = new Date(`${month}-01`);
  const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
  
  // Получаем посещаемость сотрудника за указанный месяц
  const attendanceRecords: IShift[] = await Shift().find({
    staffId,
    date: {
      $gte: startDate.toISOString().split('T')[0],
      $lte: endDate.toISOString().split('T')[0]
    }
  });
  
  let totalPenalty = 0;
  let latePenalties = 0;
  let absencePenalties = 0;
  
  // В новой архитектуре параметры штрафов могут быть в связанной записи зарплаты
 // или в отдельной коллекции настроек. Пока используем значения по умолчанию.
  const penaltyType: string = (employee as any).penaltyType || 'per_5_minutes';
  const penaltyAmount: number = Number((employee as any).penaltyAmount ?? 500);
  
  // В новой архитектуре "1 смена - 1 запись", attendanceRecords уже содержит все смены
  // для указанного сотрудника в заданном диапазоне дат
  const allShifts = attendanceRecords;
  
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
  const salaryType = ((employee as any).salaryType as string) || 'month';
  const salary = Number((employee as any).salary || 0);
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
const getWorkingDaysInMonth = async (date: Date): Promise<number> => {
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

// Смена засчитывается, если завершена и checkout не позже расписания
const shouldCountShift = (shift: any): boolean => {
  if (shift.status !== 'completed') return false;
  if (!shift.actualEnd || !shift.endTime) return false;
  const actualEndTime = new Date(`${shift.date} ${shift.actualEnd}`);
  const scheduledEndTime = new Date(`${shift.date} ${shift.endTime}`);
  return actualEndTime.getTime() <= scheduledEndTime.getTime();
};

/**
 * Автоматически рассчитывает зарплаты для всех сотрудников за указанный месяц
 */
export const autoCalculatePayroll = async (month: string, settings: PayrollAutomationSettings) => {
  try {
    console.log(`Начинаем автоматический расчет зарплат за ${month}`);
    
    // Получаем всех активных сотрудников (кроме админов)
    const staff = await User().find({ 
      role: { $ne: 'admin' },
      isActive: true
    });
    
    console.log(`Найдено ${staff.length} сотрудников для расчета`);
    
    const results: Array<{
      staffId: string;
      staffName: string;
      baseSalary: number;
      penalties: number;
      total: number;
    }> = [];
    
    for (const employee of staff) {
      console.log(`🔍 Обработка сотрудника: ${employee.fullName}, ID: ${(employee as any)._id}`);
      
      // Формат month: YYYY-MM
      const startDate = new Date(`${month}-01`);
      const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
      
      // Получаем посещаемость сотрудника за указанный месяц
      const attendanceRecords: IShift[] = await Shift().find({
        staffId: (employee as any)._id,
        date: {
          $gte: startDate.toISOString().split('T')[0],
          $lte: endDate.toISOString().split('T')[0]
        }
      });
      
      // Рассчитываем штрафы для сотрудника из посещаемости
      const attendancePenalties = await calculatePenalties((employee as any)._id.toString(), month, employee);
      console.log(`📊 Штрафы из посещаемости для ${employee.fullName}:`, attendancePenalties);
      
      // Берем настройки зарплаты из пользователя
      const baseSalary = Number((employee as any).salary || 0);
      let baseSalaryType: string = ((employee as any).salaryType as string) || 'month';
      const shiftRate = Number((employee as any).shiftRate || 0);
      
      // Рассчитываем начисления в зависимости от типа оплаты
      let accruals = 0;
      const countedShifts = attendanceRecords.filter(s => shouldCountShift(s));
      switch (baseSalaryType) {
        case 'month': {
          const workDaysInMonth = await getWorkingDaysInMonth(startDate);
          accruals = workDaysInMonth > 0 ? (baseSalary / workDaysInMonth) * countedShifts.length : 0;
          break;
        }
        case 'day': {
          // Оплата за день * количество дней, когда смена засчитана
          accruals = baseSalary * countedShifts.length;
          break;
        }
        case 'shift': {
          accruals = shiftRate * countedShifts.length;
          break;
        }
        default:
          accruals = baseSalary;
      }
      
      console.log(`💰 Начисления для ${employee.fullName}: ${accruals} (${baseSalaryType}: ${baseSalary})`);
      
      // Получаем штрафы сотрудника за текущий месяц из коллекции Payroll
      // В новой архитектуре штрафы хранятся в записи зарплаты
      const payrollRecord = await Payroll().findOne({
        staffId: (employee as any)._id,
        period: month
      });

      const userFinesTotal = payrollRecord?.userFines || 0;
      console.log(`📋 Штрафов из коллекции Payroll за месяц для ${employee.fullName}: ${userFinesTotal}`);
      
      // Общий итог штрафов: штрафы из посещаемости + штрафы из профиля сотрудника
      const totalPenalties = attendancePenalties.totalPenalty + userFinesTotal;
      console.log(`💰 Общие штрафы для ${employee.fullName}: ${totalPenalties} (посещаемость: ${attendancePenalties.totalPenalty} + профиль: ${userFinesTotal})`);
      
      // Создаем или обновляем запись о зарплате
      let payroll = await Payroll().findOne({
        staffId: employee._id,
        period: month
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
        payroll.baseSalaryType = baseSalaryType;
        payroll.shiftRate = shiftRate;
        payroll.penaltyDetails = {
          type: 'per_5_minutes', // используем значение по умолчанию
          amount: 0, // используем значение по умолчанию
          latePenalties: attendancePenalties.latePenalties,
          absencePenalties: attendancePenalties.absencePenalties,
          userFines: userFinesTotal
        };
        
        await payroll.save();
      } else {
        // Создаем новую запись
        payroll = new (Payroll())({
          staffId: employee._id,
          period: month,
          accruals: accruals,
          penalties: totalPenalties,
          latePenalties: attendancePenalties.latePenalties,
          absencePenalties: attendancePenalties.absencePenalties,
          userFines: userFinesTotal,
          total: accruals - totalPenalties,
          status: 'draft',
          
          // Добавляем дополнительные поля
          baseSalary: baseSalary,
          // Преобразуем типы из формата User в формат Payroll
          baseSalaryType: baseSalaryType,
          shiftRate: shiftRate,
          penaltyDetails: {
            type: 'per_5_minutes', // используем значение по умолчанию
            amount: 0, // используем значение по умолчанию
            latePenalties: attendancePenalties.latePenalties,
            absencePenalties: attendancePenalties.absencePenalties,
            userFines: userFinesTotal
          }
        });
        await payroll.save();
      }
      
      results.push({
        staffId: (employee._id as unknown as string),
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
    await Shift().updateMany(
      {
        date: {
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