import axios from 'axios';
import { Qwen3ChatService } from '../entities/qwen3Chat/service';
import User from '../entities/users/model';
import { ShiftsService } from '../entities/staffShifts/service';

const shiftsService = new ShiftsService();

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

// Хранилище состояний ожидания геолокации (chatId -> action)
const pendingLocationRequests = new Map<string, { action: 'checkin' | 'checkout'; userId: string; userRole: string; userName: string }>();

interface TelegramLocation {
    latitude: number;
    longitude: number;
}

interface TelegramMessage {
    message_id: number;
    from: {
        id: number;
        first_name: string;
        last_name?: string;
        username?: string;
    };
    chat: {
        id: number;
        type: 'private' | 'group' | 'supergroup' | 'channel';
    };
    date: number;
    text?: string;
    location?: TelegramLocation;
}

interface TelegramUpdate {
    update_id: number;
    message?: TelegramMessage;
}

/**
 * Отправляет сообщение в Telegram
 */
async function sendMessage(chatId: number | string, text: string, parseMode: 'HTML' | 'Markdown' = 'HTML'): Promise<void> {
    console.log(`📤 Попытка отправки сообщения в чат ${chatId}...`);

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
 * Отправляет индикатор "печатает..."
 */
async function sendTypingAction(chatId: number | string): Promise<void> {
    if (!TELEGRAM_BOT_TOKEN) return;

    try {
        await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendChatAction`, {
            chat_id: chatId,
            action: 'typing',
        });
    } catch (error) {
        // Игнорируем ошибки
    }
}

/**
 * Отправляет запрос геолокации с кнопкой
 */
async function sendLocationRequest(chatId: number | string, action: 'checkin' | 'checkout'): Promise<void> {
    if (!TELEGRAM_BOT_TOKEN) return;

    const actionText = action === 'checkin' ? 'прихода' : 'ухода';
    const buttonText = action === 'checkin' ? '📍 Отправить и отметить приход' : '📍 Отправить и отметить уход';

    try {
        await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            chat_id: chatId,
            text: `📍 <b>Для отметки ${actionText} отправьте геолокацию</b>\n\nНажмите кнопку ниже, чтобы поделиться местоположением и подтвердить, что вы на месте.`,
            parse_mode: 'HTML',
            reply_markup: {
                keyboard: [[{ text: buttonText, request_location: true }]],
                resize_keyboard: true,
                one_time_keyboard: true
            }
        });
    } catch (error: any) {
        console.error('Ошибка отправки запроса геолокации:', error.response?.data || error.message);
    }
}

/**
 * Находит пользователя по Telegram Chat ID
 */
async function findUserByTelegramChatId(chatId: string | number): Promise<any | null> {
    try {
        const user = await User.findOne({ telegramChatId: String(chatId), active: true });
        return user;
    } catch (error) {
        console.error('Ошибка поиска пользователя по telegramChatId:', error);
        return null;
    }
}

/**
 * Обрабатывает команду /start
 */
async function handleStartCommand(chatId: number, username?: string): Promise<void> {
    const welcomeMessage = `👋 <b>Привет${username ? ', ' + username : ''}!</b>

Я AI-помощник детского сада.

<b>🕐 Отметка посещаемости:</b>
/checkin или /in — отметить приход
/checkout или /out — отметить уход

<b>💬 Могу ответить на вопросы о:</b>
📊 <b>Посещаемости</b> — сколько сотрудников отметилось
💰 <b>Зарплатах</b> — начисления, вычеты, итого
💳 <b>Оплатах</b> — оплачен ли ребенок
👥 <b>Сотрудниках</b> — информация о персонале

<b>Примеры вопросов:</b>
• Сколько сотрудников отметилось сегодня?
• Какая зарплата у Иванова за январь?

<i>Для работы ваш Telegram должен быть привязан к аккаунту в системе.</i>`;

    await sendMessage(chatId, welcomeMessage);
}

/**
 * Обрабатывает команду /link <код>
 */
async function handleLinkCommand(chatId: number, code: string): Promise<void> {
    if (!code) {
        await sendMessage(chatId, '❌ Укажите код привязки.\n\nПример: <code>/link ABC123</code>');
        return;
    }

    try {
        // Ищем пользователя с этим кодом (без преобразования регистра)
        const user = await User.findOne({ telegramLinkCode: code.trim() });

        if (!user) {
            await sendMessage(chatId, '❌ Код не найден или уже использован.\n\nПолучите новый код в профиле приложения.');
            return;
        }

        // Привязываем Telegram
        user.telegramChatId = String(chatId);
        user.telegramLinkCode = undefined; // Удаляем использованный код
        await user.save();

        await sendMessage(chatId, `✅ <b>Telegram успешно привязан!</b>\n\nДобро пожаловать, ${user.fullName}!\n\nТеперь вы можете задавать вопросы.`);
    } catch (error) {
        console.error('Ошибка привязки Telegram:', error);
        await sendMessage(chatId, '❌ Произошла ошибка. Попробуйте позже.');
    }
}

/**
 * Обрабатывает команду /checkin - запрашивает геолокацию
 */
async function handleCheckInCommand(chatId: number, user: any): Promise<void> {
    // Сохраняем ожидание геолокации
    pendingLocationRequests.set(String(chatId), {
        action: 'checkin',
        userId: user._id.toString(),
        userRole: user.role,
        userName: user.fullName
    });

    await sendLocationRequest(chatId, 'checkin');
}

/**
 * Обрабатывает команду /checkout - запрашивает геолокацию
 */
async function handleCheckOutCommand(chatId: number, user: any): Promise<void> {
    // Сохраняем ожидание геолокации
    pendingLocationRequests.set(String(chatId), {
        action: 'checkout',
        userId: user._id.toString(),
        userRole: user.role,
        userName: user.fullName
    });

    await sendLocationRequest(chatId, 'checkout');
}

/**
 * Обрабатывает полученную геолокацию и выполняет checkIn/checkOut
 */
async function handleLocationMessage(chatId: number, location: TelegramLocation): Promise<void> {
    const pending = pendingLocationRequests.get(String(chatId));

    if (!pending) {
        await sendMessage(chatId, '⚠️ Не найден запрос на отметку. Используйте /checkin или /checkout.');
        return;
    }

    // Удаляем ожидание
    pendingLocationRequests.delete(String(chatId));

    // Убираем клавиатуру
    try {
        await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            chat_id: chatId,
            text: '⏳ Проверяем местоположение...',
            reply_markup: { remove_keyboard: true }
        });
    } catch (e) {
        // Игнорируем
    }

    const locationData = { latitude: location.latitude, longitude: location.longitude };

    try {
        let result: any;
        const deviceMetadata = {
            source: 'telegram',
            telegramChatId: String(chatId),
            latitude: location.latitude,
            longitude: location.longitude
        } as any;

        if (pending.action === 'checkin') {
            result = await shiftsService.checkIn(
                '',
                pending.userId,
                pending.userRole,
                locationData,
                deviceMetadata
            );
        } else {
            result = await shiftsService.checkOut(
                '',
                pending.userId,
                pending.userRole,
                locationData,
                deviceMetadata
            );
        }

        const now = new Date();
        const timeStr = now.toLocaleTimeString('ru-RU', {
            timeZone: 'Asia/Almaty',
            hour: '2-digit',
            minute: '2-digit'
        });

        let message: string;
        if (pending.action === 'checkin') {
            message = `✅ <b>Приход отмечен!</b>\n\n`;
            message += `⏰ Время: ${timeStr}\n`;
            message += `📍 Геолокация: подтверждена\n`;
            message += `👤 ${pending.userName}\n\n`;
            if (result.message?.includes('Опоздание')) {
                message += `⚠️ <i>${result.message}</i>`;
            } else {
                message += `🎉 Хорошего рабочего дня!`;
            }
        } else {
            message = `✅ <b>Уход отмечен!</b>\n\n`;
            message += `⏰ Время: ${timeStr}\n`;
            message += `📍 Геолокация: подтверждена\n`;
            message += `👤 ${pending.userName}\n\n`;
            message += `👋 До свидания! Отдыхайте.`;
        }

        await sendMessage(chatId, message);
    } catch (error: any) {
        console.error(`Ошибка ${pending.action} с геолокацией:`, error);
        const actionText = pending.action === 'checkin' ? 'прихода' : 'ухода';
        await sendMessage(chatId, `❌ <b>Ошибка отметки ${actionText}</b>\n\n${error.message || 'Неизвестная ошибка'}`);
    }
}

/**
 * Обрабатывает текстовое сообщение через AI
 */
async function handleTextMessage(chatId: number, text: string, user: any): Promise<void> {
    try {
        // Показываем индикатор "печатает..."
        await sendTypingAction(chatId);

        // Отправляем запрос AI-ассистенту
        const response = await Qwen3ChatService.sendMessage({
            messages: [
                {
                    id: Date.now(),
                    text: text,
                    sender: 'user',
                    timestamp: new Date(),
                },
            ],
        });

        // Форматируем ответ для Telegram (удаляем markdown, оставляем HTML)
        let replyText = response.content || 'Извините, не могу ответить на этот вопрос.';

        // Ограничиваем длину сообщения (Telegram лимит 4096 символов)
        if (replyText.length > 4000) {
            replyText = replyText.substring(0, 4000) + '\n\n<i>... (сообщение сокращено)</i>';
        }

        await sendMessage(chatId, replyText);

    } catch (error: any) {
        console.error('Ошибка обработки AI запроса:', error);
        await sendMessage(chatId, '❌ Произошла ошибка при обработке запроса. Попробуйте позже.');
    }
}

/**
 * Главный обработчик webhook от Telegram
 */
export async function handleTelegramWebhook(update: TelegramUpdate): Promise<void> {
    const message = update.message;

    if (!message) {
        return; // Нет сообщения
    }

    const chatId = message.chat.id;
    const username = message.from.first_name;

    // Обработка геолокации
    if (message.location) {
        console.log(`📍 Telegram геолокация от ${username} (${chatId}): ${message.location.latitude}, ${message.location.longitude}`);
        await handleLocationMessage(chatId, message.location);
        return;
    }

    // Обработка текстовых сообщений
    if (!message.text) {
        return; // Игнорируем не-текстовые сообщения (кроме location которые обработали выше)
    }

    const text = message.text.trim();

    console.log(`📩 Telegram сообщение от ${username} (${chatId}): ${text}`);

    // Обработка команд
    if (text.startsWith('/start')) {
        await handleStartCommand(chatId, username);
        return;
    }

    if (text.startsWith('/link')) {
        const code = text.split(' ')[1];
        await handleLinkCommand(chatId, code);
        return;
    }

    if (text === '/help') {
        await handleStartCommand(chatId, username);
        return;
    }

    // Проверяем авторизацию
    const user = await findUserByTelegramChatId(chatId);

    if (!user) {
        await sendMessage(chatId, `⚠️ <b>Telegram не привязан к аккаунту</b>

Чтобы использовать бота, привяжите Telegram к вашему аккаунту:

1. Откройте приложение → Профиль
2. Нажмите "Привязать Telegram"
3. Введите команду: <code>/link КОД</code>

После привязки вы сможете задавать вопросы.`);
        return;
    }

    // Команды посещаемости (требуют авторизации)
    if (text === '/checkin' || text === '/in') {
        await handleCheckInCommand(chatId, user);
        return;
    }

    if (text === '/checkout' || text === '/out') {
        await handleCheckOutCommand(chatId, user);
        return;
    }

    // Обрабатываем текстовое сообщение через AI
    await handleTextMessage(chatId, text, user);
}

/**
 * Устанавливает webhook URL для Telegram бота
 */
export async function setTelegramWebhook(webhookUrl: string): Promise<{ success: boolean; message: string }> {
    if (!TELEGRAM_BOT_TOKEN) {
        return { success: false, message: 'TELEGRAM_BOT_TOKEN не установлен' };
    }

    try {
        const response = await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook`, {
            url: webhookUrl,
            allowed_updates: ['message'],
        });

        if (response.data.ok) {
            return { success: true, message: `Webhook установлен: ${webhookUrl}` };
        } else {
            return { success: false, message: response.data.description || 'Неизвестная ошибка' };
        }
    } catch (error: any) {
        return { success: false, message: error.response?.data?.description || error.message };
    }
}

/**
 * Удаляет webhook
 */
export async function deleteTelegramWebhook(): Promise<{ success: boolean; message: string }> {
    if (!TELEGRAM_BOT_TOKEN) {
        return { success: false, message: 'TELEGRAM_BOT_TOKEN не установлен' };
    }

    try {
        const response = await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/deleteWebhook`);

        if (response.data.ok) {
            return { success: true, message: 'Webhook удален' };
        } else {
            return { success: false, message: response.data.description || 'Неизвестная ошибка' };
        }
    } catch (error: any) {
        return { success: false, message: error.response?.data?.description || error.message };
    }
}

/**
 * Получает информацию о webhook
 */
export async function getWebhookInfo(): Promise<any> {
    if (!TELEGRAM_BOT_TOKEN) {
        return { error: 'TELEGRAM_BOT_TOKEN не установлен' };
    }

    try {
        const response = await axios.get(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo`);
        return response.data.result;
    } catch (error: any) {
        return { error: error.response?.data?.description || error.message };
    }
}
