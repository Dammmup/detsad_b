import mongoose from 'mongoose';
import User from '../models/Users';
import Payroll from '../models/Payroll';
import dotenv from 'dotenv';

dotenv.config();

const populatePayrollData = async () => {
  try {
    // Подключение к базе данных
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/kindergarten';
    await mongoose.connect(mongoURI);
    console.log('✅ Подключено к базе данных');

    // Удаление существующих данных о зарплате
    await Payroll.deleteMany({});
    console.log('🗑️ Удалены существующие данные о зарплате');

    // Получение всех сотрудников
    const staff = await User.find({ role: { $in: ['admin', 'teacher', 'staff', 'manager', 'accountant'] } });
    console.log(`👥 Найдено ${staff.length} сотрудников`);

    // Текущий месяц для тестовых данных
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

    // Создание записей о зарплате для каждого сотрудника
    for (const employee of staff) {
      const payrollData = new Payroll({
        staffId: employee._id,
        month: currentMonth,
        accruals: 150000, // 150 000 тенге
        bonuses: 0,
        penalties: 0,
        deductions: 0,
        total: 150000, // 150 000 тенге
        status: 'draft',
        history: [{
          date: new Date(),
          action: 'Создан расчетный лист',
          amount: 150000,
          comment: 'Фиксированная зарплата'
        }]
      });

      await payrollData.save();
      console.log(`💰 Создан расчетный лист для ${employee.fullName}`);
    }

    console.log(`✅ Создано ${staff.length} записей о зарплате`);
    
    // Закрытие соединения
    await mongoose.connection.close();
    console.log('🔒 Соединение с базой данных закрыто');
  } catch (error) {
    console.error('❌ Ошибка при заполнении данных о зарплате:', error);
    process.exit(1);
  }
};

// Запуск скрипта
populatePayrollData();