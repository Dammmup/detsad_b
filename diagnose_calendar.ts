import { getWorkingDaysInMonth } from './src/services/payrollAutomationService';
import { isNonWorkingDay } from './src/utils/productionCalendar';
import { connectDB } from './src/config/database';
import mongoose from 'mongoose';

async function diagnose() {
    const period = '2026-02';
    const startDate = new Date(`${period}-01T00:00:00+05:00`);

    console.log(`startDate: ${startDate.toISOString()} (Local: ${startDate.toString()})`);

    const year = startDate.getFullYear();
    const month = startDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    console.log(`\nПроверка по дням для ${period}:`);
    let count = 0;
    for (let d = 1; d <= daysInMonth; d++) {
        const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const checkDate = new Date(dateString);
        const isNW = isNonWorkingDay(checkDate);
        if (!isNW) count++;
        console.log(`${dateString} (UTC): ${isNW ? 'BЫХОДНОЙ' : 'РАБОЧИЙ'} | getDay: ${checkDate.getDay()} | toISO: ${checkDate.toISOString()}`);
    }

    console.log(`\nИтог count: ${count}`);
    const serviceResult = await getWorkingDaysInMonth(startDate);
    console.log(`Результат getWorkingDaysInMonth: ${serviceResult}`);
}

diagnose();
