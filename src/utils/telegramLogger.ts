export function escapeHTML(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

import { sendTelegramNotificationToRoles } from './telegramNotifications';

export async function sendLogToTelegram(message: string, customChatId?: string) {
  const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

  if (!TELEGRAM_TOKEN) {
    console.error('TELEGRAM_BOT_TOKEN не установлен в переменных окружения');
    return;
  }

  try {
    // Если предоставлен customChatId, отправляем традиционным способом (для обратной совместимости)
    if (customChatId) {
      const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: customChatId,
          text: message,
          parse_mode: 'HTML'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Ошибка при отправке сообщения в Telegram:', errorData);
      }
    } else {
      // Отправляем уведомление пользователям с определенными ролями
      await sendTelegramNotificationToRoles(message, ['admin', 'manager', 'director']);
    }
  } catch (error) {
    console.error('Ошибка при выполнении запроса к Telegram API:', error);
  }
}