import mongoose from 'mongoose';
import Shift from '../src/entities/staffShifts/model';

export async function up() {
  console.log('Начинаем миграцию статусов смен...');
  
  try {
    // Обновляем статусы в коллекции смен (shifts)
    console.log('Обновляем статусы в коллекции смен...');
    
    // Обновляем 'checked_in' на 'in_progress'
    const checkedInResult = await Shift().updateMany(
      { status: 'checked_in' },
      { $set: { status: 'in_progress' } }
    );
    console.log(`Обновлено ${checkedInResult.modifiedCount} смен со статусом 'checked_in' на 'in_progress'`);
    
    // Обновляем 'checked_out' на 'completed'
    const checkedOutResult = await Shift().updateMany(
      { status: 'checked_out' },
      { $set: { status: 'completed' } }
    );
    console.log(`Обновлено ${checkedOutResult.modifiedCount} смен со статусом 'checked_out' на 'completed'`);
    
    // Также обновляем возможные статусы 'absent_shift' на 'absent'
    const absentResult = await Shift().updateMany(
      { status: 'absent_shift' },
      { $set: { status: 'absent' } }
    );
    console.log(`Обновлено ${absentResult.modifiedCount} смен со статусом 'absent_shift' на 'absent'`);
    
    // Обновляем возможные статусы 'on_break_shift' на 'on_break'
    const onBreakResult = await Shift().updateMany(
      { status: 'on_break_shift' },
      { $set: { status: 'on_break' } }
    );
    console.log(`Обновлено ${onBreakResult.modifiedCount} смен со статусом 'on_break_shift' на 'on_break'`);
    
    // Обновляем возможные статусы 'overtime_shift' на 'overtime'
    const overtimeResult = await Shift().updateMany(
      { status: 'overtime_shift' },
      { $set: { status: 'overtime' } }
    );
    console.log(`Обновлено ${overtimeResult.modifiedCount} смен со статусом 'overtime_shift' на 'overtime'`);
    
    // Обновляем возможные статусы 'early_departure' на 'early_leave'
    const earlyDepartureResult = await Shift().updateMany(
      { status: 'early_departure' },
      { $set: { status: 'early_leave' } }
    );
    console.log(`Обновлено ${earlyDepartureResult.modifiedCount} смен со статусом 'early_departure' на 'early_leave'`);
    
    console.log('Миграция статусов смен завершена');
  } catch (error) {
    console.error('Ошибка при выполнении миграции статусов смен:', error);
    throw error;
  }
}

export async function down() {
  console.log('Начинаем откат миграции статусов смен...');
  
  try {
    // Возвращаем 'in_progress' обратно в 'checked_in'
    const inProgressResult = await Shift().updateMany(
      { status: 'in_progress' },
      { $set: { status: 'checked_in' } }
    );
    console.log(`Обновлено ${inProgressResult.modifiedCount} смен со статусом 'in_progress' на 'checked_in'`);
    
    // Возвращаем 'completed' обратно в 'checked_out'
    const completedResult = await Shift().updateMany(
      { status: 'completed' },
      { $set: { status: 'checked_out' } }
    );
    console.log(`Обновлено ${completedResult.modifiedCount} смен со статусом 'completed' на 'checked_out'`);
    
    // Возвращаем 'absent' обратно в 'absent_shift'
    const absentResult = await Shift().updateMany(
      { status: 'absent' },
      { $set: { status: 'absent_shift' } }
    );
    console.log(`Обновлено ${absentResult.modifiedCount} смен со статусом 'absent' на 'absent_shift'`);
    
    // Возвращаем 'on_break' обратно в 'on_break_shift'
    const onBreakResult = await Shift().updateMany(
      { status: 'on_break' },
      { $set: { status: 'on_break_shift' } }
    );
    console.log(`Обновлено ${onBreakResult.modifiedCount} смен со статусом 'on_break' на 'on_break_shift'`);
    
    // Возвращаем 'overtime' обратно в 'overtime_shift'
    const overtimeResult = await Shift().updateMany(
      { status: 'overtime' },
      { $set: { status: 'overtime_shift' } }
    );
    console.log(`Обновлено ${overtimeResult.modifiedCount} смен со статусом 'overtime' на 'overtime_shift'`);
    
    // Возвращаем 'early_leave' обратно в 'early_departure'
    const earlyDepartureResult = await Shift().updateMany(
      { status: 'early_leave' },
      { $set: { status: 'early_departure' } }
    );
    console.log(`Обновлено ${earlyDepartureResult.modifiedCount} смен со статусом 'early_leave' на 'early_departure'`);
    
    console.log('Откат миграции статусов смен завершен');
  } catch (error) {
    console.error('Ошибка при выполнении отката миграции статусов смен:', error);
    throw error;
  }
}