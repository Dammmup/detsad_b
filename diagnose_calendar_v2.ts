
import { getProductionWorkingDays, isNonWorkingDay } from './src/utils/productionCalendar';

const year = 2026;
const month = 1; // February

console.log(`Checking Feb ${year}...`);
const daysInMonth = new Date(year, month + 1, 0).getDate();
let count = 0;
for (let d = 1; d <= daysInMonth; d++) {
    const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const date = new Date(dateString);
    const nonWorking = isNonWorkingDay(date);
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
    console.log(`${dateString} (${dayName}): ${nonWorking ? 'NON-WORKING' : 'WORKING'}`);
    if (!nonWorking) count++;
}
console.log(`Total working days: ${count}`);
console.log(`getProductionWorkingDays returned: ${getProductionWorkingDays(year, month)}`);
