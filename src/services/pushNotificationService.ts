import webpush from 'web-push';
import User from '../entities/users/model';
import dotenv from 'dotenv';

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
            if (!user || !user.pushSubscriptions || user.pushSubscriptions.length === 0) {
                return;
            }

            const payload = JSON.stringify({
                title,
                body,
                url
            });

            const subscriptions = [...user.pushSubscriptions];
            const validSubscriptions = [];

            for (const subscription of subscriptions) {
                try {
                    await webpush.sendNotification(subscription, payload);
                    validSubscriptions.push(subscription);
                } catch (error: any) {
                    if (error.statusCode === 410 || error.statusCode === 404) {
                        // Subscription has expired or is no longer valid
                        console.log(`Push subscription for user ${userId} expired.`);
                    } else {
                        console.error(`Error sending push to user ${userId}:`, error);
                        validSubscriptions.push(subscription);
                    }
                }
            }

            // Update user subscriptions if some were removed
            if (validSubscriptions.length !== subscriptions.length) {
                user.pushSubscriptions = validSubscriptions;
                await user.save();
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
                if (user.pushSubscriptions && user.pushSubscriptions.length > 0) {
                    await this.sendNotification(user._id as string, title, body, url);
                }
            }
        } catch (error) {
            console.error('Broadcast push error:', error);
        }
    }
}

export default PushNotificationService;
