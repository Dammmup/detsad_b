import mongoose from 'mongoose';
import User from '../entities/users/model';
import Payroll from '../entities/payroll/model';
import Report from '../entities/reports/model';
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

    // Получение всех сотрудников с типом adult
    const staff = await User.find({ type: 'adult' });
    console.log(`👥 Найдено ${staff.length} сотрудников`);

    // Текущий месяц для тестовых данных
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

    // Создание записей о зарплате для каждого сотрудника
    const baseSalary = 150000;
    for (const employee of staff) {
      // Генерация случайных значений для начислений, премий и штрафов
      const accruals = baseSalary + Math.floor(Math.random() * 50000); // 150000-200000
      const bonuses = Math.floor(Math.random() * 50000); // 0-50000
      const penalties = Math.floor(Math.random() * 30000); // 0-3000
      const total = accruals + bonuses - penalties;
      
      const payrollData = new Payroll({
        staffId: employee._id,
        month: currentMonth,
        accruals,
        bonuses,
        penalties,
        deductions: 0,
        total,
        status: ['draft', 'approved', 'paid'][Math.floor(Math.random() * 3)],
        history: [{
          date: new Date(),
          action: 'Создан расчетный лист',
          amount: total,
          comment: 'Фиксированная зарплата с бонусами и штрафами'
        }]
      });

      await payrollData.save();
      console.log(`💰 Создан расчетный лист для ${employee.fullName}`);
    }

    console.log(`✅ Создано ${staff.length} записей о зарплате`);
    
    // Создание отчетов на основе данных о зарплате
    // Подсчет агрегированных данных для отчета
    let totalAccruals = 0;
    let totalBonuses = 0;
    let totalPenalties = 0;
    let totalPayout = 0;
    
    for (const employee of staff) {
      const accruals = baseSalary + Math.floor(Math.random() * 50000);
      const bonuses = Math.floor(Math.random() * 50000);
      const penalties = Math.floor(Math.random() * 30000);
      const total = accruals + bonuses - penalties;
      
      totalAccruals += accruals;
      totalBonuses += bonuses;
      totalPenalties += penalties;
      totalPayout += total;
    }
    
    const reportData = {
      title: `Отчет по зарплате за ${currentMonth}`,
      type: 'salary',
      description: `Аналитика по зарплате за ${currentMonth}`,
      dateRange: {
        startDate: new Date(`${currentMonth}-01`),
        endDate: new Date(`${currentMonth}-${new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()}`)
      },
      data: {
        totalEmployees: staff.length,
        totalAccruals,
        totalBonuses,
        totalPenalties,
        totalPayout,
        avgAccruals: staff.length ? Math.round(totalAccruals / staff.length) : 0,
        avgBonuses: staff.length ? Math.round(totalBonuses / staff.length) : 0,
        avgPenalties: staff.length ? Math.round(totalPenalties / staff.length) : 0,
        avgPayout: staff.length ? Math.round(totalPayout / staff.length) : 0
      },
      format: 'pdf',
      status: 'completed',
      createdBy: staff[0]?._id || new mongoose.Types.ObjectId()
    };
    
    const report = new Report(reportData);
    await report.save();
    console.log(`📊 Создан отчет по зарплате за ${currentMonth}`);
    
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