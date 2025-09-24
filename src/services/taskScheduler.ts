import cron from 'node-cron';
import { runPayrollAutomation } from './payrollAutomationService';

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
  
  console.log('Планировщик задач инициализирован. Автоматический расчет зарплат будет выполняться ежедневно в 01:00');
};

/**
 * Функция для немедленного запуска всех запланированных задач (для тестирования)
 */
export const runAllScheduledTasks = async () => {
  console.log('Немедленный запуск всех запланированных задач...');
  await runPayrollAutomation();
  console.log('Все запланированные задачи выполнены');
};