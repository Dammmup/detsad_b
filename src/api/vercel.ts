import { Request, Response } from 'express';
import app from '../app';
import { initializeModels } from '../config/modelRegistry';
import dotenv from 'dotenv';

dotenv.config();

// Флаг для отслеживания инициализации
let isInitialized = false;

// Middleware для инициализации базы данных перед каждым запросом
const initMiddleware = async () => {
    if (!isInitialized) {
        try {
            console.log('🔄 Инициализация моделей для Vercel...');
            await initializeModels();
            isInitialized = true;
            console.log('✅ Модели успешно инициализированы');
        } catch (error) {
            console.error('❌ Ошибка инициализации моделей:', error);
            throw error;
        }
    }
};

// Экспорт для Vercel Serverless Function
export default async function handler(req: Request, res: Response) {
    try {
        // Инициализация базы данных перед обработкой запроса
        await initMiddleware();

        // Передача запроса в Express приложение
        return app(req, res);
    } catch (error: any) {
        console.error('Handler error:', error);
        return res.status(500).json({
            error: 'Database initialization failed',
            message: error.message
        });
    }
}
