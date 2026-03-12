import axios from 'axios';
import { Qwen3ChatService } from '../entities/qwen3Chat/service';
import User from '../entities/users/model';
import AuditLog from '../entities/auditLog/model';
import { ShiftsService } from '../entities/staffShifts/service';

const shiftsService = new ShiftsService();

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

// Хранилище состояний ожидания геолокации (chatId -> action)
// Хранилище состояний ожидания геолокации (chatId -> session)
const pendingLocationRequests = new Map<string, LiveLocationSession>();

interface TelegramLocation {
    latitude: number;
    longitude: number;
    horizontal_accuracy?: number;
    live_period?: number;
    heading?: number;
    proximity_alert_radius?: number;
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
    edit_date?: number;
}

interface TelegramCallbackQuery {
    id: string;
    from: {
        id: number;
        first_name: string;
    };
    message?: TelegramMessage;
    data?: string;
}

interface TelegramUpdate {
    update_id: number;
    message?: TelegramMessage;
    edited_message?: TelegramMessage;
    callback_query?: TelegramCallbackQuery;
}

interface LiveLocationSession {
    action: 'checkin' | 'checkout';
    userId: string;
    userRole: string;
    userName: string;
    successCount: number;
    attemptCount: number;
    startedAt: number;
    lastUpdateAt: number;
    messageId?: number; // ID сообщения-инструкции для последующего обновления
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
 * Отправляет сообщение с Reply Keyboard (плитки под полем ввода)
 */
async function sendMessageWithReplyKeyboard(
    chatId: number | string,
    text: string,
    buttons: string[][],
    oneTime: boolean = false
): Promise<void> {
    if (!TELEGRAM_BOT_TOKEN) return;

    try {
        await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            chat_id: chatId,
            text: text,
            parse_mode: 'HTML',
            reply_markup: {
                keyboard: buttons.map(row => row.map(text => ({ text }))),
                resize_keyboard: true,
                one_time_keyboard: oneTime
            }
        });
    } catch (error: any) {
        console.error('Ошибка отправки сообщения с keyboard:', error.response?.data || error.message);
    }
}

/**
 * Отвечает на callback_query (убирает "часики" на кнопке)
 */
