import cron from 'node-cron';
import { runPayrollAutomation } from './payrollAutomationService';
import { MainEventsService } from '../entities/mainEvents/service';
import { sendLogToTelegram } from '../utils/telegramLogger';
import Shift from '../entities/staffShifts/model';
import StaffAttendanceTracking from '../entities/staffAttendanceTracking/model';
import User from '../entities/users/model';
import { generateMonthlyChildPayments } from './childPaymentGenerator';

/**
 * Инициализирует планировщик задач для автоматического расчета зарплат
 */
export const initializeTaskScheduler = () => {
  console.log('Инициализация планировщика задач...');
  
  // Запускаем автоматический расчет зарплат каждый день в 01:00
  // Это позволит системе выполнять расчеты в начале каждого дня
  cron.schedule('0 1 * * *', async () => {
    console.log('Запуск запланированной задачи: автоматический расчет зарплат');
    try {
      await runPayrollAutomation();
      console.log('Запланированная задача выполнена успешно');
    } catch (error) {
      console.error('Ошибка при выполнении запланированной задачи:', error);
    }
  });

  // Запускаем генерацию оплат за детей 1-го числа каждого месяца в 02:00
  cron.schedule('0 2 1 * *', async () => {
    console.log('Запуск запланированной задачи: генерация ежемесячных оплат за детей');
    try {
      await generateMonthlyChildPayments();
      console.log('Генерация ежемесячных оплат за детей выполнена успешно');
    } catch (error) {
      console.error('Ошибка при выполнении генерации ежемесячных оплат:', error);
    }
  });
  
  // Запускаем проверку и выполнение событий mainEvents каждый день в 00:00
  cron.schedule('0 0 * * *', async () => {
    console.log('Запуск запланированной задачи: проверка событий mainEvents');
    try {
      const mainEventsService = new MainEventsService();
      const results = await mainEventsService.checkAndExecuteScheduledEvents();
      console.log('Задачи mainEvents выполнены успешно:', results);
    } catch (error) {
      console.error('Ошибка при выполнении задач mainEvents:', error);
    }
 });
  
  // Отправляем уведомление о приходе сотрудников в 10:00 по времени Астаны
  cron.schedule('0 10 * * *', async () => {
    try {
      const now = new Date();
      const timeInAstana = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Almaty"}));
      if (timeInAstana.getHours() === 10) {
        const shifts = await Shift().find({ date: now.toISOString().split('T')[0] });
        const attendanceRecords = await StaffAttendanceTracking().find({
          date: { $gte: new Date(now.setHours(0, 0, 0, 0)), $lt: new Date(now.setHours(23, 59, 59, 999)) },
          actualStart: { $ne: null } // Учитываем только тех, кто отметил приход
        });
        const users = await User().find({
          _id: { $in: shifts.map(shift => shift.staffId) }
        });
        await sendLogToTelegram(`В 10:00 по времени Астаны: отмечен приход ${attendanceRecords.length} сотрудников из ${users.length} назначенных на текущий день`);
      }
    } catch (error) {
      console.error('Ошибка при отправке уведомления о приходе сотрудников:', error);
    }
  });
  
  // Отправляем уведомление об уходе сотрудников в 18:00 по времени Астаны
 cron.schedule('0 18 * * *', async () => {
    try {
      const now = new Date();
      const timeInAstana = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Almaty"}));
      if (timeInAstana.getHours() === 18) {
        const shifts = await Shift().find({ date: now.toISOString().split('T')[0] });
        const attendanceRecords = await StaffAttendanceTracking().find({
          date: { $gte: new Date(now.setHours(0, 0, 0, 0)), $lt: new Date(now.setHours(23, 59, 999)) },
          actualEnd: { $ne: null } // Учитываем только тех, кто отметил уход
        });
        const users = await User().find({
          _id: { $in: shifts.map(shift => shift.staffId) }
        });
        await sendLogToTelegram(`В 18:00 по времени Астаны: отмечен уход ${attendanceRecords.length} сотрудников из ${users.length} назначенных на текущий день`);
      }
    } catch (error) {
      console.error('Ошибка при отправке уведомления об уходе сотрудников:', error);
    }
 });
  

  
  console.log('Планировщик задач инициализирован. Автоматический расчет зарплат будет выполняться ежедневно в 01:00');
  console.log('Проверка событий mainEvents будет выполняться ежедневно в 00:00');
};