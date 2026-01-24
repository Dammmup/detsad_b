import { Request, Response } from 'express';
import User from './model';

export const subscribe = async (req: Request, res: Response) => {
    try {
        const { subscription } = req.body;
        const userId = (req as any).user?._id;

        if (!userId) {
            return res.status(401).json({ message: 'Пользователь не авторизован' });
        }

        if (!subscription || !subscription.endpoint) {
            return res.status(400).json({ message: 'Некорректная подписка' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'Пользователь не найден' });
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

export const unsubscribe = async (req: Request, res: Response) => {
    try {
        const { endpoint } = req.body;
        const userId = (req as any).user?._id;

        if (!userId) {
            return res.status(401).json({ message: 'Пользователь не авторизован' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'Пользователь не найден' });
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

export const subscribeFCM = async (req: Request, res: Response) => {
    try {
        const { token } = req.body;
        const userId = (req as any).user?._id;

        if (!userId) {
            return res.status(401).json({ message: 'Пользователь не авторизован' });
        }

        if (!token) {
            return res.status(400).json({ message: 'Token is required' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'Пользователь не найден' });
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

export const unsubscribeFCM = async (req: Request, res: Response) => {
    try {
        const { token } = req.body;
        const userId = (req as any).user?._id;

        if (!userId) {
            return res.status(401).json({ message: 'Пользователь не авторизован' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'Пользователь не найден' });
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
