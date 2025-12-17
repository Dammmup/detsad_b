import { Request, Response } from 'express';
import {
  runPayrollAutomation as runPayrollAutomationService,
  manualRunPayrollAutomation as manualRunPayrollAutomationService
} from '../../../services/payrollAutomationService';



let automationSettings = {
  autoCalculationDay: 25,
  emailRecipients: 'admin@example.com',
  autoClearData: true
};

export const runPayrollAutomationController = async (req: Request, res: Response) => {
  try {
    console.log('Запуск автоматического расчета зарплат');


    await runPayrollAutomationService();

    res.json({ message: 'Автоматический расчет зарплат успешно запущен' });
  } catch (error) {
    console.error('Ошибка при запуске автоматического расчета зарплат:', error);
    res.status(500).json({ error: 'Ошибка при запуске автоматического расчета зарплат' });
  }
};

export const manualRunPayrollAutomationController = async (req: Request, res: Response) => {
  try {
    const { month, settings } = req.body;

    if (!month) {
      return res.status(400).json({ error: 'Требуется указать месяц для расчета' });
    }

    console.log(`Ручной запуск автоматического расчета за ${month}`);


    await manualRunPayrollAutomationService(month, settings || automationSettings);

    res.json({ message: `Ручной автоматический расчет за ${month} успешно выполнен` });
  } catch (error) {
    console.error('Ошибка при выполнении ручного автоматического расчета зарплат:', error);
    res.status(500).json({ error: 'Ошибка при выполнении ручного автоматического расчета зарплат' });
  }
};

export const getPayrollAutomationSettings = (req: Request, res: Response) => {
  try {
    res.json(automationSettings);
  } catch (error) {
    console.error('Ошибка при получении настроек автоматизации:', error);
    res.status(500).json({ error: 'Ошибка при получении настроек автоматизации' });
  }
};

export const updatePayrollAutomationSettings = (req: Request, res: Response) => {
  try {
    const { autoCalculationDay, emailRecipients, autoClearData } = req.body;

    if (autoCalculationDay !== undefined) {
      automationSettings.autoCalculationDay = autoCalculationDay;
    }
    if (emailRecipients !== undefined) {
      automationSettings.emailRecipients = emailRecipients;
    }
    if (autoClearData !== undefined) {
      automationSettings.autoClearData = autoClearData;
    }

    res.json({
      message: 'Настройки автоматизации успешно обновлены',
      settings: automationSettings
    });
  } catch (error) {
    console.error('Ошибка при обновлении настроек автоматизации:', error);
    res.status(500).json({ error: 'Ошибка при обновлении настроек автоматизации' });
  }
};