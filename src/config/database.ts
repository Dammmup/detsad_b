import mongoose from 'mongoose';

let isConnected = false;

/**
 * Подключение к MongoDB
 */
export const connectDB = async (): Promise<void> => {
  if (isConnected) {
    console.log('⚡ Using existing database connection');
    return;
  }

  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb+srv://damir:damir@cluster0.ku60i6n.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0';

    await mongoose.connect(mongoURI);
    isConnected = true;
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    throw error;
  }
};

/**
 * Алиас для совместимости с миграциями
 */
export const connectDatabases = connectDB;

export default connectDB;