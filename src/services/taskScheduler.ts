import cron from 'node-cron';
import { runPayrollAutomation } from './payrollAutomationService';
import { MainEventsService } from '../entities/mainEvents/service';
import { sendLogToTelegram } from '../utils/telegramLogger';
import Shift from '../entities/staffShifts/model';
import StaffAttendanceTracking from '../entities/staffAttendanceTracking/model';
import User from '../entities/users/model';
import { generateMonthlyChildPayments } from './childPaymentGenerator';
import { archiveAndDeleteRecords } from './dataArchiveService';
export const initializeTaskScheduler = () => {
  const ALMATY_TZ = { timezone: "Asia/Almaty" };
  console.log('Инициализация планировщика задач (Asia/Almaty)...');


  // Автоматический расчет зарплат (ежедневно в 01:00 по Астане)
  cron.schedule('0 1 * * *', async () => {
    console.log('Запуск запланированной задачи: автоматический расчет зарплат');
    try {
      await runPayrollAutomation();
      console.log('Запланированная задача выполнена успешно');
    } catch (error) {
      console.error('Ошибка при выполнении запланированной задачи:', error);
    }
  }, ALMATY_TZ);

  // Генерация ежемесячных оплат за детей (1-го числа каждого месяца в 02:00 по Астане)
  cron.schedule('0 2 1 * *', async () => {
    console.log('Запуск запланированной задачи: генерация ежемесячных оплат за детей');
    try {
      await generateMonthlyChildPayments();
      console.log('Генерация ежемесячных оплат за детей выполнена успешно');
    } catch (error) {
      console.error('Ошибка при выполнении генерации ежемесячных оплат:', error);
    }
  }, ALMATY_TZ);

  // Проверка событий mainEvents (ежедневно в 00:00 по Астане)
  cron.schedule('0 0 * * *', async () => {
    console.log('Запуск запланированной задачи: проверка событий mainEvents');
    try {
      const mainEventsService = new MainEventsService();
      await mainEventsService.checkAndExecuteScheduledEvents();
    } catch (error) {
      console.error('Ошибка при выполнении задач mainEvents:', error);
    }
  }, ALMATY_TZ);

  // Автоматическое архивирование (1-го числа каждого месяца в 03:00 по Астане)
  cron.schedule('0 3 1 * *', async () => {
    try {
      await archiveAndDeleteRecords();
      console.log('Архивирование данных выполнено успешно');
    } catch (error) {
      console.error('Ошибка при архивировании данных:', error);
    }
  }, ALMATY_TZ);

  // Отчет о приходе сотрудников (ежедневно в 11:00 по Астане)
  cron.schedule('0 11 * * *', async () => {
    try {
      const now = new Date();
      const almatyDayStr = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Almaty' }); // YYYY-MM-DD

      const staffShifts = await Shift.find({ [`shifts.${almatyDayStr}`]: { $exists: true } });

      const startOfDay = new Date(new Date(now).toLocaleString("en-US", { timeZone: "Asia/Almaty" }));
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(startOfDay);
      endOfDay.setHours(23, 59, 59, 999);

      const attendanceRecords = await StaffAttendanceTracking.find({
        date: { $gte: startOfDay, $lt: endOfDay },
        actualStart: { $ne: null }
      });

      const assignedCount = staffShifts.length;
      await sendLogToTelegram(`🕒 <b>Статус на 11:00 (Астана):</b>\nОтмечен приход <b>${attendanceRecords.length}</b> сотрудников из <b>${assignedCount}</b> назначенных на сегодня.`);
    } catch (error) {
      console.error('Ошибка при отправке уведомления о приходе сотрудников:', error);
    }
  }, ALMATY_TZ);

  // Отчет об уходе сотрудников (ежедневно в 18:00 по Астане)
  cron.schedule('0 18 * * *', async () => {
    try {
      const now = new Date();
      const almatyDayStr = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Almaty' });

      const staffShifts = await Shift.find({ [`shifts.${almatyDayStr}`]: { $exists: true } });

      const startOfDay = new Date(new Date(now).toLocaleString("en-US", { timeZone: "Asia/Almaty" }));
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(startOfDay);
      endOfDay.setHours(23, 59, 59, 999);

      const attendanceRecords = await StaffAttendanceTracking.find({
        date: { $gte: startOfDay, $lt: endOfDay },
        actualEnd: { $ne: null }
      });

      const assignedCount = staffShifts.length;
      await sendLogToTelegram(`🕒 <b>Статус на 18:00 (Астана):</b>\nОтмечен уход <b>${attendanceRecords.length}</b> сотрудников из <b>${assignedCount}</b> назначенных на сегодня.`);
    } catch (error) {
      console.error('Ошибка при отправке уведомления об уходе сотрудников:', error);
    }
  }, ALMATY_TZ);

  // Ежедневный итоговый отчёт в 19:00 по Астане
  cron.schedule('0 19 * * *', async () => {
    try {
      const now = new Date();
      const today = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Almaty' });

      const staffShifts = await Shift.find({ [`shifts.${today}`]: { $exists: true } });

      if (staffShifts.length === 0) {
        await sendLogToTelegram(`📊 <b>Итоги дня: ${today} (Астана)</b>\n\nНа сегодня нет назначенных смен.`);
        return;
      }

      const shifts = staffShifts.map(doc => {
        const detail = doc.shifts.get(today)!;
        return {
          ...detail,
          staffId: doc.staffId,
          date: today
        };
      });

      const startOfDay = new Date(new Date(now).toLocaleString("en-US", { timeZone: "Asia/Almaty" }));
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(startOfDay);
      endOfDay.setHours(23, 59, 59, 999);

      const attendanceRecords = await StaffAttendanceTracking.find({
        date: { $gte: startOfDay, $lt: endOfDay }
      }).populate('staffId', 'fullName');

      const { SettingsService } = await import('../entities/settings/service');
      const settingsService = new SettingsService();
      const settings = await settingsService.getKindergartenSettings();
      const workingStart = settings?.workingHours?.start || '09:00';
      const workingEnd = settings?.workingHours?.end || '18:00';

      const staffIds = staffShifts.map(s => s.staffId);
      const users = await User.find({ _id: { $in: staffIds } });
      const usersMap = new Map(users.map((u: any) => [u._id.toString(), u.fullName]));
      const { escapeHTML } = require('../utils/telegramLogger');

      const lateArrivals: Array<{ name: string; minutes: number }> = [];
      const noCheckIn: Array<{ name: string; shift: string }> = [];
      const noCheckOut: Array<{ name: string; checkIn: string }> = [];
      let okCount = 0;

      const attendanceMap = new Map(attendanceRecords.map((r: any) => [r.staffId?._id?.toString() || '', r]));

      for (const shift of shifts) {
        const staffId = shift.staffId.toString();
        const staffName = usersMap.get(staffId) || 'Неизвестно';
        const attendance: any = attendanceMap.get(staffId);
        const escapedName = escapeHTML(staffName);

        if (!attendance || !attendance.actualStart) {
          noCheckIn.push({ name: escapedName, shift: `${workingStart}-${workingEnd}` });
        } else if (!attendance.actualEnd) {
          const checkInTime = new Date(attendance.actualStart).toLocaleTimeString('ru-RU', {
            timeZone: 'Asia/Almaty',
            hour: '2-digit',
            minute: '2-digit'
          });
          noCheckOut.push({ name: escapedName, checkIn: checkInTime });
        } else if (attendance.lateMinutes && attendance.lateMinutes > 0) {
          lateArrivals.push({ name: escapedName, minutes: attendance.lateMinutes });
        } else {
          okCount++;
        }
      }

      let message = `📊 <b>Итоги дня: ${today} (Астана)</b>\n`;

      if (lateArrivals.length > 0) {
        message += `\n⚠️ <b>Опоздания (${lateArrivals.length}):</b>\n`;
        lateArrivals.forEach(item => {
          message += `• ${item.name} — ${item.minutes} мин\n`;
        });
      }

      if (noCheckIn.length > 0) {
        message += `\n🔴 <b>Не отметили приход (${noCheckIn.length}):</b>\n`;
        noCheckIn.forEach(item => {
          message += `• ${item.name} — смена ${item.shift}\n`;
        });
      }

      if (noCheckOut.length > 0) {
        message += `\n🟡 <b>Не отметили уход (${noCheckOut.length}):</b>\n`;
        noCheckOut.forEach(item => {
          message += `• ${item.name} — приход в ${item.checkIn}\n`;
        });
      }

      if (okCount > 0) message += `\n✅ Всё в порядке: ${okCount} сотрудников`;
      if (lateArrivals.length === 0 && noCheckIn.length === 0 && noCheckOut.length === 0) {
        message += `\n✅ Все сотрудники отметились вовремя!`;
      }

      await sendLogToTelegram(message);
      console.log('Ежедневный отчёт отправлен в Telegram');

    } catch (error) {
      console.error('Ошибка при отправке ежедневного отчёта:', error);
    }
  }, ALMATY_TZ);

  console.log('Планировщик задач инициализирован для часового пояса Asia/Almaty');
};
