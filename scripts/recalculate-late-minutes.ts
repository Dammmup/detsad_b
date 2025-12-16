import mongoose from 'mongoose';
import { connectDatabases, getConnection } from '../src/config/database';
import StaffAttendanceTracking from '../src/entities/staffAttendanceTracking/model';
import Shift from '../src/entities/staffShifts/model';

// Основная функция для пересчета параметра lateMinutes
const recalculateLateMinutes = async () => {
    try {
        console.log('Начинаем подключение к базе данных...');

        // Подключаемся ко всем базам данных
        await connectDatabases();

        // Получаем подключение к основной базе данных
        const dbConnection = getConnection('default');

        console.log('Подключение к базе данных установлено');

        // Создаем модели с использованием полученных подключений
        const StaffAttendanceModel = StaffAttendanceTracking();
        const ShiftModel = Shift();

        console.log('Получили модели');

        // Сначала проверим количество записей в staff_attendance_tracking
        const totalCount = await StaffAttendanceModel.countDocuments();
        console.log(`Всего записей в staff_attendance_tracking: ${totalCount}`);

        // Найдем все записи с actualStart (только те, где был приход)
        const attendanceRecords = await StaffAttendanceModel.find({
            actualStart: { $exists: true, $ne: null }
        });

        console.log(`Найдено ${attendanceRecords.length} записей с actualStart`);

        let updatedCount = 0;
        let skippedCount = 0;

        // Проходим по каждой записи и пересчитываем lateMinutes
        for (let i = 0; i < attendanceRecords.length; i++) {
            const record = attendanceRecords[i];

            try {
                // Если у записи есть shiftId, используем его для поиска смены
                let shift;
                if (record.shiftId) {
                    shift = await ShiftModel.findById(record.shiftId);
                } else {
                    // Если нет shiftId, пытаемся найти смену по дате и сотруднику
                    if (record.date && record.staffId) {
                        shift = await ShiftModel.findOne({
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

                // Получаем время начала смены из смены
                const shiftStartTime = shift.startTime;
                if (!shiftStartTime) {
                    console.log(`У смены ${shift._id} нет времени начала`);
                    skippedCount++;
                    continue;
                }

                // Преобразуем время начала смены в формат HH:MM для сравнения
                const [shiftHours, shiftMinutes] = shiftStartTime.split(':').map(Number);

                // Получаем фактическое время прихода
                const actualStart = record.actualStart;
                if (!actualStart) {
                    console.log(`У записи ${record._id} нет фактического времени прихода`);
                    skippedCount++;
                    continue;
                }

                // ИСПРАВЛЕНИЕ ЧАСОВОГО ПОЯСА:
                // actualStart хранится в UTC. Нужно конвертировать в локальное время (+05:00)
                const timezoneOffset = 5 * 60; // +05:00 в минутах

                const actualStartUTC = new Date(actualStart);
                const actualStartLocal = new Date(actualStartUTC.getTime() + timezoneOffset * 60000);

                // Создаём scheduledStart в локальном времени
                const scheduledStartLocal = new Date(actualStartLocal);
                scheduledStartLocal.setHours(shiftHours, shiftMinutes, 0, 0);

                // Сравниваем время в локальном часовом поясе
                let lateMinutes = 0;
                if (actualStartLocal > scheduledStartLocal) {
                    const timeDiffMs = actualStartLocal.getTime() - scheduledStartLocal.getTime();
                    lateMinutes = Math.floor(timeDiffMs / 60000);
                }

                // Обновляем запись только если значение изменилось
                if (record.lateMinutes !== lateMinutes) {
                    await StaffAttendanceModel.findByIdAndUpdate(record._id, {
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

        // Закрываем соединение с базой данных
        await dbConnection.close();
        console.log('Соединение с базой данных закрыто');

    } catch (error) {
        console.error('Ошибка при пересчете lateMinutes:', error);
        process.exit(1);
    }
};

// Запускаем скрипт
if (require.main === module) {
    recalculateLateMinutes();
}

export { recalculateLateMinutes };