async function answerCallbackQuery(callbackQueryId: string, text?: string): Promise<void> {
    if (!TELEGRAM_BOT_TOKEN) return;

    try {
        await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
            callback_query_id: callbackQueryId,
            text: text
        });
    } catch (error: any) {
        console.error('Ошибка answerCallbackQuery:', error.response?.data || error.message);
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
 * Отправляет сообщение с Inline Keyboard (кнопки под сообщением)
 */
async function sendInlineKeyboard(
    chatId: number | string,
    text: string,
    inlineKeyboard: { text: string; callback_data: string }[][],
    messageIdToEdit?: number
): Promise<void> {
    if (!TELEGRAM_BOT_TOKEN) return;

    try {
        const payload: any = {
            chat_id: chatId,
            text,
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: inlineKeyboard
            }
        };

        if (messageIdToEdit) {
            payload.message_id = messageIdToEdit;
            await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/editMessageText`, payload);
        } else {
            await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, payload);
        }
    } catch (error: any) {
        console.error('Ошибка отправки сообщения с inline keyboard:', error.response?.data || error.message);
    }
}

/**
 * Отправляет запрос геолокации с кнопкой
 */
async function sendLocationRequest(chatId: number | string, action: 'checkin' | 'checkout'): Promise<number | undefined> {
    if (!TELEGRAM_BOT_TOKEN) return;

    const actionText = action === 'checkin' ? 'прихода' : 'ухода';
    const buttonText = action === 'checkin' ? '📍 Отправить и отметить приход' : '📍 Отправить и отметить уход';

    try {
        const response = await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            chat_id: chatId,
            text: `📍 <b>Для отметки ${actionText} отправьте геолокацию</b>\n\n` +
                `1️⃣ Нажмите кнопку ниже\n` +
                `2️⃣ Выберите <b>"Транслировать геопозицию"</b> (на 15 минут)\n\n` +
                `<i>Бот проверит ваше местоположение в течение нескольких секунд.</i>`,
            parse_mode: 'HTML',
            reply_markup: {
                keyboard: [[{ text: buttonText, request_location: true }]],
                resize_keyboard: true,
                one_time_keyboard: true
            }
        });

        // Сохраняем ID сообщения, если нужно будет его редактировать (опционально)
        return response.data?.result?.message_id;
    } catch (error: any) {
        console.error('Ошибка отправки запроса геолокации:', error.response?.data || error.message);
    }
}

/**
 * Находит пользователя по Telegram Chat ID
 */
async function findUserByTelegramChatId(chatId: string | number): Promise<any | null> {
    try {
        const chatIdStr = String(chatId);
        console.log(`🔍 Поиск пользователя по telegramChatId: "${chatIdStr}"`);

        // Ищем по строковому значению
        let user = await User.findOne({ telegramChatId: chatIdStr, active: true });

        if (!user) {
            // Пробуем найти без фильтра active (может пользователь неактивен)
            const inactiveUser = await User.findOne({ telegramChatId: chatIdStr });
            if (inactiveUser) {
                console.log(`⚠️ Найден неактивный пользователь: ${inactiveUser.fullName}, active=${inactiveUser.active}`);
            } else {
                // Пробуем найти по числовому значению (на случай если в базе число)
                const numericUser = await User.findOne({ telegramChatId: Number(chatId) });
                if (numericUser) {
                    console.log(`⚠️ Найден пользователь с числовым chatId: ${numericUser.fullName}`);
                } else {
                    console.log(`❌ Пользователь с telegramChatId="${chatIdStr}" не найден`);
                }
            }
        } else {
            console.log(`✅ Найден пользователь: ${user.fullName}, роль: ${user.role}`);
        }

        return user;
    } catch (error) {
        console.error('Ошибка поиска пользователя по telegramChatId:', error);
        return null;
    }
}

/**
 * Получает текущий статус смены сотрудника
 */
async function getShiftStatusForUser(userId: string): Promise<'scheduled' | 'in_progress' | 'completed' | 'no_shift'> {
    try {
        const status = await shiftsService.getShiftStatus(userId);
        if (status === 'scheduled' || status === 'in_progress' || status === 'completed') {
            return status;
        }
        return 'no_shift';
    } catch (error) {
        console.error('Ошибка получения статуса смены:', error);
        return 'no_shift';
    }
}

/**
 * Отправляет кнопки меню (Reply Keyboard) в зависимости от роли и статуса
 */
async function sendMainMenuButtons(chatId: number, userId: string, role: string): Promise<void> {
    const isAdmin = ['admin', 'manager', 'director'].includes(role);

    // Для админов показываем кнопку Аудита (и возможно посещаемость, если они отмечаются)
    if (isAdmin) {
        await sendMessageWithReplyKeyboard(
            chatId,
            'Главное меню',
            [['🛠 Аудит', '📍 Отметить приход'], ['📍 Отметить уход']]
        );
        return;
    }

    const status = await getShiftStatusForUser(userId);

    if (status === 'scheduled' || status === 'no_shift') {
        await sendMessageWithReplyKeyboard(
            chatId,
            '🕐 Смена ещё не начата',
            [['📍 Отметить приход']]
        );
    } else if (status === 'in_progress') {
        await sendMessageWithReplyKeyboard(
            chatId,
            '✅ Вы на смене',
            [['📍 Отметить уход']]
        );
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
    const messageId = await sendLocationRequest(chatId, 'checkin');

    // Сохраняем ожидание геолокации
    pendingLocationRequests.set(String(chatId), {
        action: 'checkin',
        userId: user._id.toString(),
        userRole: user.role,
        userName: user.fullName,
        successCount: 0,
        attemptCount: 0,
        startedAt: Date.now(),
        lastUpdateAt: Date.now(),
        messageId
    });
}

/**
 * Обрабатывает команду /checkout - запрашивает геолокацию
 */
async function handleCheckOutCommand(chatId: number, user: any): Promise<void> {
    const messageId = await sendLocationRequest(chatId, 'checkout');

    // Сохраняем ожидание геолокации
    pendingLocationRequests.set(String(chatId), {
        action: 'checkout',
        userId: user._id.toString(),
        userRole: user.role,
        userName: user.fullName,
        successCount: 0,
        attemptCount: 0,
        startedAt: Date.now(),
        lastUpdateAt: Date.now(),
        messageId
    });
}

/**
 * Вспомогательная функция для расчета расстояния (Haversine формула)
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Радиус Земли в метрах
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
}

/**
 * Обрабатывает полученную геолокацию и выполняет checkIn/checkOut
 */
async function handleLocationMessage(chatId: number, location: TelegramLocation, isEdit: boolean = false): Promise<void> {
    const pending = pendingLocationRequests.get(String(chatId));

    if (!pending) {
        // Если это обновление существующей трансляции (isEdit), но сессия уже закрыта - просто игнорируем.
        // Это предотвращает спам "запрос не найден" после успешной отметки.
        if (isEdit) return;

        await sendMessage(chatId, '⚠️ Не найден запрос на отметку. Используйте /checkin или /checkout.');
        return;
    }

    // Детальное логирование для отладки
    console.log(`[DEBUG] Координаты от ${chatId} (${pending.userName}):`, JSON.stringify(location, null, 2));

    // Если это Live Location (есть live_period), переходим в режим накопительной проверки
    if (location.live_period) {
        await handleLiveLocationUpdate(chatId, location, pending);
        return;
    }

    // БЛОКИРОВКА СТАТИЧЕСКИХ ТОЧЕК
    // Если прислали обычную точку на карте (не трансляцию), отклоняем её.
    await sendMessage(chatId, `❌ <b>Обычная точка на карте не принята!</b>\n\nДля подтверждения присутствия необходимо использовать именно <b>"Трансляцию геопозиции"</b> (Live Location):\n\n1. Нажмите на значок 📎 (скрепка)\n2. Выберите "Геопозиция"\n3. Нажмите <b>"Транслировать мою геопозицию"</b> (НЕ "Отправить текущую")\n4. Выберите "на 15 минут".`);
}

/**
 * Обрабатывает обновления Live Location
 */
async function handleLiveLocationUpdate(chatId: number, location: TelegramLocation, session: LiveLocationSession): Promise<void> {
    const now = Date.now();

    // Проверка на тайм-аут (15-20 секунд на всё про всё)
    if (now - session.startedAt > 20000) {
        pendingLocationRequests.delete(String(chatId));
        await sendMessage(chatId, '❌ <b>Время ожидания истекло.</b>\n\nПожалуйста, попробуйте снова и убедитесь, что вы включили трансляцию геопозиции сразу.');
        return;
    }

    // Защита от слишком частых обновлений (не чаще раза в секунду)
    if (now - session.lastUpdateAt < 1000 && session.attemptCount > 0) {
        return;
    }

    session.lastUpdateAt = now;
    session.attemptCount++;

    // Получаем настройки геозоны для проверки
    const settings = await (new (require('../entities/settings/service').SettingsService)()).getGeolocationSettings();
    const radius = settings?.radius || 100;
    const targetLat = settings?.coordinates?.latitude;
    const targetLon = settings?.coordinates?.longitude;

    if (!targetLat || !targetLon) {
        pendingLocationRequests.delete(String(chatId));
        await sendMessage(chatId, '❌ Ошибка: Центр геозоны не настроен в системе.');
        return;
    }

    const distance = calculateDistance(location.latitude, location.longitude, targetLat, targetLon);
    const isInZone = distance <= radius;

    if (isInZone) {
        session.successCount++;
    } else {
        // Если хоть раз вышли из зоны во время трансляции - сбрасываем прогресс (строгая проверка)
        // session.successCount = 0; 
    }

    console.log(`[LIVE] Update ${session.attemptCount}: Dist=${distance.toFixed(1)}m, Success=${session.successCount}/3`);

    // Если набрали 3 успешных апдейта
    if (session.successCount >= 3) {
        pendingLocationRequests.delete(String(chatId));
        await performFinalCheck(chatId, location, session);
        return;
    }

    // Уведомляем пользователя о прогрессе (только если это еще не финал)
    if (session.successCount > 0) {
        const progress = '🟢'.repeat(session.successCount) + '⚪'.repeat(3 - session.successCount);
        // Мы не шлем sendMessage каждый раз, чтобы не спамить, можно использовать editMessageText если сохранен messageId
        // Для простоты пока просто логируем, или шлем сообщение только на первый успех
        if (session.successCount === 1) {
            await sendMessage(chatId, `⏳ Проверка присутствия: ${progress}\nОставайтесь на месте...`);
        }
    }
}

/**
 * Выполняет финальную отметку прихода/ухода в базе
 */
async function performFinalCheck(chatId: number, location: TelegramLocation, session: LiveLocationSession): Promise<void> {
    // Убираем клавиатуру
    try {
        await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            chat_id: chatId,
            text: '✅ Проверка завершена, записываю данные...',
            reply_markup: { remove_keyboard: true }
        });
    } catch (e) { }

    const locationData = {
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.horizontal_accuracy || 0
    };

    const deviceMetadata = {
        source: 'telegram_live',
        telegramChatId: String(chatId),
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.horizontal_accuracy || 0,
        live: !!location.live_period
    };

    try {
        let result: any;
        if (session.action === 'checkin') {
            result = await shiftsService.checkIn('', session.userId, session.userRole, locationData, deviceMetadata);
        } else {
            result = await shiftsService.checkOut('', session.userId, session.userRole, locationData, deviceMetadata);
        }

        const now = new Date();
        const timeStr = now.toLocaleTimeString('ru-RU', {
            timeZone: 'Asia/Almaty',
            hour: '2-digit',
            minute: '2-digit'
        });

        let message = session.action === 'checkin'
            ? `✅ <b>Приход отмечен!</b>\n\n`
            : `✅ <b>Уход отмечен!</b>\n\n`;

        message += `⏰ Время: ${timeStr}\n`;
        message += `📍 Присутствие подтверждено трансляцией\n`;
        message += `👤 ${session.userName}\n\n`;

        if (session.action === 'checkin') {
            message += result.message?.includes('Опоздание') ? `⚠️ <i>${result.message}</i>` : `🎉 Хорошего дня!`;
        } else {
            message += `👋 До свидания! Трансляцию можно выключить.`;
        }

        await sendMessage(chatId, message);
    } catch (error: any) {
        console.error(`Ошибка ${session.action}:`, error);
        await sendMessage(chatId, `❌ <b>Ошибка отметки</b>\n\n${error.message || 'Неизвестная ошибка'}`);
    }
}

/**
 * Обрабатывает текстовое сообщение через AI
 */
async function handleTextMessage(chatId: number, text: string, user: any): Promise<void> {
    try {
        // Показываем индикатор "печатает..."
        await sendTypingAction(chatId);

        // Определяем ограничения по роли
        const isAdmin = user.role === 'admin' || user.role === 'manager' || user.role === 'director';

        // Формируем контекст ограничений для AI
        let accessContext = '';
        if (isAdmin) {
            accessContext = `Пользователь: ${user.fullName} (${user.role}). Полный доступ ко всем данным системы.`;
        } else {
            accessContext = `
ВАЖНО: Ограниченный доступ!
Пользователь: ${user.fullName}, ID: ${user._id}, Роль: ${user.role}.

СТРОГИЕ ОГРАНИЧЕНИЯ (обязательно соблюдать):
1. ЗАРПЛАТЫ: Показывать ТОЛЬКО зарплату этого сотрудника (staffId = "${user._id}"). Никогда не показывать зарплаты других сотрудников.
2. ПОСЕЩАЕМОСТЬ: Показывать только данные посещаемости этого сотрудника.
3. ДРУГИЕ СОТРУДНИКИ: НЕ предоставлять информацию о зарплатах, штрафах, долгах других сотрудников.
4. ДЕТИ: ${user.groupId ? `Показывать только детей группы ${user.groupId}` : 'Показывать детей своих групп при наличии привязки'}.
5. СТАТИСТИКА: НЕ показывать общую статистику, финансы детского сада.
6. При запросе чужих данных — вежливо отказать и объяснить ограничения.
7. ФОРМАТИРОВАНИЕ: Твой ответ будет отображаться в Telegram (HTML mode). Используй только HTML-теги для оформления: <b>жирный</b>, <i>курсив</i>, <code>код</code>. НЕ используй Markdown (** или *).

При формировании запросов к базе данных ВСЕГДА добавляй фильтр staffId: "${user._id}" для данных о зарплатах и посещаемости.`;
        }

        // Добавляем контекст к сообщению пользователя
        const enhancedMessage = `${accessContext}\n\nВопрос пользователя: ${text}`;

        // Отправляем запрос AI-ассистенту
        const response = await Qwen3ChatService.sendMessage({
            messages: [
                {
                    id: Date.now(),
                    text: enhancedMessage,
                    sender: 'user',
                    timestamp: new Date(),
                },
            ],
            authContext: {
                userId: user._id.toString(),
                role: user.role,
                groupId: user.groupId
            }
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
    // Обработка inline кнопок (callback_query)
    if (update.callback_query) {
        await handleCallbackQuery(update.callback_query);
        return;
    }

    const message = update.message || update.edited_message;

    if (!message) {
        return; // Нет сообщения
    }

    const chatId = message.chat.id;
    const username = message.from.first_name;

    // Обработка геолокации (включая Live Location из edited_message)
    if (message.location) {
        console.log(`📍 Telegram геолокация от ${username} (${chatId}): ${message.location.latitude}, ${message.location.longitude} (Live: ${!!message.location.live_period})`);
        await handleLocationMessage(chatId, message.location, !!update.edited_message);
        return;
    }

    // Обработка текстовых сообщений
    if (!message.text) {
        return; // Игнорируем не-текстовые сообщения (кроме location которые обработали выше)
    }

    const text = message.text.trim();

    console.log(`📩 Telegram сообщение от ${username} (${chatId}): ${text}`);

    // Обработка команд, не требующих авторизации (связка аккаунта)
    if (text.startsWith('/link')) {
        const code = text.split(' ')[1];
        await handleLinkCommand(chatId, code);
        return;
    }

    // Проверяем авторизацию для команд /start, /help, /audit и основного потока
    const user = await findUserByTelegramChatId(chatId);

    if (text.startsWith('/start') || text === '/help') {
        await handleStartCommand(chatId, username);
        if (user) {
            await sendMainMenuButtons(chatId, user._id.toString(), user.role);
        }
        return;
    }

    if (text === '/audit' || text === '🛠 Аудит') {
        if (!user || !['admin', 'manager', 'director'].includes(user.role)) {
            await sendMessage(chatId, '❌ Эта команда доступна только администраторам.');
            return;
        }
        await sendAuditMainMenu(chatId);
        return;
    }

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

    // Обработка текстовых кнопок Reply Keyboard (плитки под полем ввода)
    if (text === '📍 Отметить приход') {
        await handleCheckInCommand(chatId, user);
        return;
    }

    if (text === '📍 Отметить уход') {
        await handleCheckOutCommand(chatId, user);
        return;
    }

    // Обрабатываем текстовое сообщение через AI
    await handleTextMessage(chatId, text, user);

    // Показываем кнопки после ответа AI
    await sendMainMenuButtons(chatId, user._id.toString(), user.role);
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
            allowed_updates: ['message', 'callback_query'],
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

// ==========================================
// ИНТЕРАКТИВНОЕ МЕНЮ АУДИТА (Inline Keyboard)
// ==========================================

/**
 * Отправляет главное меню аудита
 */
async function sendAuditMainMenu(chatId: number | string, messageIdToEdit?: number): Promise<void> {
    const text = '🛠 <b>Меню Аудита</b>\n\nВыберите категорию для просмотра последних действий:';

    const inlineKeyboard = [
        [
            { text: '👶 Дети', callback_data: 'audit_cat_children' },
            { text: '👥 Сотрудники', callback_data: 'audit_cat_staff' }
        ],
        [
            { text: '🍎 Питание', callback_data: 'audit_cat_food' },
            { text: '⚕️ Медицина', callback_data: 'audit_cat_med' }
        ],
        [
            { text: '🏢 Настройки / Прочее', callback_data: 'audit_cat_other' }
        ]
    ];

    await sendInlineKeyboard(chatId, text, inlineKeyboard, messageIdToEdit);
}

/**
 * Отправляет подменю аудита для выбранной категории
 */
async function sendAuditSubMenu(chatId: number | string, category: string, messageIdToEdit: number): Promise<void> {
    let text = 'Выберите раздел:';
    let inlineKeyboard: { text: string; callback_data: string }[][] = [];

    switch (category) {
        case 'audit_cat_children':
            text = '👶 <b>Аудит: Дети</b>\n\nВыберите подкатегорию:';
            inlineKeyboard = [
                [
                    { text: 'Профили и Группы', callback_data: 'audit_logs_children' },
                    { text: 'Посещаемость', callback_data: 'audit_logs_child_attendance' }
                ],
                [
                    { text: 'Оплаты', callback_data: 'audit_logs_child_payments' }
                ]
            ];
            break;
        case 'audit_cat_staff':
            text = '👥 <b>Аудит: Сотрудники</b>\n\nВыберите подкатегорию:';
            inlineKeyboard = [
                [
                    { text: 'Профили', callback_data: 'audit_logs_users' },
                    { text: 'Смены и Посещаемость', callback_data: 'audit_logs_staff_attendance' }
                ],
                [
                    { text: 'Зарплаты', callback_data: 'audit_logs_payrolls' }
                ]
            ];
            break;
        case 'audit_cat_food':
            text = '🍎 <b>Аудит: Питание</b>\n\nВыберите подкатегорию:';
            inlineKeyboard = [
                [
                    { text: 'Продукты и Блюда', callback_data: 'audit_logs_food_base' },
                    { text: 'Меню и Склад', callback_data: 'audit_logs_food_daily' }
                ],
                [
                    { text: 'Журналы (Брак, Моющие)', callback_data: 'audit_logs_food_journals' }
                ]
            ];
            break;
        case 'audit_cat_med':
            text = '⚕️ <b>Аудит: Медицина</b>\n\nВыберите подкатегорию:';
            inlineKeyboard = [
                [
                    { text: 'Паспорта здоровья', callback_data: 'audit_logs_med_passports' },
                    { text: 'Журналы заболеваний', callback_data: 'audit_logs_med_journals' }
                ]
            ];
            break;
        case 'audit_cat_other':
            text = '🏢 <b>Аудит: Остальное</b>\n\nВыберите подкатегорию:';
            inlineKeyboard = [
                [
                    { text: 'Настройки', callback_data: 'audit_logs_settings' },
                    { text: 'Документы и Задачи', callback_data: 'audit_logs_docs' }
                ]
            ];
            break;
        default:
            await sendAuditMainMenu(chatId, messageIdToEdit);
            return;
    }

    // Добавляем кнопку "Назад"
    inlineKeyboard.push([{ text: '🔙 Назад к категориям', callback_data: 'audit_main' }]);

    await sendInlineKeyboard(chatId, text, inlineKeyboard, messageIdToEdit);
}

/**
 * Отправляет меню выбора периода для логов
 */
async function sendAuditPeriodMenu(chatId: number | string, actionType: string, messageIdToEdit: number): Promise<void> {
    const text = '📅 <b>Выберите период для просмотра:</b>';
    const inlineKeyboard = [
        [
            { text: 'Сегодня', callback_data: `${actionType}_today` },
            { text: 'За 3 дня', callback_data: `${actionType}_3days` }
        ],
        [
            { text: 'За неделю', callback_data: `${actionType}_week` },
            { text: 'За месяц', callback_data: `${actionType}_month` }
        ],
        [
            { text: 'За все время (до 50)', callback_data: `${actionType}_all` }
        ],
        [
            { text: '🔙 Вернуться к выбору', callback_data: getCategoryParent(actionType) }
        ]
    ];
    await sendInlineKeyboard(chatId, text, inlineKeyboard, messageIdToEdit);
}

/**
 * Получает родительскую категорию для возврата назад
 */
function getCategoryParent(actionType: string): string {
    switch (actionType) {
        case 'audit_logs_children':
        case 'audit_logs_child_attendance':
        case 'audit_logs_child_payments':
            return 'audit_cat_children';
        case 'audit_logs_users':
        case 'audit_logs_staff_attendance':
        case 'audit_logs_payrolls':
            return 'audit_cat_staff';
        case 'audit_logs_food_base':
        case 'audit_logs_food_daily':
        case 'audit_logs_food_journals':
            return 'audit_cat_food';
        case 'audit_logs_med_passports':
        case 'audit_logs_med_journals':
            return 'audit_cat_med';
        case 'audit_logs_settings':
        case 'audit_logs_docs':
            return 'audit_cat_other';
        default:
            return 'audit_main';
    }
}

/**
 * Получает и отправляет последние логи по заданным сущностям
 */
async function sendAuditLogs(chatId: number | string, actionType: string, period: string, messageIdToEdit: number): Promise<void> {
    let entityTypes: string[] = [];
    let title = '';

    // Мапинг действий к типами сущностей
    switch (actionType) {
        // Дети
        case 'audit_logs_children':
            entityTypes = ['child', 'group'];
            title = '👶 Профили детей и группы';
            break;
        case 'audit_logs_child_attendance':
            entityTypes = ['childAttendance'];
            title = '👶 Посещаемость детей';
            break;
        case 'audit_logs_child_payments':
            entityTypes = ['childPayment'];
            title = '💰 Оплаты детей';
            break;

        // Сотрудники
        case 'audit_logs_users':
            entityTypes = ['staff'];
            title = '👥 Профили сотрудников';
            break;
        case 'audit_logs_staff_attendance':
            entityTypes = ['staffAttendance', 'staffShift'];
            title = '👥 Смены и посещаемость';
            break;
        case 'audit_logs_payrolls':
            entityTypes = ['payroll'];
            title = '💵 Зарплаты сотрудников';
            break;

        // Питание
        case 'audit_logs_food_base':
            entityTypes = ['product', 'dish', 'productPurchase'];
            title = '🍎 Продукты и Закупки';
            break;
        case 'audit_logs_food_daily':
            entityTypes = ['dailyMenu', 'weeklyMenuTemplate', 'foodStockLog'];
            title = '🍲 Меню и Склад продуктов';
            break;
        case 'audit_logs_food_journals':
            entityTypes = ['perishableBrak', 'detergentLog', 'foodStaffHealth', 'organolepticJournal', 'productCertificate', 'foodNormsControl'];
            title = '📋 Пищевые журналы';
            break;

        // Медицина
        case 'audit_logs_med_passports':
            entityTypes = ['healthPassport', 'childHealthPassport'];
            title = '⚕️ Паспорта здоровья';
            break;
        case 'audit_logs_med_journals':
            entityTypes = ['somaticJournal', 'mantouxJournal', 'helminthJournal', 'infectiousDiseasesJournal', 'contactInfectionJournal', 'tubPositiveJournal', 'riskGroupChild'];
            title = '🏥 Медицинские журналы';
            break;

        // Остальное
        case 'audit_logs_settings':
            entityTypes = ['settings', 'mainEvent', 'rent', 'externalSpecialist'];
            title = '🏢 Настройки и Аренда';
            break;
        case 'audit_logs_docs':
            entityTypes = ['document', 'task', 'dailySchedule'];
            title = '📁 Документы, Задачи, Циклограмма';
            break;
    }

    if (entityTypes.length === 0) {
        await answerCallbackQuery('unknown_action', 'Неизвестная категория');
        return;
    }

    try {
        let dateFilter: any = {};
        const now = new Date();
        let periodStr = '';

        if (period === 'today') {
            const startOfDay = new Date(now.setHours(0, 0, 0, 0));
            dateFilter = { $gte: startOfDay };
            periodStr = 'за сегодня';
        } else if (period === '3days') {
            const d = new Date(); d.setDate(d.getDate() - 3);
            dateFilter = { $gte: d };
            periodStr = 'за 3 дня';
        } else if (period === 'week') {
            const d = new Date(); d.setDate(d.getDate() - 7);
            dateFilter = { $gte: d };
            periodStr = 'за неделю';
        } else if (period === 'month') {
            const d = new Date(); d.setMonth(d.getMonth() - 1);
            dateFilter = { $gte: d };
            periodStr = 'за месяц';
        } else {
            periodStr = 'за всё время';
        }

        let query: any = { entityType: { $in: entityTypes } };
        if (period !== 'all') {
            query.createdAt = dateFilter;
        }

        const limitCount = period === 'all' ? 50 : 30;

        const logs = await AuditLog.find(query)
            .sort({ createdAt: -1 })
            .limit(limitCount)
            .lean();

        if (logs.length === 0) {
            const text = `📋 <b>Аудит: ${title}</b> (${periodStr})\n\nНет недавних действий.`;
            await sendInlineKeyboard(chatId, text, [
                [{ text: '📅 Изменить период', callback_data: actionType }],
                [{ text: '🔙 Назад к меню', callback_data: 'audit_main' }]
            ], messageIdToEdit);
            return;
        }

        let text = `📋 <b>Аудит: ${title}</b>\n<i>Последние действия (${periodStr}, до ${limitCount})</i>\n\n`;

        for (const log of logs) {
            const dateStr = new Date(log.createdAt).toLocaleString('ru-RU', {
                timeZone: 'Asia/Almaty',
                day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
            });

            let actionText: string = log.action;
            let emoji = '🔹';

            if (log.action === 'create') { actionText = 'Создание'; emoji = '🟢'; }
            if (log.action === 'update') { actionText = 'Изменение'; emoji = '🟡'; }
            if (log.action === 'delete') { actionText = 'Удаление'; emoji = '🔴'; }
            if (log.action === 'status_change') { actionText = 'Статус'; emoji = '🔄'; }

            const entityName = log.entityName ? `«${log.entityName}»` : `ID:${log.entityId.substring(0, 6)}...`;

            text += `${emoji} <b>${dateStr}</b>\n`;
            text += `👤 <b>${log.userFullName}</b> (${actionText})\n`;
            text += `📝 Сущность: ${entityName} [<i>${log.entityType}</i>]\n`;
            if (log.details) {
                text += `ℹ️ <i>${log.details}</i>\n`;
            }
            text += '\n';
        }

        const inlineKeyboard = [
            [{ text: '🔄 Обновить', callback_data: `${actionType}_${period}` }],
            [{ text: '📅 Изменить период', callback_data: actionType }],
            [{ text: '🔙 Назад к меню', callback_data: 'audit_main' }]
        ];

        // Так как текст логов может быть большим, если он превышает лимит, обрезаем
        if (text.length > 4000) {
            text = text.substring(0, 4000) + '...';
        }

        await sendInlineKeyboard(chatId, text, inlineKeyboard, messageIdToEdit);

    } catch (error) {
        console.error('Ошибка получения логов аудита для Telegram:', error);
        await sendInlineKeyboard(
            chatId,
            '❌ Ошибка при получении данных базы. Попробуйте позже.',
            [[{ text: '🔙 Вернуться', callback_data: 'audit_main' }]],
            messageIdToEdit
        );
    }
}

/**
 * Обрабатывает нажатия на Inline кнопки (callback_query)
 */
async function handleCallbackQuery(callbackQuery: TelegramCallbackQuery): Promise<void> {
    const data = callbackQuery.data;
    const message = callbackQuery.message;

    if (!data || !message) {
        await answerCallbackQuery(callbackQuery.id);
        return;
    }

    const chatId = message.chat.id;
    const messageId = message.message_id;

    // Сразу отвечаем Telegram серверу, чтобы скрыть часики на кнопке
    await answerCallbackQuery(callbackQuery.id);

    try {
        // Проверка авторизации: только админы могут смотреть аудит
        const user = await findUserByTelegramChatId(chatId);
        if (!user || !['admin', 'manager', 'director'].includes(user.role)) {
            await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/editMessageText`, {
                chat_id: chatId,
                message_id: messageId,
                text: '❌ <b>Доступ запрещен.</b> У вас нет прав для просмотра аудита.',
                parse_mode: 'HTML'
            });
            return;
        }

        // Маршрутизация в зависимости от callback_data
        if (data === 'audit_main') {
            await sendAuditMainMenu(chatId, messageId);
        }
        else if (data.startsWith('audit_cat_')) {
            await sendAuditSubMenu(chatId, data, messageId);
        }
        else if (data.startsWith('audit_logs_')) {
            // Обработка данных с периодом
            const parts = data.split('_');
            const lastPart = parts[parts.length - 1];
            if (['today', '3days', 'week', 'month', 'all'].includes(lastPart)) {
                const period = lastPart;
                const actionType = parts.slice(0, -1).join('_');
                await sendAuditLogs(chatId, actionType, period, messageId);
            } else {
                // Если периода нет — показываем меню периодов
                await sendAuditPeriodMenu(chatId, data, messageId);
            }
        }

    } catch (error) {
        console.error('Ошибка обработки callback query:', error);
    }
}
