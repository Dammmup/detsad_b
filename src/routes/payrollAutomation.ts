import express from 'express';
import { manualRunPayrollAutomation } from '../services/payrollAutomationService';

const router = express.Router();

/**
 * Ручной запуск автоматического расчета зарплат
 * POST /payroll-automation/manual-run
 */
router.post('/manual-run', async (req, res) => {
  try {
    const { month, settings } = req.body;
    
    // Валидация входных данных
    if (!month || !settings) {
      return res.status(400).json({
        success: false,
        message: 'Требуются параметры month и settings'
      });
    }
    
    // Валидация формата месяца (YYYY-MM)
    const monthRegex = /^\d{4}-\d{2}$/;
    if (!monthRegex.test(month)) {
      return res.status(400).json({
        success: false,
        message: 'Неверный формат месяца. Используйте формат YYYY-MM'
      });
    }
    
    // Валидация настроек
    if (!settings.autoCalculationDay || !settings.emailRecipients) {
      return res.status(400).json({
        success: false,
        message: 'Настройки должны содержать autoCalculationDay и emailRecipients'
      });
    }
    
    console.log(`Ручной запуск автоматического расчета зарплат за ${month}`);
    
    // Выполняем ручной запуск
    await manualRunPayrollAutomation(month, settings);
    
    res.json({
      success: true,
      message: `Автоматический расчет зарплат за ${month} успешно выполнен`
    });
  } catch (error: any) {
    console.error('Ошибка при ручном запуске автоматического расчета:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при выполнении автоматического расчета',
      error: error.message
    });
  }
});

/**
 * Получение статуса автоматического расчета
 * GET /payroll-automation/status
 */
router.get('/status', (req, res) => {
  try {
    // В реальной системе здесь будет информация о статусе последнего расчета
    res.json({
      success: true,
      data: {
        lastRun: null,
        nextRun: null,
        isEnabled: true,
        settings: {
          autoCalculationDay: 25,
          emailRecipients: 'admin@example.com',
          autoClearData: true
        }
      }
    });
  } catch (error: any) {
    console.error('Ошибка при получении статуса автоматического расчета:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при получении статуса автоматического расчета',
      error: error.message
    });
  }
});

export default router;