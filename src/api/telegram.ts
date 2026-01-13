import express from 'express';
import { handleTelegramWebhook, setTelegramWebhook, deleteTelegramWebhook, getWebhookInfo } from '../services/telegramBot';

const router = express.Router();

/**
 * POST /telegram/webhook
 * Обработка входящих сообщений от Telegram
 */
router.post('/webhook', async (req, res) => {
  try {
    // Telegram ожидает быстрый ответ 200 OK
    res.status(200).send('OK');

    // Обрабатываем update асинхронно
    await handleTelegramWebhook(req.body);
  } catch (error) {
    console.error('Ошибка обработки Telegram webhook:', error);
    // Всё равно отвечаем 200, чтобы Telegram не повторял запрос
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

