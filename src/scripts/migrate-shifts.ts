import mongoose from 'mongoose';
import StaffShift from '../entities/staffShifts/model';
import NewStaffShift from '../entities/staffShifts/newModel';

async function migrateShifts() {
 try {
    console.log('Начинаем миграцию смен...');
    
    // Получаем все старые записи смен
    const oldShifts = await StaffShift.find({}).lean();
    console.log(`Найдено ${oldShifts.length} старых записей смен`);
    
    // Группируем старые смены по staffId
    const shiftsByStaff: { [staffId: string]: any[] } = {};
    oldShifts.forEach(shift => {
      const staffId = shift.staffId.toString();
      if (!shiftsByStaff[staffId]) {
        shiftsByStaff[staffId] = [];
      }
      shiftsByStaff[staffId].push(shift);
    });
    
    console.log(`Будет обработано ${Object.keys(shiftsByStaff).length} сотрудников`);
    
    let processedCount = 0;
    for (const [staffId, staffShifts] of Object.entries(shiftsByStaff)) {
      // Проверяем, существует ли уже новая запись для этого сотрудника
      let newShiftRecord = await NewStaffShift.findOne({ staffId });
      
      if (newShiftRecord) {
        // Обновляем существующую запись
        for (const shift of staffShifts) {
          const dateStr = new Date(shift.date).toISOString().split('T')[0];
          newShiftRecord.shifts[dateStr] = {
            date: new Date(shift.date).toISOString().split('T')[0],
            shiftType: shift.shiftType,
            startTime: shift.startTime,
            endTime: shift.endTime,
            actualStart: shift.actualStart,
            actualEnd: shift.actualEnd,
            status: shift.status,
            breakTime: shift.breakTime,
            overtimeMinutes: shift.overtimeMinutes,
            lateMinutes: shift.lateMinutes,
            earlyLeaveMinutes: shift.earlyLeaveMinutes,
            notes: shift.notes
          };
        }
        await newShiftRecord.save();
      } else {
        // Создаем новую запись
        const shiftsData: { [date: string]: any } = {};
        for (const shift of staffShifts) {
          const dateStr = new Date(shift.date).toISOString().split('T')[0];
          shiftsData[dateStr] = {
            date: new Date(shift.date),
            shiftType: shift.shiftType,
            startTime: shift.startTime,
            endTime: shift.endTime,
            actualStart: shift.actualStart,
            actualEnd: shift.actualEnd,
            status: shift.status,
            breakTime: shift.breakTime,
            overtimeMinutes: shift.overtimeMinutes,
            lateMinutes: shift.lateMinutes,
            earlyLeaveMinutes: shift.earlyLeaveMinutes,
            notes: shift.notes
          };
        }
        
        newShiftRecord = new NewStaffShift({
          staffId: staffShifts[0].staffId,
          shifts: shiftsData,
          createdBy: staffShifts[0].createdBy
        });
        await newShiftRecord.save();
      }
      
      processedCount++;
      if (processedCount % 100 === 0) {
        console.log(`Обработано ${processedCount}/${Object.keys(shiftsByStaff).length} сотрудников`);
      }
    }
    
    console.log('Миграция смен завершена успешно!');
  } catch (error) {
    console.error('Ошибка при миграции смен:', error);
  }
}

// Запускаем миграцию
migrateShifts();