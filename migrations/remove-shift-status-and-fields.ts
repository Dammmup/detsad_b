import mongoose from 'mongoose';
import Shift from '../src/entities/staffShifts/model';
import StaffAttendanceTracking from '../src/entities/staffAttendanceTracking/model';

export async function up() {
  console.log('Начинаем миграцию по удалению поля status из коллекции staffAttendanceTracking и полей actualStart, actualEnd из коллекции shifts...');

  try {

    console.log('Удаляем поле status из коллекции staffAttendanceTracking...');
    try {

      const sampleRecord = await StaffAttendanceTracking().findOne({});
      if (sampleRecord) {

        await mongoose.connection.collection('staff_attendance_tracking').updateMany(
          { status: { $exists: true } },
          { $unset: { status: "" } }
        );
        console.log('Поле status удалено из коллекции staffAttendanceTracking');
      } else {
        console.log('Коллекция staffAttendanceTracking пуста или не существует');
      }
    } catch (error) {
      console.error('Ошибка при удалении поля status из коллекции staffAttendanceTracking:', error);
    }


    console.log('Удаляем поля actualStart и actualEnd из коллекции shifts...');
    try {

      const sampleShift = await Shift().findOne({});
      if (sampleShift) {

        await mongoose.connection.collection('shifts').updateMany(
          {
            $or: [
              { actualStart: { $exists: true } },
              { actualEnd: { $exists: true } }
            ]
          },
          {
            $unset: {
              actualStart: "",
              actualEnd: ""
            }
          }
        );
        console.log('Поля actualStart и actualEnd удалены из коллекции shifts');
      } else {
        console.log('Коллекция shifts пуста или не существует');
      }
    } catch (error) {
      console.error('Ошибка при удалении полей actualStart и actualEnd из коллекции shifts:', error);
    }

    console.log('Миграция по удалению полей завершена');
  } catch (error) {
    console.error('Ошибка при выполнении миграции по удалению полей:', error);
    throw error;
  }
}

export async function down() {
  console.log('Откат миграции не предусмотрен - поля уже удалены из базы данных');
}