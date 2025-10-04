import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import app from './app';
// import { initializeTaskScheduler } from './services/taskScheduler'; // Временно отключено, так как файл не найден

dotenv.config();

const PORT = process.env.PORT || 8080;

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb+srv://damir:damir@cluster0.ku60i6n.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      // Инициализируем планировщик задач
      // initializeTaskScheduler(); // Временно отключено, так как файл не найден
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
