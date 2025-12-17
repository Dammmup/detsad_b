import { Request, Response } from 'express';
import dotenv from 'dotenv';

dotenv.config();

// Флаг для отслеживания инициализации
let isInitialized = false;
let appInstance: any = null;

// Инициализация базы данных и загрузка приложения
const initialize = async () => {
    if (isInitialized && appInstance) {
        return appInstance;
    }

    try {
        console.log('🔄 Инициализация моделей для Vercel...');

        // ВАЖНО: Сначала инициализируем модели
        const { initializeModels } = await import('../config/modelRegistry');
        await initializeModels();

        console.log('✅ Модели успешно инициализированы');

        // Только ПОСЛЕ инициализации импортируем app
        const { default: app } = await import('../app');
        appInstance = app;
        isInitialized = true;

        return appInstance;
    } catch (error) {
        console.error('❌ Ошибка инициализации:', error);
        throw error;
    }
};

// Экспорт для Vercel Serverless Function
export default async function handler(req: Request, res: Response) {
    try {
        const app = await initialize();
        return app(req, res);
    } catch (error: any) {
        console.error('Handler error:', error);
        return res.status(500).json({
            error: 'Database initialization failed',
            message: error.message
        });
    }
}
