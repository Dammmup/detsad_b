import User from './src/entities/users/model';
import Payroll from './src/entities/payroll/model';
import { connectDB } from './src/config/database';
import mongoose from 'mongoose';

async function audit() {
    await connectDB();
    try {
        const staff = await User.findOne({ fullName: /Рахия/i });
        if (!staff) return;

        console.log(`\n=== АУДИТ ДЛЯ: ${staff.fullName} ===`);
        const payrolls = await Payroll.find({ staffId: staff._id }).sort({ period: -1 });

        console.log(`Найдено записей: ${payrolls.length}`);
        payrolls.forEach((p, i) => {
            console.log(`\nЗапись #${i + 1}:`);
            console.log(`  ID: ${p._id}`);
            console.log(`  Период: ${p.period}`);
            console.log(`  Статус: ${p.status}`);
            console.log(`  Оклад (baseSalary): ${p.baseSalary}`);
            console.log(`  Тип: ${p.baseSalaryType}`);
            console.log(`  Начислено (accruals): ${p.accruals}`);
            console.log(`  Отработано (workedShifts): ${p.workedShifts}`);
            console.log(`  Штрафы (penalties): ${p.penalties}`);
            console.log(`  Итого (total): ${p.total}`);
            console.log(`  Дата создания: ${p.createdAt}`);
            console.log(`  Дата обновления: ${p.updatedAt}`);
        });
    } finally {
        await mongoose.connection.close();
    }
}

audit();
