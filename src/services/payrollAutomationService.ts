import Payroll from '../models/Payroll';
import StaffAttendance from '../models/StaffAttendance';
import User, { IUser } from '../models/Users';
import Fine from '../models/Fine';
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
const calculatePenalties = async (staffId: string, month: string) => {
  // Формат month: YYYY-MM
  const startDate = new Date(`${month}-01`);
  const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
  
  // Получаем посещаемость сотрудника за указанный месяц
  const attendanceRecords = await StaffAttendance.find({
    staffId,
    date: {
      $gte: startDate,
      $lte: endDate
    }
  });
  
  let totalPenalty = 0;
  let latePenalties = 0;
  let absencePenalties = 0;
  
  // Штрафы за опоздания: 100 тг за каждые 5 минут опоздания
 const lateRecords = attendanceRecords.filter(record => record.lateMinutes && record.lateMinutes > 0);
  latePenalties = lateRecords.reduce((sum, record) => {
    if (record.lateMinutes) {
      return sum + Math.ceil(record.lateMinutes / 5) * 100;
    }
    return sum;
  }, 0);
  
  // Штрафы за неявки: 630 тг за каждый случай (60*10,5 минут как в задании)
  const absenceRecords = attendanceRecords.filter(record => record.status === 'no_show');
  absencePenalties = absenceRecords.length * 630;
  
  totalPenalty = latePenalties + absencePenalties;
  
  return {
    totalPenalty,
    latePenalties,
    absencePenalties,
    attendanceRecords
  };
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
      
      // Рассчитываем штрафы для сотрудника из посещаемости
      const attendancePenalties = await calculatePenalties((employee as any)._id.toString(), month);
      console.log(`📊 Штрафы из посещаемости для ${employee.fullName}:`, attendancePenalties);
      
      // Получаем базовую информацию о сотруднике (оклад)
      const baseSalary = employee.salary || 0;
      console.log(`💰 Оклад для ${employee.fullName}: ${baseSalary}`);
      
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
        payroll.accruals = baseSalary;
        payroll.penalties = totalPenalties;
        // @ts-ignore - игнорируем ошибки TypeScript для дополнительных полей
        payroll.latePenalties = attendancePenalties.latePenalties;
        // @ts-ignore - игнорируем ошибки TypeScript для дополнительных полей
        payroll.absencePenalties = attendancePenalties.absencePenalties;
        // @ts-ignore - игнорируем ошибки TypeScript для дополнительных полей
        payroll.userFines = userFinesTotal;
        payroll.total = baseSalary - totalPenalties;
        await payroll.save();
      } else {
        // Создаем новую запись
        payroll = new Payroll({
          staffId: employee._id,
          month,
          accruals: baseSalary,
          bonuses: 0, // Пока без премий
          penalties: totalPenalties,
          // @ts-ignore - игнорируем ошибки TypeScript для дополнительных полей
          latePenalties: attendancePenalties.latePenalties,
          // @ts-ignore - игнорируем ошибки TypeScript для дополнительных полей
          absencePenalties: attendancePenalties.absencePenalties,
          // @ts-ignore - игнорируем ошибки TypeScript для дополнительных полей
          userFines: userFinesTotal,
          total: baseSalary - totalPenalties,
          status: 'calculated'
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
    await StaffAttendance.updateMany(
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