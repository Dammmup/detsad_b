import dotenv from 'dotenv';
import app from './app';
import { initializeTaskScheduler } from './services/taskScheduler';
import './sentry';
import { connectDB } from './config/database';
import mongoose from 'mongoose';

dotenv.config();

const PORT = Number(process.env.PORT) || 8080;

const startServer = async () => {
  try {
    await connectDB();

    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);

      try {
        initializeTaskScheduler();
      } catch (error) {
        console.error('❌ Failed to initialize task scheduler:', error);
      }
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      console.log(`\n${signal} received. Shutting down gracefully...`);
      server.close(async () => {
        try {
          await mongoose.connection.close();
          console.log('✅ MongoDB connection closed');
        } catch (err) {
          console.error('❌ Error closing MongoDB connection:', err);
        }
        process.exit(0);
      });

      // Принудительное завершение если graceful shutdown занимает слишком долго
      setTimeout(() => {
        console.error('❌ Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
