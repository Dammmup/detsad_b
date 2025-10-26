import cron from 'node-cron';
import { runPayrollAutomation } from './payrollAutomationService';
import { MainEventsService } from '../entities/mainEvents/service';
import { AbsenceTrackingService } from '../entities/absenceTracking/absenceTrackingService';

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
  
  // Запускаем автоматическую отметку отсутствия каждый день в 23:59 (в конце дня)
  cron.schedule('59 23 * * *', async () => {
    console.log('Запуск запланированной задачи: автоматическая отметка отсутствия');
    try {
      const absenceTrackingService = new AbsenceTrackingService();
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0]; // YYYY-MM-DD
      
      await absenceTrackingService.markAllAbsencesForDay(yesterdayStr);
      console.log(`Автоматическая отметка отсутствия за ${yesterdayStr} выполнена успешно`);
    } catch (error) {
      console.error('Ошибка при выполнении автоматической отметки отсутствия:', error);
    }
  });
  
  console.log('Планировщик задач инициализирован. Автоматический расчет зарплат будет выполняться ежедневно в 01:00');
  console.log('Проверка событий mainEvents будет выполняться ежедневно в 00:00');
  console.log('Автоматическая отметка отсутствия будет выполняться ежедневно в 23:59');
};

/**
 * Функция для немедленного запуска всех запланированных задач (для тестирования)
 */
export const runAllScheduledTasks = async () => {
  console.log('Немедленный запуск всех запланированных задач...');
  await runPayrollAutomation();
  console.log('Все запланированные задачи выполнены');
};