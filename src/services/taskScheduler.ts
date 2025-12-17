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
  console.log('Инициализация планировщика задач...');



  cron.schedule('0 1 * * *', async () => {
    console.log('Запуск запланированной задачи: автоматический расчет зарплат');
    try {
      await runPayrollAutomation();
      console.log('Запланированная задача выполнена успешно');
    } catch (error) {
      console.error('Ошибка при выполнении запланированной задачи:', error);
    }
  });


  cron.schedule('0 2 1 * *', async () => {
    console.log('Запуск запланированной задачи: генерация ежемесячных оплат за детей');
    try {
      await generateMonthlyChildPayments();
      console.log('Генерация ежемесячных оплат за детей выполнена успешно');
    } catch (error) {
      console.error('Ошибка при выполнении генерации ежемесячных оплат:', error);
    }
  });


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

  // Автоматическое архивирование данных старше 3 месяцев (1-го числа каждого месяца в 03:00)
  cron.schedule('0 3 1 * *', async () => {
    console.log('Запуск запланированной задачи: архивирование старых данных');
    try {
      await archiveAndDeleteRecords();
      console.log('Архивирование данных выполнено успешно');
    } catch (error) {
      console.error('Ошибка при архивировании данных:', error);
    }
  });


  cron.schedule('0 10 * * *', async () => {
    try {
      const now = new Date();
      const timeInAstana = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Almaty" }));
      if (timeInAstana.getHours() === 10) {
        const shifts = await Shift().find({ date: now.toISOString().split('T')[0] });
        const attendanceRecords = await StaffAttendanceTracking().find({
          date: { $gte: new Date(now.setHours(0, 0, 0, 0)), $lt: new Date(now.setHours(23, 59, 59, 999)) },
          actualStart: { $ne: null }
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


  cron.schedule('0 18 * * *', async () => {
    try {
      const now = new Date();
      const timeInAstana = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Almaty" }));
      if (timeInAstana.getHours() === 18) {
        const shifts = await Shift().find({ date: now.toISOString().split('T')[0] });
        const attendanceRecords = await StaffAttendanceTracking().find({
          date: { $gte: new Date(now.setHours(0, 0, 0, 0)), $lt: new Date(now.setHours(23, 59, 999)) },
          actualEnd: { $ne: null }
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

  // Ежедневный отчёт в 19:00 по Астане (14:00 UTC)
  cron.schedule('0 14 * * *', async () => {
    try {
      const now = new Date();
      const today = now.toISOString().split('T')[0];

      // Получаем все смены на сегодня
      const shifts = await Shift().find({ date: today });

      if (shifts.length === 0) {
        await sendLogToTelegram(`📊 <b>Итоги дня: ${new Date().toLocaleDateString('ru-RU')}</b>\n\nНа сегодня нет назначенных смен.`);
        return;
      }

      // Получаем записи посещаемости за сегодня
      const startOfDay = new Date(now);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(now);
      endOfDay.setHours(23, 59, 59, 999);

      const attendanceRecords = await StaffAttendanceTracking().find({
        date: { $gte: startOfDay, $lt: endOfDay }
      }).populate('staffId', 'fullName');

      // Получаем данные о сотрудниках
      const staffIds = shifts.map(shift => shift.staffId);
      const users = await User().find({ _id: { $in: staffIds } });
      const usersMap = new Map(users.map((u: any) => [u._id.toString(), u.fullName]));

      // Анализируем данные
      const lateArrivals: Array<{ name: string; minutes: number }> = [];
      const noCheckIn: Array<{ name: string; shift: string }> = [];
      const noCheckOut: Array<{ name: string; checkIn: string }> = [];
      let okCount = 0;

      const attendanceMap = new Map(attendanceRecords.map((r: any) => [r.staffId?._id?.toString() || '', r]));

      for (const shift of shifts) {
        const staffId = shift.staffId.toString();
        const staffName = usersMap.get(staffId) || 'Неизвестно';
        const attendance: any = attendanceMap.get(staffId);

        if (!attendance || !attendance.actualStart) {
          // Не отметил приход
          noCheckIn.push({ name: staffName, shift: `${shift.startTime}-${shift.endTime}` });
        } else if (!attendance.actualEnd) {
          // Не отметил уход
          const checkInTime = new Date(attendance.actualStart).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
          noCheckOut.push({ name: staffName, checkIn: checkInTime });
        } else if (attendance.lateMinutes && attendance.lateMinutes > 0) {
          // Опоздал
          lateArrivals.push({ name: staffName, minutes: attendance.lateMinutes });
        } else {
          okCount++;
        }
      }

      // Формируем сообщение
      let message = `📊 <b>Итоги дня: ${new Date().toLocaleDateString('ru-RU')}</b>\n`;

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

      if (okCount > 0) {
        message += `\n✅ Всё в порядке: ${okCount} сотрудников`;
      }

      if (lateArrivals.length === 0 && noCheckIn.length === 0 && noCheckOut.length === 0) {
        message += `\n✅ Все сотрудники отметились вовремя!`;
      }

      await sendLogToTelegram(message);
      console.log('Ежедневный отчёт отправлен в Telegram');

    } catch (error) {
      console.error('Ошибка при отправке ежедневного отчёта:', error);
    }
  });



  console.log('Планировщик задач инициализирован. Автоматический расчет зарплат будет выполняться ежедневно в 01:00');
  console.log('Проверка событий mainEvents будет выполняться ежедневно в 00:00');
  console.log('Ежедневный отчёт в Telegram будет отправляться в 19:00 по Астане');
};