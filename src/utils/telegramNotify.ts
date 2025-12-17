import axios from 'axios';

export async function sendTelegramNotification(chatId: string | undefined, text: string, botToken?: string) {
  try {
    if (!chatId) {
      console.warn('Telegram chatId не предоставлен, уведомление не будет отправлено.');
      return;
    }
    const token = botToken || process.env.TELEGRAM_BOT_TOKEN;
    if (!token) throw new Error('TELEGRAM_BOT_TOKEN not set');
    await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
      chat_id: chatId,
      text,
    });
  } catch (e: any) {
    console.error('Ошибка отправки в Telegram:', e?.response?.data || e.message);
  }
}
