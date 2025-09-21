const mongoose = require('mongoose');
require('dotenv').config();

// Models
const { 
  KindergartenSettings, 
  NotificationSettings, 
  SecuritySettings, 
  GeolocationSettings 
} = require('../src/models/Settings');

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

// Initialize default settings
const initSettings = async () => {
  try {
    // Check if settings already exist
    const existingKindergarten = await KindergartenSettings.findOne();
    const existingNotifications = await NotificationSettings.findOne();
    const existingSecurity = await SecuritySettings.findOne();
    const existingGeolocation = await GeolocationSettings.findOne();
    
    // Kindergarten Settings
    if (!existingKindergarten) {
      const kindergartenSettings = new KindergartenSettings({
        name: 'Детский сад "Альдамирам"',
        address: 'г. Алматы, ул. Цунвазо, 11',
        phone: '+7 (707) 8397376',
        email: 'aldamiram@mail.ru',
        director: 'Салихарова Зухра Харбиевна',
        workingHours: {
          start: '07:00',
          end: '19:00'
        },
        workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        timezone: 'Asia/Almaty',
        language: 'ru',
        currency: 'KZT',
        updatedBy: null
      });
      await kindergartenSettings.save();
      console.log('✅ Kindergarten settings created');
    } else {
      console.log('ℹ️ Kindergarten settings already exist');
    }
    
    // Notification Settings
    if (!existingNotifications) {
      const notificationSettings = new NotificationSettings({
        emailNotifications: true,
        smsNotifications: false,
        pushNotifications: true,
        lateArrivalAlert: true,
        absenceAlert: true,
        overtimeAlert: false,
        reportReminders: true,
        updatedBy: null
      });
      await notificationSettings.save();
      console.log('✅ Notification settings created');
    } else {
      console.log('ℹ️ Notification settings already exist');
    }
    
    // Security Settings
    if (!existingSecurity) {
      const securitySettings = new SecuritySettings({
        passwordPolicy: {
          minLength: 8,
          requireUppercase: true,
          requireLowercase: true,
          requireNumbers: true,
          requireSpecialChars: false
        },
        sessionTimeout: 60,
        twoFactorAuth: false,
        ipWhitelist: [],
        maxLoginAttempts: 5,
        lockoutDuration: 15,
        updatedBy: null
      });
      await securitySettings.save();
      console.log('✅ Security settings created');
    } else {
      console.log('ℹ️ Security settings already exist');
    }
    
    // Geolocation Settings
    if (!existingGeolocation) {
      const geolocationSettings = new GeolocationSettings({
        enabled: false,
        radius: 100,
        coordinates: {
          latitude: 51.1605, // Astana coordinates
          longitude: 71.4704
        },
        strictMode: false,
        allowedDevices: [],
        updatedBy: null
      });
      await geolocationSettings.save();
      console.log('✅ Geolocation settings created');
    } else {
      console.log('ℹ️ Geolocation settings already exist');
    }
    
    console.log('✅ All settings initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing settings:', error);
 }
};

// Main function
const main = async () => {
  await connectDB();
  await initSettings();
  await mongoose.connection.close();
  console.log('✅ Database connection closed');
};

main();