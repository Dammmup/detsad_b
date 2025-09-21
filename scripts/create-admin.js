const mongoose = require('mongoose');
require('dotenv').config();
const { hashPassword } = require('../src/utils/hash');

// User model
const User = require('../src/models/Users');

// Connect to MongoDB
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/kindergarten';
    await mongoose.connect(mongoURI, { dbName: 'test' });
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Create admin user
const createAdmin = async () => {
  try {
    // Check if admin already exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log('ℹ️ Admin user already exists');
      return;
    }
    
    // Create admin user
    const password = 'Admin123!';
    const passwordHash = await hashPassword(password);
    
    const adminUser = new User({
      fullName: 'Администратор системы',
      phone: '+77771111111',
      passwordHash,
      role: 'admin',
      type: 'adult',
      active: true
    });
    
    await adminUser.save();
    console.log('✅ Admin user created successfully');
    console.log('Login credentials:');
    console.log('- Phone: +7777111111');
    console.log('- Password: Admin123!');
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  }
};

// Main function
const main = async () => {
  await connectDB();
  await createAdmin();
  await mongoose.connection.close();
  console.log('✅ Database connection closed');
};

main();