import mongoose from 'mongoose';
import { connectDB } from '../src/config/database';
import StaffAttendanceTracking from '../src/entities/staffAttendanceTracking/model';
import Shift from '../src/entities/staffShifts/model';
import { SettingsService } from '../src/entities/settings/service';


const recalculateLateMinutes = async () => {
    try {
        console.log('Начинаем подключение к базе данных...');


        await connectDB();


        const dbConnection = mongoose.connection;

        console.log('Подключение к базе данных установлено');




        const totalCount = await StaffAttendanceTracking.countDocuments();
        console.log(`Всего записей в staff_attendance_tracking: ${totalCount}`);


        const attendanceRecords = await StaffAttendanceTracking.find({
            actualStart: { $exists: true, $ne: null }
        });

        console.log(`Найдено ${attendanceRecords.length} записей с actualStart`);

        let updatedCount = 0;
        let skippedCount = 0;


        for (let i = 0; i < attendanceRecords.length; i++) {
            const record = attendanceRecords[i];

            try {

                let shift;
                if (record.shiftId) {
                    shift = await Shift.findById(record.shiftId);
                } else {

                    if (record.date && record.staffId) {
                        shift = await Shift.findOne({
                            date: record.date,
                            staffId: record.staffId
                        });
                    }
                }

                if (!shift) {
                    console.log(`Смена не найдена для записи ${record._id}`);
                    skippedCount++;
                    continue;
                }
                // Получаем настройки для начала рабочего дня
                const settingsService = new SettingsService();
                const settings = await settingsService.getKindergartenSettings();
                const workingStart = settings?.workingHours?.start

                if (!workingStart) {
                    console.log(`У смены ${shift._id} нет времени начала`);
                    skippedCount++;
                    continue;
                }


                const [shiftHours, shiftMinutes] = workingStart.split(':').map(Number);


                const actualStart = record.actualStart;
                if (!actualStart) {
                    console.log(`У записи ${record._id} нет фактического времени прихода`);
                    skippedCount++;
                    continue;
                }




                const almatyTimeStr = new Date(actualStart).toLocaleTimeString('en-GB', { timeZone: 'Asia/Almaty', hour12: false });
                const [actH, actM] = almatyTimeStr.split(':').map(Number);
                const actualMinutes = actH * 60 + actM;

                const scheduledMinutes = shiftHours * 60 + shiftMinutes;


                let lateMinutes = 0;
                if (actualMinutes > scheduledMinutes) {
                    lateMinutes = actualMinutes - scheduledMinutes;
                }


                if (record.lateMinutes !== lateMinutes) {
                    await StaffAttendanceTracking.findByIdAndUpdate(record._id, {
                        lateMinutes: lateMinutes
                    });

                    console.log(`Обновлено запись ${record._id}: опоздание ${lateMinutes} минут`);
                    updatedCount++;
                } else {
                    console.log(`Запись ${record._id}: опоздание уже равно ${lateMinutes} минут`);
                }
            } catch (error) {
                console.error(`Ошибка при обработке записи ${record._id}:`, error);
                skippedCount++;
            }
        }

        console.log(`\nИтоги:`);
        console.log(`Обновлено записей: ${updatedCount}`);
        console.log(`Пропущено записей: ${skippedCount}`);
        console.log(`Всего обработано: ${attendanceRecords.length}`);


        await dbConnection.close();
        console.log('Соединение с базой данных закрыто');

    } catch (error) {
        console.error('Ошибка при пересчете lateMinutes:', error);
        process.exit(1);
    }
};


if (require.main === module) {
    recalculateLateMinutes();
}

export { recalculateLateMinutes };