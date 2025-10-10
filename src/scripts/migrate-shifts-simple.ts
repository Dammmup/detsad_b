import mongoose from 'mongoose';
import StaffShift from '../entities/staffShifts/model'; // старая модель
import SimpleShift from '../entities/staffShifts/simpleModel'; // новая модель

export const migrateShiftsToSimple = async () => {
  try {
    console.log('Начинаем миграцию смен к формату "1 смена - 1 запись"');

    // Получаем все записи смен из старой модели
    const oldShifts = await StaffShift.find({});

    console.log(`Найдено ${oldShifts.length} записей для миграции`);

    let migratedCount = 0;
    let errorCount = 0;

    for (const oldShift of oldShifts) {
      // Проходим по каждой смене в объекте shifts
      for (const [date, shiftData] of Object.entries(oldShift.shifts)) {
        try {
          // Создаем новую запись смены для каждой даты
          const newShift = new SimpleShift({
            staffId: oldShift.staffId,
            date: date,
            shiftType: shiftData.shiftType,
            startTime: shiftData.startTime,
            endTime: shiftData.endTime,
            actualStart: shiftData.actualStart,
            actualEnd: shiftData.actualEnd,
            status: shiftData.status,
            breakTime: shiftData.breakTime,
            overtimeMinutes: shiftData.overtimeMinutes,
            lateMinutes: shiftData.lateMinutes,
            earlyLeaveMinutes: shiftData.earlyLeaveMinutes,
            notes: shiftData.notes,
            createdBy: oldShift.createdBy
          });

          await newShift.save();
          migratedCount++;
        } catch (error) {
          console.error(`Ошибка при миграции смены для сотрудника ${oldShift.staffId} на дату ${date}:`, error);
          errorCount++;
        }
      }
    }

    console.log(`Миграция завершена. Мигрировано: ${migratedCount}, ошибок: ${errorCount}`);
  } catch (error) {
    console.error('Ошибка при миграции смен:', error);
    throw error;
  }
};

// Если файл запускается напрямую
if (require.main === module) {
  const runMigration = async () => {
    const dbUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/daycare';
    
    try {
      await mongoose.connect(dbUri);
      console.log('Подключено к MongoDB');

      await migrateShiftsToSimple();

      await mongoose.connection.close();
      console.log('Соединение с MongoDB закрыто');
    } catch (error) {
      console.error('Ошибка при выполнении миграции:', error);
      process.exit(1);
    }
  };

  runMigration();
}