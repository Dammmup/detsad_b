import axios from 'axios';
import User from '../entities/users/model';

/**
 * Отправляет сообщение в Telegram
 */
async function sendMessage(chatId: number | string, text: string, parseMode: 'HTML' | 'Markdown' = 'HTML'): Promise<void> {
    console.log(`📤 Попытка отправки сообщения в чат ${chatId}...`);

    const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    if (!TELEGRAM_BOT_TOKEN) {
        console.error('❌ TELEGRAM_BOT_TOKEN не установлен');
        return;
    }

    try {
        const response = await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            chat_id: chatId,
            text: text,
            parse_mode: parseMode,
        });
        console.log(`✅ Сообщение отправлено в чат ${chatId}:`, response.data.ok);
    } catch (error: any) {
        console.error('❌ Ошибка отправки сообщения в Telegram:', error.response?.data || error.message);
    }
}

/**
 * Отправляет уведомление в Telegram пользователям с определенными ролями
 */
export async function sendTelegramNotificationToRoles(text: string, roles: string[] = ['admin', 'manager', 'director']): Promise<void> {
    try {
        // Находим пользователей с указанными ролями, у которых есть telegramChatId
        const users = await User.find({
            role: { $in: roles },
            telegramChatId: { $exists: true, $ne: null, $not: { $eq: '' } },
            active: true
        });

        if (users.length === 0) {
            console.log('⚠️ Не найдено активных пользователей с Telegram для указанных ролей:', roles);
            return;
        }

        console.log(`📨 Отправка уведомления ${users.length} пользователям с ролями:`, roles);

        // Отправляем сообщение каждому пользователю
        for (const user of users) {
            if (user.telegramChatId) {
                await sendMessage(user.telegramChatId, text);
            }
        }
    } catch (error) {
        console.error('❌ Ошибка при отправке уведомления пользователям с ролями:', error);
    }
}

/**
 * Отправляет уведомление в Telegram по старой логике (один чат)
 * @deprecated Используйте sendTelegramNotificationToRoles для уведомлений о действиях на платформе
 */
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