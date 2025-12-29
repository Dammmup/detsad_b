import mongoose from 'mongoose';
import { connectDB } from '../src/config/database';
import StaffAttendanceTracking from '../src/entities/staffAttendanceTracking/model';
import Shift from '../src/entities/staffShifts/model';
import Payroll from '../src/entities/payroll/model';
import User from '../src/entities/users/model';
import { calculatePenalties, getWorkingDaysInMonth, shouldCountAttendance } from '../src/services/payrollAutomationService';
import { SettingsService } from '@src/entities/settings/service';


const TIMEZONE_OFFSET = 5 * 60;


const recalculateAllLateMinutes = async () => {
    const settingsService = new SettingsService();
    const settings = await settingsService.getKindergartenSettings();
    const workingStart = settings?.workingHours?.start || '09:00';

    const attendanceRecords = await StaffAttendanceTracking.find({
        actualStart: { $exists: true, $ne: null }
    });

    console.log(`\n📊 Пересчёт lateMinutes для ${attendanceRecords.length} записей посещаемости...`);

    let updatedCount = 0;

    for (const record of attendanceRecords) {
        try {

            const recordDate = new Date(record.date || record.actualStart);
            const dateStr = [
                recordDate.getFullYear(),
                String(recordDate.getMonth() + 1).padStart(2, '0'),
                String(recordDate.getDate()).padStart(2, '0')
            ].join('-');

            const shift = await Shift.findOne({
                staffId: record.staffId,
                date: dateStr
            });

            if (!shift) continue;

            const [schedStartH, schedStartM] = (shift as any).startTime ? (shift as any).startTime.split(':').map(Number) : [9, 0];
            const [defStartH, defStartM] = [9, 0];
            const schedStartH_fixed = 9;
            const schedStartM_fixed = 0;


            const actualStartUTC = new Date(record.actualStart);
            const actualStartMinutesUTC = actualStartUTC.getUTCHours() * 60 + actualStartUTC.getUTCMinutes();
            const actualStartMinutesLocal = actualStartMinutesUTC + TIMEZONE_OFFSET;

            const actualMinutes = actualStartMinutesLocal >= 1440 ? actualStartMinutesLocal - 1440 : actualStartMinutesLocal;


            const scheduledMinutes = schedStartH_fixed * 60 + schedStartM_fixed;


            let lateMinutes = 0;
            if (actualMinutes > scheduledMinutes) {
                lateMinutes = actualMinutes - scheduledMinutes;
            }


            if (record.lateMinutes !== lateMinutes) {
                await StaffAttendanceTracking.findByIdAndUpdate(record._id, { lateMinutes });
                updatedCount++;
                console.log(`  ✓ ${dateStr}: ${record.lateMinutes} → ${lateMinutes} мин (actual: ${Math.floor(actualMinutes / 60)}:${String(actualMinutes % 60).padStart(2, '0')})`);
            }
        } catch (error) {
            console.error(`  ✗ Ошибка для записи ${record._id}:`, error);
        }
    }

    console.log(`✅ Обновлено ${updatedCount} записей lateMinutes\n`);
    return updatedCount;
};


