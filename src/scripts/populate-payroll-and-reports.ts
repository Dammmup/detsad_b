import mongoose from 'mongoose';
import User from '../models/Users';
import Payroll from '../models/Payroll';
import Report from '../models/Report';
import StaffAttendance from '../models/StaffAttendance';
import Fine from '../models/Fine';
import dotenv from 'dotenv';

dotenv.config();

const populatePayrollAndReportsData = async () => {
  try {
    // Подключение к базе данных
    const mongoURI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/kindergarten';
    await mongoose.connect(mongoURI);
    console.log('✅ Подключено к базе данных');

    // Удаление существующих данных о зарплате, отчетах, штрафах и посещаемости
    await Payroll.deleteMany({});
    await Report.deleteMany({ type: 'salary' });
    await Fine.deleteMany({});
    await StaffAttendance.deleteMany({});
    console.log('🗑️ Удалены существующие данные о зарплате, зарплатных отчетах, штрафах и посещаемости');

    // Получение всех сотрудников с типом adult
    const staff = await User.find({ type: 'adult' });
    console.log(`👥 Найдено ${staff.length} сотрудников`);

    // Текущий месяц для тестовых данных
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

    // Создание записей о посещаемости и штрафов для каждого сотрудника
    for (const employee of staff) {
      // Создание записей посещаемости за текущий месяц
      const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
      const baseSalary = 150000;
      let totalPenalties = 0;

      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(new Date().getFullYear(), new Date().getMonth(), day);
        
        // Пропускаем выходные дни (суббота и воскресенье)
        if (date.getDay() === 0 || date.getDay() === 6) continue;

        // Создаем запись посещаемости
        const startTime = '09:00';
        const endTime = '18:00';
        
        // Случайное время прихода (от 08:30 до 10:00 для опозданий)
        const hour = Math.floor(Math.random() * 2) + 8; // 8 или 9
        const minute = Math.floor(Math.random() * 4) * 15; // 0, 15, 30 или 45
        const actualStart = `${hour}:${minute < 10 ? '0' + minute : minute}`;
        
        // Случайное время ухода (от 17:00 до 18:30)
        const endHour = Math.floor(Math.random() * 2) + 17; // 17 или 18
        const endMinute = Math.floor(Math.random() * 4) * 15; // 0, 15, 30 или 45
        const actualEnd = `${endHour}:${endMinute < 10 ? '0' + endMinute : endMinute}`;
        
        // Рассчитываем опоздание
        let lateMinutes = 0;
        if (actualStart > startTime) {
          const [actualHour, actualMin] = actualStart.split(':').map(Number);
          const [startHour, startMin] = startTime.split(':').map(Number);
          lateMinutes = (actualHour - startHour) * 60 + (actualMin - startMin);
        }
        
        // Рассчитываем ранний уход
        let earlyLeaveMinutes = 0;
        if (actualEnd < endTime) {
          const [actualHour, actualMin] = actualEnd.split(':').map(Number);
          const [endHour, endMin] = endTime.split(':').map(Number);
          earlyLeaveMinutes = (endHour - actualHour) * 60 + (endMin - actualMin);
        }
        
        // Определяем статус
        let status = 'completed';
        if (lateMinutes > 15) status = 'late';
        if (lateMinutes === 0 && earlyLeaveMinutes === 0) status = 'completed';
        
        const attendanceRecord = new StaffAttendance({
          staffId: employee._id,
          date,
          shiftType: 'full',
          startTime,
          endTime,
          actualStart,
          actualEnd,
          breakTime: 60, // 1 час перерыв
          status,
          lateMinutes,
          earlyLeaveMinutes,
          markedBy: employee._id
        });
        
        await attendanceRecord.save();
        
        // Начисляем штраф за опоздание (500 тенге за каждые 15 минут опоздания)
        if (lateMinutes > 0) {
          const lateFineAmount = Math.ceil(lateMinutes / 15) * 500;
          totalPenalties += lateFineAmount;
          
          const lateFine = new Fine({
            user: employee._id,
            amount: lateFineAmount,
            reason: `Опоздание на ${lateMinutes} минут`,
            type: 'late',
            date
          });
          
          await lateFine.save();
        }
      }
      
      // Создаем несколько ручных штрафов от администратора
      const manualFineCount = Math.floor(Math.random() * 3); // 0-2 ручных штрафа
      for (let i = 0; i < manualFineCount; i++) {
        const fineAmount = Math.floor(Math.random() * 10000) + 1000; // 1000-10000 тенге
        const fineReasons = [
          'Нарушение трудовой дисциплины',
          'Не выполнение обязанностей',
          'Опоздание без уважительной причины',
          'Некорректное поведение с детьми',
          'Нарушение санитарных норм'
        ];
        const randomReason = fineReasons[Math.floor(Math.random() * fineReasons.length)];
        
        const manualFine = new Fine({
          user: employee._id,
          amount: fineAmount,
          reason: randomReason,
          type: 'other',
          date: new Date()
        });
        
        await manualFine.save();
        totalPenalties += fineAmount;
      }
      
      // Создаем запись о зарплате для сотрудника
      const bonuses = Math.floor(Math.random() * 30000); // 0-300 тенге премии
      const total = baseSalary + bonuses - totalPenalties;
      
      const payrollData = new Payroll({
        staffId: employee._id,
        month: currentMonth,
        accruals: baseSalary,
        bonuses,
        penalties: totalPenalties,
        deductions: 0,
        total,
        status: ['draft', 'approved', 'paid'][Math.floor(Math.random() * 3)],
        history: [{
          date: new Date(),
          action: 'Создан расчетный лист',
          amount: total,
          comment: 'Фиксированная зарплата с бонусами и штрафами'
        }]
      });

      await payrollData.save();
      console.log(`💰 Создан расчетный лист для ${employee.fullName}`);
    }

    console.log(`✅ Созданы записи о зарплате для ${staff.length} сотрудников`);
    
    // Подсчет агрегированных данных для отчета
    let totalAccruals = 0;
    let totalBonuses = 0;
    let totalPenalties = 0;
    let totalPayout = 0;
    
    const payrolls = await Payroll.find({ month: currentMonth });
    for (const payroll of payrolls) {
      totalAccruals += payroll.accruals;
      totalBonuses += payroll.bonuses;
      totalPenalties += payroll.penalties;
      totalPayout += payroll.total;
    }
    
    const reportData = {
      title: `Отчет по зарплате за ${currentMonth}`,
      type: 'salary',
      description: `Аналитика по зарплате за ${currentMonth}`,
      dateRange: {
        startDate: new Date(`${currentMonth}-01`),
        endDate: new Date(`${currentMonth}-${new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()}`)
      },
      data: {
        totalEmployees: staff.length,
        totalAccruals,
        totalBonuses,
        totalPenalties,
        totalPayout,
        avgAccruals: staff.length ? Math.round(totalAccruals / staff.length) : 0,
        avgBonuses: staff.length ? Math.round(totalBonuses / staff.length) : 0,
        avgPenalties: staff.length ? Math.round(totalPenalties / staff.length) : 0,
        avgPayout: staff.length ? Math.round(totalPayout / staff.length) : 0
      },
      format: 'pdf',
      status: 'completed',
      createdBy: staff[0]?._id || new mongoose.Types.ObjectId()
    };
    
    const report = new Report(reportData);
    await report.save();
    console.log(`📊 Создан отчет по зарплате за ${currentMonth}`);
    
    // Закрытие соединения
    await mongoose.connection.close();
    console.log('🔒 Соединение с базой данных закрыто');
  } catch (error) {
    console.error('❌ Ошибка при заполнении данных о зарплате:', error);
    process.exit(1);
  }
};

// Запуск скрипта
populatePayrollAndReportsData();