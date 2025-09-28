// Быстрый скрипт для вывода всех пользователей и их полей
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: __dirname + '/../../.env' });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/detsad';
const User = require('../models/Users').default;

async function showUsers() {
  await mongoose.connect(MONGO_URI);
  const users = await User.find({}).limit(20);
  for (const user of users) {
    console.log(user.toObject());
  }
  await mongoose.disconnect();
}

showUsers().catch(e => { console.error(e); process.exit(1); });
