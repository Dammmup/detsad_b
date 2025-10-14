import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import Payroll from '../entities/payroll/model';
import User from '../entities/users/model';

// Загружаем переменные окружения
dotenv.config();

// Подключение к базе данных
const connectDB = async () => {
  try {
    // Используем MONGO_URI из .env файла
    const dbUri = process.env.MONGO_URI;
    if (!dbUri) {
      throw new Error('MONGO_URI is not defined in environment variables');
    }
    await mongoose.connect(dbUri);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
};

// Функция для проверки данных зарплат и пользователей
const checkPayrollData = async () => {
  try {
    console.log('Начинаем проверку данных зарплат и пользователей...');

    // Найдем все записи зарплат без populate
    const allPayrolls = await Payroll.find({});
    console.log(`Найдено ${allPayrolls.length} записей зарплат`);

    for (const payroll of allPayrolls) {
      console.log(`Зарплата ID: ${payroll._id}, staffId: ${payroll.staffId}, period: ${payroll.period}`);
    }

    // Проверим конкретные записи, которые упоминались в вашем сообщении
    const specificPayrolls = await Payroll.find({
      _id: {
        $in: [
          new mongoose.Types.ObjectId('68e4ee3f2dbe4e485f4194e7'),
          new mongoose.Types.ObjectId('68e4f0c84b0a6fcdb83199c4')
        ]
      }
    });

    console.log(`\nНайдено ${specificPayrolls.length} специфических записей:`);
    for (const payroll of specificPayrolls) {
      console.log(`ID: ${payroll._id}, staffId: ${payroll.staffId}, period: ${payroll.period}, baseSalary: ${payroll.baseSalary}`);
      
      // Проверим, действительно ли staffId равен null
      if (payroll.staffId === null || payroll.staffId === undefined) {
        console.log(`  - staffId действительно равен null для этой записи`);
      } else {
        console.log(`  - staffId не равен null, это ObjectId: ${payroll.staffId}`);
      }
    }

    // Найдем всех пользователей
    const allUsers = await User.find({});
    console.log(`\nНайдено ${allUsers.length} пользователей:`);
    for (const user of allUsers) {
      console.log(`ID: ${user._id}, fullName: ${user.fullName}`);
    }

    // Проверим, есть ли у пользователей ссылки на зарплаты
    const usersWithPayroll = await User.find({ payroll: { $exists: true, $ne: null } });
    console.log(`\nНайдено ${usersWithPayroll.length} пользователей со ссылкой на зарплату:`);
    for (const user of usersWithPayroll) {
      console.log(`Пользователь: ${user.fullName}`);
    }

    // Проверим, можем ли мы получить пользователей по staffId из зарплат
    console.log('\nПроверяем, можем ли получить пользователей по staffId из зарплат:');
    for (const payroll of allPayrolls) {
      if (payroll.staffId) {
        // Так как staffId ссылается на коллекцию 'users', а пользователи создаются в коллекции 'auth',
        // то мы не сможем найти пользователей по staffId из зарплат
        console.log(`  Зарплата ${payroll._id} -> staffId: ${payroll.staffId} (ссылается на коллекцию 'users', пользователи в 'auth')`);
      } else {
        console.log(`  Зарплата ${payroll._id} -> staffId равен null`);
      }
    }

    console.log('\nПроверка данных завершена');
  } catch (error) {
    console.error('Ошибка при проверке данных:', error);
    throw error;
  }
};

// Запуск скрипта
const runScript = async () => {
  await connectDB();
  await checkPayrollData();
  mongoose.connection.close();
  console.log('Соединение с базой данных закрыто');
};

runScript();