const recalculateAllPayrolls = async () => {


    const payrolls = await Payroll.find();
    const periods = [...new Set(payrolls.map(p => p.period))];

    console.log(`📊 Пересчёт payrolls для ${periods.length} периодов...`);

    let totalUpdated = 0;

    for (const period of periods) {
        console.log(`\n  Период: ${period}`);


        const startDate = new Date(`${period}-01`);
        let workDaysInMonth = await getWorkingDaysInMonth(startDate);
        if (workDaysInMonth <= 0) {
            const year = startDate.getFullYear();
            const month = startDate.getMonth();
            const lastDay = new Date(year, month + 1, 0).getDate();
            for (let d = 1; d <= lastDay; d++) {
                const dayOfWeek = new Date(year, month, d).getDay();
                if (dayOfWeek !== 0 && dayOfWeek !== 6) workDaysInMonth++;
            }
        }
        console.log(`    Рабочих дней в месяце: ${workDaysInMonth}`);


        const periodPayrolls = await Payroll.find({ period });

        for (const payroll of periodPayrolls) {
            try {
                const staffId = payroll.staffId
                    ? (typeof payroll.staffId === 'object' && '_id' in payroll.staffId
                        ? String((payroll.staffId as any)._id)
                        : String(payroll.staffId))
                    : null;

                if (!staffId) continue;


                const staff = await User.findById(staffId);
                if (!staff) continue;

                const baseSalaryRaw = Number((staff as any).baseSalary);
                const baseSalary = baseSalaryRaw > 0 ? baseSalaryRaw : 180000;
                const baseSalaryType = ((staff as any).salaryType as string) || 'month';
                const shiftRate = Number((staff as any).shiftRate || 0);


                const attendancePenalties = await calculatePenalties(staffId, period, staff as any, 13);
                const attendedRecords = attendancePenalties.attendanceRecords.filter((r: any) => shouldCountAttendance(r));


                let accruals = 0;
                const workedShifts = attendedRecords.length;
                const workedDays = workedShifts;

                if ((baseSalaryType === 'month' || !baseSalaryType)) {
                    accruals = Math.round((baseSalary / workDaysInMonth) * workedShifts);
                } else if (baseSalaryType === 'shift') {
                    accruals = workedShifts * shiftRate;
                } else {
                    accruals = Math.round((baseSalary / workDaysInMonth) * workedShifts);
                }


                const shiftDetails: any[] = [];
                let calculatedDailyPay = 0;

                if ((baseSalaryType === 'month' || !baseSalaryType) && workDaysInMonth > 0) {
                    calculatedDailyPay = Math.round(baseSalary / workDaysInMonth);
                } else if (baseSalaryType === 'shift') {
                    calculatedDailyPay = shiftRate;
                } else if (workDaysInMonth > 0) {
                    calculatedDailyPay = Math.round(baseSalary / workDaysInMonth);
                }

                for (const record of attendedRecords) {
                    shiftDetails.push({
                        date: new Date(record.actualStart),
                        earnings: calculatedDailyPay,
                        fines: 0,
                        net: calculatedDailyPay,
                        reason: `Смена ${new Date(record.actualStart).toLocaleDateString('ru-RU')}`
                    });
                }


                const newFines = attendancePenalties.attendanceRecords
                    .filter((r: any) => r.lateMinutes > 0)
                    .map((r: any) => ({
                        amount: r.lateMinutes * 13,
                        reason: `Опоздание: ${r.lateMinutes} мин`,
                        type: 'late',
                        date: new Date(r.actualStart),
                        createdAt: new Date()
                    }));


                const existingManualFines = payroll.fines?.filter(f => f.type === 'manual') || [];
                const allFines = [...existingManualFines, ...newFines];

                const latePenalties = attendancePenalties.latePenalties;
                const absencePenalties = attendancePenalties.absencePenalties;
                const userFines = existingManualFines.reduce((sum, f) => sum + f.amount, 0);
                const totalPenalties = latePenalties + absencePenalties + userFines;
                const total = Math.max(0, accruals - totalPenalties);


                payroll.accruals = accruals;
                payroll.baseSalary = baseSalary;
                payroll.baseSalaryType = 'month';
                payroll.shiftRate = shiftRate;
                payroll.workedDays = workedDays;
                payroll.workedShifts = workedShifts;
                payroll.shiftDetails = shiftDetails;
                payroll.fines = allFines;
                payroll.latePenalties = latePenalties;
                payroll.latePenaltyRate = 13;
                payroll.absencePenalties = absencePenalties;
                payroll.userFines = userFines;
                payroll.penalties = totalPenalties;
                payroll.total = total;


                const validStatuses = ['draft', 'generated', 'approved', 'paid', 'processed'];
                if (!validStatuses.includes(payroll.status as string)) {
                    payroll.status = 'draft';
                }

                await payroll.save();
                totalUpdated++;

                console.log(`    ✓ ${staff.fullName}: accruals=${accruals}, penalties=${totalPenalties}, total=${total}`);
            } catch (error) {
                console.error(`    ✗ Ошибка для payroll ${payroll._id}:`, error);
            }
        }
    }

    console.log(`\n✅ Обновлено ${totalUpdated} записей payroll\n`);
    return totalUpdated;
};


const recalculateAll = async () => {
    try {
        console.log('🚀 Начинаем полный пересчёт данных...\n');
        console.log('='.repeat(50));


        await connectDB();
        console.log('✅ Подключение к БД установлено\n');


        console.log('📌 ШАГ 1: Пересчёт lateMinutes в staff_attendance_tracking');
        console.log('-'.repeat(50));
        await recalculateAllLateMinutes();


        console.log('📌 ШАГ 2: Пересчёт записей в payrolls');
        console.log('-'.repeat(50));
        await recalculateAllPayrolls();

        console.log('='.repeat(50));
        console.log('🎉 Пересчёт завершён успешно!\n');


        await mongoose.connection.close();
        console.log('✅ Соединение с БД закрыто');
        process.exit(0);

    } catch (error) {
        console.error('❌ Ошибка при пересчёте:', error);
        process.exit(1);
    }
};


if (require.main === module) {
    recalculateAll();
}

export { recalculateAll };
