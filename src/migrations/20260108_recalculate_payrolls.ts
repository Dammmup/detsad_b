import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import path from 'path';
import { connectDB } from '../config/database';
import User from '../entities/users/model';
import { PayrollService } from '../entities/payroll/service';

// Загрузка переменных окружения
dotenv.config({ path: path.join(__dirname, '../../.env') });

const recalculateAllForPeriod = async (period: string) => {
    try {
        console.log(`🚀 Начинаем полный пересчёт зарплат за период: ${period}`);
        console.log('='.repeat(50));

        await connectDB();
        console.log('✅ Подключение к БД установлено');

        const payrollService = new PayrollService();

        // 1. Получаем всех активных сотрудников (кроме админов)
        const staff = await User.find({
            role: { $ne: 'admin' },
            active: true
        });

        console.log(`Найдено ${staff.length} сотрудников для пересчёта.`);

        let successCount = 0;
        let errorCount = 0;

        // 2. Для каждого сотрудника вызываем ensurePayrollForUser
        // Этот метод теперь исправлен и пересчитает всё корректно
        for (const employee of staff) {
            try {
                process.stdout.write(`⏳ Пересчёт для ${employee.fullName}... `);

                await payrollService.ensurePayrollForUser(employee._id.toString(), period);

                process.stdout.write('✅ Готово\n');
                successCount++;
            } catch (err) {
                console.error(`\n❌ Ошибка для сотрудника ${employee.fullName}:`, err);
                errorCount++;
            }
        }

        console.log('='.repeat(50));
        console.log(`🎉 Миграция завершена!`);
        console.log(`✅ Успешно: ${successCount}`);
        console.log(`❌ Ошибок: ${errorCount}`);

        await mongoose.connection.close();
        console.log('✅ Соединение с БД закрыто');
        process.exit(0);

    } catch (error) {
        console.error('❌ Критическая ошибка при миграции:', error);
        process.exit(1);
    }
};

// Запуск для текущего месяца (Январь 2026)
const targetPeriod = '2026-01';
recalculateAllForPeriod(targetPeriod);
