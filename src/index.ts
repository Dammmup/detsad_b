import express from 'express';
import dotenv from 'dotenv';
import app from './app';
import { initializeTaskScheduler } from './services/taskScheduler';
import './sentry';
import { initializeModels } from './config/modelRegistry';

dotenv.config();

const PORT = Number(process.env.PORT) || 8080;

const startServer = async () => {
  try {

    await initializeModels();

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);

      initializeTaskScheduler();
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
