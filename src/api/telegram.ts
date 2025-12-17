import express from 'express';
import User from '../entities/users/model';
import { sendLogToTelegram } from '../utils/telegramLogger';

const router = express.Router();

router.post('/webhook', async (req, res) => {
  const update = req.body;
  console.log('Telegram webhook received:', JSON.stringify(update, null, 2));

  try {
    if (update.message && update.message.text && update.message.chat && update.message.from) {
      const chatId = update.message.chat.id;
      const text = update.message.text.trim();
      console.log(`Received message from chatId: ${chatId}, text: "${text}"`);


      const match = text.match(/^\/start\s+([a-zA-Z0-9_-]{4,30})/);
      if (match) {
        const code = match[1];
        console.log(`Extracted code from message: "${code}"`);

        const userModel = User();
        const user = await userModel.findOne({ telegramLinkCode: code });
        if (user) {
          console.log(`Valid code found. Linking chatId ${chatId} to user ${user._id}`);
          (user as any).telegramChatId = chatId;
          (user as any).telegramLinkCode = undefined;
          await user.save();
          await sendLogToTelegram('Вы подписаны на уведомления о сменах!');
        } else {
          console.log(`Invalid or expired code: "${code}". User not found.`);
          await sendLogToTelegram('Код неверный или пользователь не найден. Скопируйте код из вашего профиля в системе.');
        }
      } else {
        console.log(`Message does not match /start <code> pattern. Received: "${text}"`);
        await sendLogToTelegram('Для активации уведомлений отправьте мне команду "/start <ваш_код>". Код берите из вашего профиля в системе.');
      }
    } else {
      console.log('Received update does not contain a valid message object');
    }
  } catch (e) {
    console.error('Telegram webhook error:', e);
  }
  res.sendStatus(200);
});

export default router;
