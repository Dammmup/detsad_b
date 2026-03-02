import express from 'express';
import { handleTelegramWebhook, setTelegramWebhook, deleteTelegramWebhook, getWebhookInfo } from '../services/telegramBot';

const router = express.Router();

/**
 * POST /telegram/webhook
 * Обработка входящих сообщений от Telegram
 */
router.post('/webhook', async (req, res) => {
  try {
    console.log('📩 Telegram webhook получен:', JSON.stringify(req.body, null, 2));

    // ВАЖНО: На Vercel Serverless нужно СНАЧАЛА обработать, ПОТОМ ответить
    // Иначе функция завершится до отправки ответа пользователю
    await handleTelegramWebhook(req.body);

    // Telegram ожидает 200 OK
    res.status(200).send('OK');
  } catch (error) {
    console.error('Ошибка обработки Telegram webhook:', error);
    // Всё равно отвечаем 200, чтобы Telegram не повторял запрос
    res.status(200).send('OK');
  }
});

/**
 * GET /telegram/webhook-info
 * Получение информации о текущем webhook
 */
router.get('/webhook-info', async (req, res) => {
  try {
    const info = await getWebhookInfo();
    res.json(info);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /telegram/set-webhook
 * Установка webhook URL
 * Body: { url: string }
 */
router.post('/set-webhook', async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL не указан' });
    }

    const result = await setTelegramWebhook(url);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /telegram/delete-webhook
 * Удаление webhook
 */
router.post('/delete-webhook', async (req, res) => {
  try {
    const result = await deleteTelegramWebhook();
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /telegram/run-tasks
 * Запуск запланированных задач (для Vercel Crons)
 * Query params: 
 * - key: секретный ключ (из env.CRON_SECRET)
 * - task: имя задачи (morning, evening, summary, payroll, childpay, archive, events, push-morning, push-children, push-evening)
 */
router.get('/run-tasks', async (req, res) => {
  const { key, task } = req.query;

  // Простейшая проверка безопасности
  const CRON_SECRET = process.env.CRON_SECRET || 'local-debug-key';
  if (key !== CRON_SECRET) {
    console.warn(`[CRON] Попытка несанкционированного доступа к задачам. Ключ: ${key}`);
    return res.status(401).json({ error: 'Unauthorized' });
  }

  console.log(`[CRON] Получен запрос на запуск задачи: ${task}`);

  try {
    const scheduler = await import('../services/taskScheduler');

    switch (task) {
      case 'morning':
        await scheduler.sendMorningAttendanceReport();
        break;
      case 'evening':
        await scheduler.sendEveningAttendanceReport();
        break;
      case 'summary':
        await scheduler.sendDailySummaryReport();
        break;
      case 'payroll':
        await scheduler.runDailyPayrollAutomation();
        break;
      case 'childpay':
        await scheduler.runMonthlyChildPayments();
        break;
      case 'archive':
        await scheduler.runAutoArchiving();
        break;
      case 'events':
        await scheduler.runMainEventsCheck();
        break;
      case 'push-morning':
        await scheduler.sendPushMorningReminder();
        break;
      case 'push-children':
        await scheduler.sendPushChildrenReminder();
        break;
      case 'push-evening':
        await scheduler.sendPushEveningReminder();
        break;
      default:
        return res.status(400).json({ error: `Unknown task: ${task}` });
    }

    res.json({ success: true, task });
  } catch (error: any) {
    console.error(`[CRON] Ошибка выполнения задачи ${task}:`, error);
    res.status(500).json({ error: error.message });
  }
});

export default router;

