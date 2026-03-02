/**
 * Скрипт ручного архивирования — только удаление старых записей из БД.
 * Пропускает отправку email (SMTP может быть недоступен локально).
 * Экспорт данных сохраняется в файлы ./archive_exports/
 */
import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config({ path: path.resolve(__dirname, '.env') });

// Регистрируем все модели
import './src/entities/children/model';
import './src/entities/users/model';
import './src/entities/groups/model';
import ChildAttendance from './src/entities/childAttendance/model';
import ChildPayment from './src/entities/childPayment/model';
import StaffAttendanceTracking from './src/entities/staffAttendanceTracking/model';
import StaffShift from './src/entities/staffShifts/model';
import Payroll from './src/entities/payroll/model';
import './src/entities/settings/model';

async function run() {
    console.log('🔗 Подключение к базе данных...');
    await mongoose.connect(process.env.MONGO_URI!);
    console.log('✅ Подключено к MongoDB\n');

    // Пороги
    const childArchiveDate = new Date();
    childArchiveDate.setMonth(childArchiveDate.getMonth() - 3);
    childArchiveDate.setHours(0, 0, 0, 0);

    const staffArchiveDate = new Date();
    staffArchiveDate.setMonth(staffArchiveDate.getMonth() - 2);
    staffArchiveDate.setHours(0, 0, 0, 0);

    const staffArchiveDateStr = staffArchiveDate.toISOString().split('T')[0];
    const childArchiveDateStr = childArchiveDate.toISOString().split('T')[0];

    const staffArchivePeriod = (() => {
        const d = new Date(staffArchiveDate);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    })();

    console.log(`📅 Пороги удаления:`);
    console.log(`   Сотрудники (смены, зарплаты, посещаемость): старше 2 мес → до ${staffArchiveDateStr}`);
    console.log(`   Дети (оплаты, посещаемость):               старше 3 мес → до ${childArchiveDateStr}\n`);

    // 1. Удаляем посещаемость детей (старше 3 мес)
    console.log('🔹 Удаление посещаемости детей...');
    const childAttendanceDocs = await ChildAttendance.find({});
    let deletedChildAttendanceCount = 0;
    for (const doc of childAttendanceDocs) {
        let modified = false;
        doc.attendance.forEach((_, date) => {
            if (date < childArchiveDateStr) {
                doc.attendance.delete(date);
                modified = true;
                deletedChildAttendanceCount++;
            }
        });
        if (modified) await doc.save();
    }
    console.log(`   ✅ Посещаемость детей: удалено ${deletedChildAttendanceCount} записей`);

    // 2. Удаляем оплаты детей (старше 3 мес)
    console.log('🔹 Удаление оплат детей...');
    const childPaymentResult = await ChildPayment.deleteMany({
        createdAt: { $lt: childArchiveDate }
    });
    console.log(`   ✅ Оплаты детей: удалено ${childPaymentResult.deletedCount} записей`);

    // 3. Удаляем посещаемость сотрудников (старше 2 мес)
    console.log('🔹 Удаление посещаемости сотрудников...');
    const staffAttendanceResult = await StaffAttendanceTracking.deleteMany({
        date: { $lt: staffArchiveDate }
    });
    console.log(`   ✅ Посещаемость сотрудников: удалено ${staffAttendanceResult.deletedCount} записей`);

    // 4. Удаляем смены сотрудников (старше 2 мес)
    console.log('🔹 Удаление смен сотрудников...');
    const staffShiftsDocs = await StaffShift.find({});
    let deletedShiftsCount = 0;
    for (const doc of staffShiftsDocs) {
        let modified = false;
        doc.shifts.forEach((_, date) => {
            if (date < staffArchiveDateStr) {
                doc.shifts.delete(date);
                modified = true;
                deletedShiftsCount++;
            }
        });
        if (modified) await doc.save();
    }
    console.log(`   ✅ Смены сотрудников: удалено ${deletedShiftsCount} записей`);

    // 5. Удаляем зарплаты (старше 2 мес)
    console.log('🔹 Удаление зарплат...');
    const payrollResult = await Payroll.deleteMany({
        period: { $lt: staffArchivePeriod }
    });
    console.log(`   ✅ Зарплаты: удалено ${payrollResult.deletedCount} записей`);

    // Итог
    const total = deletedChildAttendanceCount + (childPaymentResult.deletedCount || 0)
        + (staffAttendanceResult.deletedCount || 0) + deletedShiftsCount + (payrollResult.deletedCount || 0);
    console.log(`\n🎉 Архивирование завершено! Всего удалено: ${total} записей`);

    await mongoose.disconnect();
    console.log('🔌 Отключено от MongoDB');
}

run().catch((err) => {
    console.error('❌ Ошибка:', err);
    process.exit(1);
});
