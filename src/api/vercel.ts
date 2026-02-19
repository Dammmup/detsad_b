import { Request, Response } from 'express';
import dotenv from 'dotenv';

dotenv.config();

let initPromise: Promise<any> | null = null;

const initialize = async () => {
    if (initPromise) {
        return initPromise;
    }

    initPromise = (async () => {
        try {
            console.log('🔄 Connecting to database for Vercel...');

            const { connectDB } = await import('../config/database');
            await connectDB();

            console.log('✅ Database connected');

            const { default: app } = await import('../app');
            return app;
        } catch (error) {
            // Сброс промиса при ошибке, чтобы можно было повторить инициализацию
            initPromise = null;
            console.error('❌ Initialization error:', error);
            throw error;
        }
    })();

    return initPromise;
};

export default async function handler(req: Request, res: Response) {
    try {
        const app = await initialize();
        return app(req, res);
    } catch (error: any) {
        console.error('Handler error:', error);
        return res.status(500).json({
            error: 'Server initialization failed'
        });
    }
}
