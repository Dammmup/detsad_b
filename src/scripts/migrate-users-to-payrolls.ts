// Миграция: перенос сотрудников в payrolls без суммы
// node backend/src/scripts/migrate-users-to-payrolls.ts

import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: __dirname + '/../../.env' });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/detsad';

const User = require('../models/Users').default;
const Payroll = require('../models/Payroll').default;

async function migrate() {
  await mongoose.connect(MONGO_URI);
  const month = new Date().toISOString().slice(0, 7); // текущий месяц YYYY-MM
  const users = await User.find();
  let created = 0;
  for (const user of users) {
    // Проверяем, есть ли уже payroll на этот месяц
    const exists = await Payroll.findOne({ staffId: user._id, month });
    if (!exists) {
      await Payroll.create({
        staffId: user._id,
        month,
        accruals: 0,
        deductions: 0,
        bonuses: 0,
        penalties: 0,
        total: 0,
        status: 'draft',
        history: []
      });
      created++;
    }
  }
  console.log(`Создано расчетных листов: ${created}`);
  await mongoose.disconnect();
}

migrate().catch(e => { console.error(e); process.exit(1); });
