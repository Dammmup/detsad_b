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
            const user = await User.findById(userId);
            if (!user) return;

            // 1. Web-Push Notifications
            if (user.pushSubscriptions && user.pushSubscriptions.length > 0) {
                const payload = JSON.stringify({ title, body, url });
                const subscriptions = [...user.pushSubscriptions];
                const validSubscriptions = [];

                for (const subscription of subscriptions) {
                    try {
                        await webpush.sendNotification(subscription, payload);
                        validSubscriptions.push(subscription);
                    } catch (error: any) {
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
            }

            // 2. FCM Mobile Notifications
            if (messaging && user.fcmTokens && user.fcmTokens.length > 0) {
                const tokens = [...user.fcmTokens];
                const validTokens = [];

                for (const token of tokens) {
                    try {
                        await messaging.send({
                            token,
                            notification: { title, body },
                            data: { url, click_action: 'FLUTTER_NOTIFICATION_CLICK' },
                            android: { priority: 'high' },
                            apns: { payload: { aps: { sound: 'default' } } }
                        });
                        validTokens.push(token);
                    } catch (error: any) {
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
            }
        } catch (error) {
            console.error('PushNotificationService error:', error);
        }
    }

    static async broadcastNotification(role: string | null, title: string, body: string, url: string = '/') {
        try {
            const query: any = { active: true };
            if (role) {
                query.role = role;
            }

            const users = await User.find(query);
            for (const user of users) {
                const hasWebSub = user.pushSubscriptions && user.pushSubscriptions.length > 0;
                const hasFcmSub = user.fcmTokens && user.fcmTokens.length > 0;

                if (hasWebSub || (messaging && hasFcmSub)) {
                    await this.sendNotification(user._id as string, title, body, url);
                }
            }
        } catch (error) {
            console.error('Broadcast push error:', error);
        }
    }
}

export default PushNotificationService;
