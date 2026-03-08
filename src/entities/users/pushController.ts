import { Request, Response, RequestHandler } from 'express';
import User from './model';
import PushNotificationService from '../../services/pushNotificationService';

export const subscribe: RequestHandler = async (req, res) => {
    try {
        const { subscription } = req.body;
        const userId = (req as any).user?.id || (req as any).user?._id;

        if (!userId) {
            res.status(401).json({ message: 'Пользователь не авторизован' });
            return;
        }

        if (!subscription || !subscription.endpoint) {
            res.status(400).json({ message: 'Некорректная подписка' });
            return;
        }

        const user = await User.findById(userId);
        if (!user) {
            res.status(404).json({ message: 'Пользователь не найден' });
            return;
        }

        // Initialize pushSubscriptions if it doesn't exist
        if (!user.pushSubscriptions) {
            user.pushSubscriptions = [];
        }

        // Check if subscription already exists
        const exists = user.pushSubscriptions.some(sub => sub.endpoint === subscription.endpoint);
        if (!exists) {
            user.pushSubscriptions.push(subscription);
            await user.save();
        }

        res.status(200).json({ success: true, message: 'Подписка успешно сохранена' });
    } catch (error: any) {
        console.error('Push subscribe error:', error);
        res.status(500).json({ message: 'Ошибка при сохранении подписки', error: error.message });
    }
};

export const unsubscribe: RequestHandler = async (req, res) => {
    try {
        const { endpoint } = req.body;
        const userId = (req as any).user?.id || (req as any).user?._id;

        if (!userId) {
            res.status(401).json({ message: 'Пользователь не авторизован' });
            return;
        }

        const user = await User.findById(userId);
        if (!user) {
            res.status(404).json({ message: 'Пользователь не найден' });
            return;
        }

        if (user.pushSubscriptions) {
            user.pushSubscriptions = user.pushSubscriptions.filter(sub => sub.endpoint !== endpoint);
            await user.save();
        }

        res.status(200).json({ success: true, message: 'Подписка успешно удалена' });
    } catch (error: any) {
        console.error('Push unsubscribe error:', error);
        res.status(500).json({ message: 'Ошибка при удалении подписки', error: error.message });
    }
};

export const subscribeFCM: RequestHandler = async (req, res) => {
    try {
        const { token } = req.body;
        const userId = (req as any).user?.id || (req as any).user?._id;

        if (!userId) {
            res.status(401).json({ message: 'Пользователь не авторизован' });
            return;
        }

        if (!token) {
            res.status(400).json({ message: 'Token is required' });
            return;
        }

        const user = await User.findById(userId);
        if (!user) {
            res.status(404).json({ message: 'Пользователь не найден' });
            return;
        }

        if (!user.fcmTokens) {
            user.fcmTokens = [];
        }

        if (!user.fcmTokens.includes(token)) {
            user.fcmTokens.push(token);
            await user.save();
        }

        res.status(200).json({ success: true, message: 'FCM токен успешно сохранен' });
    } catch (error: any) {
        console.error('FCM subscribe error:', error);
        res.status(500).json({ message: 'Ошибка при сохранении FCM токена', error: error.message });
    }
};

export const unsubscribeFCM: RequestHandler = async (req, res) => {
    try {
        const { token } = req.body;
        const userId = (req as any).user?._id;

        if (!userId) {
            res.status(401).json({ message: 'Пользователь не авторизован' });
            return;
        }

        const user = await User.findById(userId);
        if (!user) {
            res.status(404).json({ message: 'Пользователь не найден' });
            return;
        }

        if (user.fcmTokens) {
            user.fcmTokens = user.fcmTokens.filter(t => t !== token);
            await user.save();
        }

        res.status(200).json({ success: true, message: 'FCM токен успешно удален' });
    } catch (error: any) {
        console.error('FCM unsubscribe error:', error);
        res.status(500).json({ message: 'Ошибка при удалении FCM токена', error: error.message });
    }
};

export const testPush: RequestHandler = async (req, res) => {
    try {
        const userId = (req as any).user?.id || (req as any).user?._id;
        if (!userId) {
            res.status(401).json({ message: 'Пользователь не авторизован' });
            return;
        }

        const user = await User.findById(userId);
        if (!user || (!user.pushSubscriptions?.length && !user.fcmTokens?.length)) {
            res.status(400).json({
                success: false,
                message: 'У вас нет активных подписок на уведомления. Пожалуйста, включите их в приложении.'
            });
            return;
        }

        await PushNotificationService.sendNotification(
            user,
            'Тестовое уведомление 🔔',
            `Проверка работы Push-уведомлений. Время: ${new Date().toLocaleTimeString('ru-RU', { timeZone: 'Asia/Almaty' })}`,
            '/'
        );

        res.status(200).json({ success: true, message: 'Тестовое уведомление отправлено' });
    } catch (error: any) {
        console.error('Test push error:', error);
        res.status(500).json({ message: 'Ошибка при отправке тестового уведомления', error: error.message });
    }
};
