import { Request, Response } from 'express';
import dotenv from 'dotenv';

dotenv.config();

let isInitialized = false;
let appInstance: any = null;

const initialize = async () => {
    if (isInitialized && appInstance) {
        return appInstance;
    }

    try {
        console.log('🔄 Connecting to database for Vercel...');

        // Подключаемся к БД
        const { connectDB } = await import('../config/database');
        await connectDB();

        console.log('✅ Database connected');

        // Импортируем app после подключения БД
        const { default: app } = await import('../app');
        appInstance = app;
        isInitialized = true;

        return appInstance;
    } catch (error) {
        console.error('❌ Initialization error:', error);
        throw error;
    }
};

export default async function handler(req: Request, res: Response) {
    try {
        const app = await initialize();
        return app(req, res);
    } catch (error: any) {
        console.error('Handler error:', error);
        return res.status(500).json({
            error: 'Server initialization failed',
            message: error.message
        });
    }
}
