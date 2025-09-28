import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/Users';

dotenv.config();

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

const checkUser = async () => {
  try {
    await connectDB();
    
    const phone = '+77476254222';
    const user = await User.findOne({ phone }).select('+initialPassword');
    
    if (!user) {
      console.log('❌ User not found with phone:', phone);
    } else {
      console.log('✅ User found:', {
        _id: user._id,
        fullName: user.fullName,
        phone: user.phone,
        role: user.role,
        active: user.active,
        passwordHash: user.passwordHash ? 'exists' : 'not exists',
        initialPassword: user.initialPassword || 'not exists',
        personalCode: (user as any).personalCode || 'not exists',
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      });
    }
    
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error checking user:', error);
    process.exit(1);
  }
};

checkUser();