import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import app from './app';
import { initializeTaskScheduler } from './services/taskScheduler';
import './sentry';
import { connectDB } from './config/database';

dotenv.config();

const PORT = Number(process.env.PORT) || 8080;

const startServer = async () => {
  try {
    await connectDB();

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
