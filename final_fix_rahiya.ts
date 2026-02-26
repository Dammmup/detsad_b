
import mongoose from 'mongoose';
import User from './src/entities/users/model';
import Payroll from './src/entities/payroll/model';
import { PayrollService } from './src/entities/payroll/service';
import dotenv from 'dotenv';

dotenv.config();

async function fix() {
    await mongoose.connect(process.env.MONGODB_URI!);

    // 1. Исправляем пользователя
    const user = await User.findOne({ fullName: /Рахия Ирова/ });
    if (!user) {
        console.error('User not found');
        process.exit(1);
    }

    console.log('Fixing user settings...');
    (user as any).baseSalaryType = 'shift';
    (user as any).shiftRate = 9000;
    (user as any).baseSalary = 180000;
    await user.save();

    // 2. Удаляем ВСЕ существующие расчетные листы за февраль 2026 для нее
    console.log('Cleaning up old payrolls...');
    await Payroll.deleteMany({ staffId: user._id, period: '2026-02' });

    // 3. Генерируем новый
    console.log('Generating new payroll...');
    const service = new PayrollService();
    await service.ensurePayrollForUser(user._id.toString(), '2026-02', true);

    const final = await Payroll.findOne({ staffId: user._id, period: '2026-02' });
    if (final) {
        console.log('FINAL RESULT:');
        console.log('  Accruals:', final.accruals);
        console.log('  WorkedShifts:', final.workedShifts);
        console.log('  Total:', final.total);
        console.log('  BaseSalaryType:', final.baseSalaryType);
    }

    await mongoose.disconnect();
}

fix();
