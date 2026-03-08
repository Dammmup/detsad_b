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
    static async sendNotification(userOrId: string | any, title: string, body: string, url: string = '/') {
        try {
            let user: any;
            if (typeof userOrId === 'string') {
                console.log(`Отправка уведомления пользователю ID: ${userOrId}, Заголовок: ${title}, Тело: ${body}`);
                user = await User.findById(userOrId);
                if (!user) {
                    console.log(`Пользователь с ID ${userOrId} не найден`);
                    return;
                }
            } else {
                user = userOrId;
                console.log(`Отправка уведомления пользователю: ${user.fullName}, Заголовок: ${title}, Тело: ${body}`);
            }

            const userId = user._id.toString();
            console.log(`Найден пользователь: ${user.fullName}, Подписок: ${user.pushSubscriptions?.length || 0}, FCM токенов: ${user.fcmTokens?.length || 0}`);

            // 1. Web-Push Notifications
            if (user.pushSubscriptions && user.pushSubscriptions.length > 0) {
                console.log(`Отправляем Web-Push уведомления для пользователя ${userId}, количество подписок: ${user.pushSubscriptions.length}`);
                const payload = JSON.stringify({ title, body, url });
                const subscriptions = [...user.pushSubscriptions];

                const results = await Promise.all(subscriptions.map(async (subscription: any) => {
                    try {
                        console.log(`Отправляем Web-Push уведомление для подписки ${subscription.endpoint.substring(0, 50)}...`);
                        await webpush.sendNotification(subscription, payload);
                        console.log(`Web-Push уведомление успешно отправлено для подписки ${subscription.endpoint.substring(0, 50)}...`);
                        return { subscription, ok: true };
                    } catch (error: any) {
                        console.log(`Ошибка при отправке Web-Push уведомления:`, error);
                        if (error.statusCode === 410 || error.statusCode === 404) {
                            console.log(`Web-push subscription for user ${userId} expired.`);
                            return { subscription, ok: false };
                        } else {
                            console.error(`Error sending Web-push to user ${userId}:`, error);
                            return { subscription, ok: true };
                        }
                    }
                }));

                const validSubscriptions = results.filter(r => r.ok).map(r => r.subscription);

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

                const results = await Promise.all(tokens.map(async (token: string) => {
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
                        return { token, ok: true };
                    } catch (error: any) {
                        console.log(`Ошибка при отправке FCM уведомления:`, error);
                        if (error.code === 'messaging/registration-token-not-registered' ||
                            error.code === 'messaging/invalid-registration-token') {
                            console.log(`FCM token for user ${userId} expired or invalid.`);
                            return { token, ok: false };
                        } else {
                            console.error(`Error sending FCM to user ${userId}:`, error);
                            return { token, ok: true };
                        }
                    }
                }));

                const validTokens = results.filter(r => r.ok).map(r => r.token);

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
            const query: any = {
                active: true,
                $or: [
                    { pushSubscriptions: { $exists: true, $not: { $size: 0 } } },
                    { fcmTokens: { $exists: true, $not: { $size: 0 } } }
                ]
            };
            if (role) {
                query.role = role;
            }

            const users = await User.find(query);
            console.log(`Найдено пользователей для уведомлений: ${users.length}`);

            const batchSize = 25;
            for (let i = 0; i < users.length; i += batchSize) {
                const batch = users.slice(i, i + batchSize);
                console.log(`Обработка пакета уведомлений: ${i / batchSize + 1} (пользователи ${i + 1}-${Math.min(i + batchSize, users.length)})`);

                const notificationPromises = batch.map(async (user) => {
                    const hasWebSub = user.pushSubscriptions && user.pushSubscriptions.length > 0;
                    const hasFcmSub = user.fcmTokens && user.fcmTokens.length > 0;

                    if (hasWebSub || (messaging && hasFcmSub)) {
                        await this.sendNotification(user, title, body, url);
                        return true;
                    }
                    return false;
                });

                await Promise.all(notificationPromises);
            }
            console.log(`Рассылка уведомлений завершена для ${users.length} пользователей`);
        } catch (error) {
            console.error('Broadcast push error:', error);
        }
    }
}

export default PushNotificationService;
