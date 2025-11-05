import express from 'express';
import User from '../entities/users/model';
import { sendTelegramNotification } from '../utils/telegramNotify';

const router = express.Router();

router.post('/webhook', async (req, res) => {
  const update = req.body;
  console.log('Telegram webhook received:', JSON.stringify(update, null, 2)); // Логируем весь объект update

  try {
    if (update.message && update.message.text && update.message.chat && update.message.from) {
      const chatId = update.message.chat.id;
      const text = update.message.text.trim();
      console.log(`Received message from chatId: ${chatId}, text: "${text}"`); // Логируем chatId и текст

      // Проверить команду вида /start <код>
      const match = text.match(/^\/start\s+([a-zA-Z0-9_-]{4,30})/);
      if (match) {
        const code = match[1];
        console.log(`Extracted code from message: "${code}"`); // Логируем извлеченный код

        const userModel = User();
        const user = await userModel.findOne({ telegramLinkCode: code });
        if (user) {
          console.log(`Valid code found. Linking chatId ${chatId} to user ${user._id}`); // Логируем успешное нахождение кода
          (user as any).telegramChatId = chatId;
          (user as any).telegramLinkCode = undefined; // Очистить поле после привязки
          await user.save();
          await sendTelegramNotification(chatId, 'Вы подписаны на уведомления о сменах!');
        } else {
          console.log(`Invalid or expired code: "${code}". User not found.`); // Логируем ошибку
          await sendTelegramNotification(chatId, 'Код неверный или пользователь не найден. Скопируйте код из вашего профиля в системе.');
        }
      } else {
        console.log(`Message does not match /start <code> pattern. Received: "${text}"`); // Логируем, если не подходит
        await sendTelegramNotification(chatId, 'Для активации уведомлений отправьте мне команду "/start <ваш_код>". Код берите из вашего профиля в системе.');
      }
    } else {
      console.log('Received update does not contain a valid message object'); // Логируем, если нет сообщения
    }
  } catch(e) {
    console.error('Telegram webhook error:',e);
  }
 res.sendStatus(200);
});

export default router;
