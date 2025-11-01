import axios from 'axios';

export async function sendTelegramNotification(chatId: string, text: string, botToken?: string) {
  try {
    const token = botToken || process.env.TELEGRAM_BOT_TOKEN;
    if (!token) throw new Error('TELEGRAM_BOT_TOKEN not set');
    await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
      chat_id: chatId,
      text,
    });
  } catch (e:any) {
    console.error('Ошибка отправки в Telegram:', e?.response?.data || e.message);
  }
}
