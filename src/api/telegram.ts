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

export default router;

