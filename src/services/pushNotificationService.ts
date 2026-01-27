import webpush from 'web-push';
import User from '../entities/users/model';
import dotenv from 'dotenv';
import { messaging } from '../config/firebase';

dotenv.config();

const vapidKeys = {
    publicKey: process.env.VAPID_PUBLIC_KEY || 'BJWw0OiYXGMun4pefNLc629UXVSQFiRUUR7YTq_7Pt7JCOp5azqLR0YgXjDXLj3Zd7-540KF8t7BLv6_NU_Q94I',
    privateKey: process.env.VAPID_PRIVATE_KEY || '1Lou7w8qx6n2wkqyjsZeAjdCu1U72AOaApd17A-41lQ'
};

webpush.setVapidDetails(
    'mailto:support@example.com',
    vapidKeys.publicKey,
    vapidKeys.privateKey
);

export class PushNotificationService {
    static async sendNotification(userId: string, title: string, body: string, url: string = '/') {
        try {
            console.log(`Отправка уведомления пользователю ID: ${userId}, Заголовок: ${title}, Тело: ${body}`);
            const user = await User.findById(userId);
            if (!user) {
                console.log(`Пользователь с ID ${userId} не найден`);
                return;
            }

            console.log(`Найден пользователь: ${user.fullName}, Подписок: ${user.pushSubscriptions?.length || 0}, FCM токенов: ${user.fcmTokens?.length || 0}`);

            // 1. Web-Push Notifications
            if (user.pushSubscriptions && user.pushSubscriptions.length > 0) {
                console.log(`Отправляем Web-Push уведомления для пользователя ${userId}, количество подписок: ${user.pushSubscriptions.length}`);
                const payload = JSON.stringify({ title, body, url });
                const subscriptions = [...user.pushSubscriptions];
                const validSubscriptions = [];

                for (const subscription of subscriptions) {
                    try {
                        console.log(`Отправляем Web-Push уведомление для подписки ${subscription.endpoint.substring(0, 50)}...`);
                        await webpush.sendNotification(subscription, payload);
                        console.log(`Web-Push уведомление успешно отправлено для подписки ${subscription.endpoint.substring(0, 50)}...`);
                        validSubscriptions.push(subscription);
                    } catch (error: any) {
                        console.log(`Ошибка при отправке Web-Push уведомления:`, error);
                        if (error.statusCode === 410 || error.statusCode === 404) {
                            console.log(`Web-push subscription for user ${userId} expired.`);
                        } else {
                            console.error(`Error sending Web-push to user ${userId}:`, error);
                            validSubscriptions.push(subscription);
                        }
                    }
                }

                if (validSubscriptions.length !== subscriptions.length) {
                    user.pushSubscriptions = validSubscriptions;
                    await user.save();
                }
            } else {
                console.log(`У пользователя ${userId} нет Web-Push подписок`);
            }

            // 2. FCM Mobile Notifications
            if (messaging && user.fcmTokens && user.fcmTokens.length > 0) {
                console.log(`Отправляем FCM уведомления для пользователя ${userId}, количество токенов: ${user.fcmTokens.length}`);
                const tokens = [...user.fcmTokens];
                const validTokens = [];

                for (const token of tokens) {
                    try {
                        console.log(`Отправляем FCM уведомление для токена ${token.substring(0, 30)}...`);
                        await messaging.send({
                            token,
                            notification: { title, body },
                            data: { url, click_action: 'FLUTTER_NOTIFICATION_CLICK' },
                            android: { priority: 'high' },
                            apns: { payload: { aps: { sound: 'default' } } }
                        });
                        console.log(`FCM уведомление успешно отправлено для токена ${token.substring(0, 30)}...`);
                        validTokens.push(token);
                    } catch (error: any) {
                        console.log(`Ошибка при отправке FCM уведомления:`, error);
                        if (error.code === 'messaging/registration-token-not-registered' ||
                            error.code === 'messaging/invalid-registration-token') {
                            console.log(`FCM token for user ${userId} expired or invalid.`);
                        } else {
                            console.error(`Error sending FCM to user ${userId}:`, error);
                            validTokens.push(token);
                        }
                    }
                }

                if (validTokens.length !== tokens.length) {
                    user.fcmTokens = validTokens;
                    await user.save();
                }
            } else {
                console.log(`У пользователя ${userId} нет FCM токенов или messaging не настроен`);
            }
        } catch (error) {
            console.error('PushNotificationService error:', error);
        }
    }

    static async broadcastNotification(role: string | null, title: string, body: string, url: string = '/') {
        try {
            console.log(`Начинаем рассылку уведомлений. Роль: ${role}, Заголовок: ${title}, Тело: ${body}`);
            const query: any = { active: true };
            if (role) {
                query.role = role;
            }

            const users = await User.find(query);
            console.log(`Найдено пользователей для уведомлений: ${users.length}`);

            let notifiedCount = 0;
            for (const user of users) {
                const hasWebSub = user.pushSubscriptions && user.pushSubscriptions.length > 0;
                const hasFcmSub = user.fcmTokens && user.fcmTokens.length > 0;

                console.log(`Проверяем пользователя ${user._id}. Web подписка: ${!!hasWebSub}, FCM токен: ${!!hasFcmSub}`);

                if (hasWebSub || (messaging && hasFcmSub)) {
                    console.log(`Отправляем уведомление пользователю ${user._id}`);
                    await this.sendNotification(user._id as string, title, body, url);
                    notifiedCount++;
                }
            }
            console.log(`Уведомления отправлены ${notifiedCount} пользователям из ${users.length}`);
        } catch (error) {
            console.error('Broadcast push error:', error);
        }
    }
}

export default PushNotificationService;
