import mongoose from 'mongoose';
import StaffShift from '../entities/staffShifts/model';
import SimpleStaffShift from '../entities/staffShifts/simpleModel';

async function migrateShifts() {
  try {
    console.log('Начинаем миграцию смен...');
    
    // Получаем все старые записи смен
    const oldShifts = await StaffShift.find({}).lean();
    console.log(`Найдено ${oldShifts.length} старых записей смен`);
    
    // Создаем новые записи для каждой смены
    let processedCount = 0;
    let errorCount = 0;
    
    for (const oldShift of oldShifts) {
      try {
        // Проходим по каждой дате в объекте shifts
        for (const [date, shiftData] of Object.entries(oldShift.shifts)) {
          // Создаем новую запись смены для каждой даты
          const newShift = new SimpleStaffShift({
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
          processedCount++;
        }
      } catch (error) {
        console.error(`Ошибка при миграции смены для сотрудника ${oldShift.staffId}:`, error);
        errorCount++;
      }
    }
    
    console.log(`Миграция завершена. Обработано: ${processedCount}, ошибок: ${errorCount}`);
  } catch (error) {
    console.error('Ошибка при миграции смен:', error);
  }
}

// Запускаем миграцию
migrateShifts();