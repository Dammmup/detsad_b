import ExcelJS from 'exceljs';
import path from 'path';
import mongoose from 'mongoose';
import { connectDatabases } from '../src/config/database';
import createUserModel from '../src/entities/users/model';
import createChildModel from '../src/entities/children/model';
import createStaffShiftModel from '../src/entities/staffShifts/model';
import createStaffAttendanceTrackingModel from '../src/entities/staffAttendanceTracking/model';
import createChildAttendanceModel from '../src/entities/childAttendance/model';

// --- Helpers ---
const getStatus = (value: string | null) => {
  if (!value) return 'absent';
  const val = value.toString().trim();
  if (val === 'В') return 'weekend';
  if (val === 'ОТ') return 'vacation';
  if (val === 'Б') return 'sick_leave';
  if (val === 'Д') return 'maternity_leave';
  if (val === 'ОЖ') return 'child_care_leave';
  if (val.includes('ч')) return 'completed'; // Если указаны часы, считаем смену завершенной
  return 'absent';
};

const runMigration = async () => {
  console.log('Начало миграции посещаемости из Excel...');

  try {
    await connectDatabases();
    console.log('Успешное подключение к базе данных.');

    // --- Модели ---
    const User = createUserModel();
    const Child = createChildModel();
    const StaffShift = createStaffShiftModel();
    const StaffAttendanceTracking = createStaffAttendanceTrackingModel();
    const ChildAttendance = createChildAttendanceModel();

    const filePath = path.join(__dirname, 'Отчет № 949939.xlsx');
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    const worksheet = workbook.worksheets[0];
    console.log('Файл Excel успешно прочитан.');

    // --- Парсинг дат из заголовка (строка 5) ---
    const dateMap = new Map<number, Date>();
    const dateRow = worksheet.getRow(5);
    const year = 2025; // Год из имени файла "сен 2025 г."

    for (let i = 5; i <= 34; i++) { // Даты с 1 по 30 сентября
      const cellValue = dateRow.getCell(i).value as string;
      if (cellValue) {
        const day = parseInt(cellValue.split(' ')[0], 10);
        const month = 8; // Сентябрь (0-indexed)
        dateMap.set(i, new Date(Date.UTC(year, month, day)));
      }
    }
    console.log(`Карта дат успешно создана. ${dateMap.size} дат найдено.`);

    // --- Обработка строк с данными ---
    for (let rowNumber = 6; rowNumber <= worksheet.rowCount; rowNumber++) {
      const row = worksheet.getRow(rowNumber);
      // Меняем местами firstNameRaw и lastName
      const firstNameRaw = (row.getCell(2).value as string || '').trim();
      const lastName = (row.getCell(3).value as string || '').trim();
      const role = (row.getCell(4).value as string || '').trim();

      if (!firstNameRaw || !lastName) {
        console.log(`Пропуск строки ${rowNumber}: неполные данные (имя или фамилия).`);
        continue;
      }
      
      const firstName = role === 'Ребенок' ? firstNameRaw.replace(/Ребенок\s*/i, '').trim() : firstNameRaw;
      const fullNameForSearch = `${firstName} ${lastName}`;
      const fullNameFromSheet = `${lastName} ${firstNameRaw}`;

      try {
        let child, user;
        
        if (role === 'Ребенок') {
          // Поиск ребенка по fullName
          child = await Child.findOne({ fullName: { $regex: fullNameForSearch, $options: 'i' } }).lean();
          if (!child) {
            console.warn(`ПРЕДУПРЕЖДЕНИЕ: Ребенок "${fullNameForSearch}" не найден в базе данных. Пропускаем.`);
            continue;
          }

          for (const [colIndex, date] of dateMap.entries()) {
            const attendanceValue = row.getCell(colIndex).value as string | null;
            const status = getStatus(attendanceValue);
            
            await ChildAttendance.updateOne(
              { childId: child._id, date: date },
              { $set: { status: status === 'completed' ? 'present' : status, childId: child._id, date: date, markedBy: child._id } },
              { upsert: true }
            );
          }
          console.log(`Обработана посещаемость для ребенка: ${fullNameFromSheet}`);
        } else {
          // Поиск сотрудника по fullName
          user = await User.findOne({ fullName: { $regex: fullNameForSearch, $options: 'i' } }).lean();
          if (!user) {
            console.warn(`ПРЕДУПРЕЖДЕНИЕ: Сотрудник "${fullNameForSearch}" (${role}) не найден в базе данных. Пропускаем.`);
            continue;
          }

          for (const [colIndex, date] of dateMap.entries()) {
            const attendanceValue = row.getCell(colIndex).value as string | null;
            const status = getStatus(attendanceValue);
            
            // Миграция в обе коллекции: StaffShift и StaffAttendanceTracking
            // Обновляем StaffShift
            await StaffShift.updateOne(
              { staffId: user._id, date: date.toString().split('T')[0] }, // date в StaffShift хранится в формате строки
              {
                $set: {
                  status: status,
                  staffId: user._id,
                  date: date.toString().split('T')[0],
                  startTime: '09:00', // Время по умолчанию, можно улучшить позже
                  endTime: '18:00', // Время по умолчанию, можно улучшить позже
                  createdBy: user._id
                }
              },
              { upsert: true }
            );
            
            // Обновляем StaffAttendanceTracking
            await StaffAttendanceTracking.updateOne(
              { staffId: user._id, date: date },
              {
                $set: {
                  staffId: user._id,
                  date: date,
                  status: status,
                  totalHours: status === 'completed' ? 8 : 0, // Примерное количество часов
                  regularHours: status === 'completed' ? 8 : 0,
                  overtimeHours: 0,
                  isManualEntry: true
                }
              },
              { upsert: true }
            );
          }
          console.log(`Обработаны смены для сотрудника: ${fullNameFromSheet}`);
        }
      } catch (dbError) {
        console.error(`Ошибка при обработке записи для "${fullNameFromSheet}":`, dbError);
      }
    }

  } catch (error) {
    console.error('Критическая ошибка во время миграции:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Отключились от базы данных. Миграция завершена.');
  }
};

runMigration();