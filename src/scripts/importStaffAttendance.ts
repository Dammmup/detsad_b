/**
 * Скрипт миграции посещаемости сотрудников из Excel
 * УЛУЧШЕННАЯ ВЕРСИЯ: поиск по частичному совпадению
 */

import * as xlsx from 'xlsx';
import * as path from 'path';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/detsad';

const YEAR = 2025;
const MONTH_MAP: { [key: string]: number } = {
    'янв': 0, 'фев': 1, 'мар': 2, 'апр': 3, 'май': 4, 'июн': 5,
    'июл': 6, 'авг': 7, 'сен': 8, 'окт': 9, 'ноя': 10, 'дек': 11
};

interface DateInfo {
    date: Date;
    columnIndex: number;
}

// Улучшенный поиск
function findByNameParts(dbRecords: Map<string, any>, firstName: string, lastName: string): any | null {
    const searchFirst = firstName.toLowerCase().trim();
    const searchLast = lastName.toLowerCase().trim();

    const exactKey = `${searchFirst} ${searchLast}`;
    if (dbRecords.has(exactKey)) {
        return dbRecords.get(exactKey);
    }

    for (const [fullName, user] of dbRecords) {
        if (fullName.startsWith(`${searchFirst} ${searchLast}`)) {
            return user;
        }
    }

    for (const [fullName, user] of dbRecords) {
        if (fullName.includes(searchFirst) && fullName.includes(searchLast)) {
            return user;
        }
    }

    return null;
}

function parseDateHeader(header: string): Date | null {
    if (!header || typeof header !== 'string') return null;
    const match = header.match(/(\d{1,2})\s+([а-яА-Яa-zA-Z]+),/);
    if (!match) return null;

    const day = parseInt(match[1]);
    const monthStr = match[2].toLowerCase().substring(0, 3);
    const month = MONTH_MAP[monthStr];

    if (month === undefined) return null;
    return new Date(YEAR, month, day);
}

function parseTimeCell(cell: string): { start: string | null; end: string | null; isWeekend: boolean } {
    if (!cell || cell === 'В') {
        return { start: null, end: null, isWeekend: cell === 'В' };
    }
    if (cell === '__ - __') {
        return { start: null, end: null, isWeekend: false };
    }

    const parts = cell.split(' - ');
    const start = parts[0] !== '__' ? parts[0] : null;
    const end = parts[1] !== '__' ? parts[1] : null;

    return { start, end, isWeekend: false };
}

function createDateTime(date: Date, time: string): Date {
    const [hours, minutes] = time.split(':').map(Number);
    const result = new Date(date);
    result.setHours(hours, minutes, 0, 0);
    return result;
}

function calculateWorkHours(startTime: string, endTime: string): number {
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);

    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    return Math.max(0, (endMinutes - startMinutes) / 60);
}

async function importStaffAttendance() {
    console.log('🚀 Начинаем импорт посещаемости сотрудников (улучшенный поиск)...');

    try {
        console.log('📡 Подключение к MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('✅ Подключено к MongoDB');

        const db = mongoose.connection.db;
        if (!db) throw new Error('База данных не доступна');

        const usersCollection = db.collection('users');
        const shiftsCollection = db.collection('shifts');
        const staffAttendanceCollection = db.collection('staff_attendance_tracking');

        console.log('📚 Загружаем данные...');

        const users = await usersCollection.find({}).toArray();
        const usersMap = new Map<string, any>();
        for (const user of users) {
            const key = user.fullName.toLowerCase().trim();
            usersMap.set(key, user);
        }

        const adminUser = await usersCollection.findOne({ role: 'admin' });
        const adminId = adminUser?._id || new mongoose.Types.ObjectId();

        console.log(`✅ Загружено: ${users.length} пользователей`);

        const excelPath = path.join(__dirname, '../../docs/Посещаемость сотрудников.xlsx');
        console.log(`📖 Читаем Excel файл: ${excelPath}`);

        const workbook = xlsx.readFile(excelPath);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows: any[][] = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: '' });

        const dateRow = rows[4];
        const dates: DateInfo[] = [];

        for (let col = 3; col < dateRow.length; col++) {
            const date = parseDateHeader(dateRow[col]);
            if (date) {
                dates.push({ date, columnIndex: col });
            }
        }
        console.log(`📅 Найдено ${dates.length} дат`);

        let shiftsCreated = 0;
        let shiftsUpdated = 0;
        let attendanceCreated = 0;
        let attendanceUpdated = 0;
        let notFound = 0;
        const notFoundList: string[] = [];

        for (let i = 5; i < rows.length; i++) {
            const row = rows[i];

            const surname = (row[0] || '').toString().trim();
            const firstName = (row[1] || '').toString().trim();
            const department = (row[2] || '').toString().trim();

            if (!surname && !firstName) continue;
            if (surname === 'Всего') continue;
            if (department !== 'Штат') continue;

            const user = findByNameParts(usersMap, firstName, surname);

            if (!user) {
                notFound++;
                const fullName = `${firstName} ${surname}`;
                if (!notFoundList.includes(fullName)) {
                    notFoundList.push(fullName);
                }
                continue;
            }

            for (const dateInfo of dates) {
                const cellValue = (row[dateInfo.columnIndex] || '').toString().trim();
                const { start, end, isWeekend } = parseTimeCell(cellValue);

                if (isWeekend || !start) continue;

                const dateStr = dateInfo.date.toISOString().split('T')[0];

                const shiftRecord: any = {
                    staffId: user._id,
                    date: dateStr,
                    startTime: start,
                    endTime: end || '18:00',
                    status: 'completed',
                    createdBy: adminId,
                    updatedAt: new Date(),
                };

                const shiftResult = await shiftsCollection.updateOne(
                    { staffId: user._id, date: dateStr },
                    {
                        $set: shiftRecord,
                        $setOnInsert: { createdAt: new Date() }
                    },
                    { upsert: true }
                );

                if (shiftResult.upsertedCount > 0) {
                    shiftsCreated++;
                } else if (shiftResult.modifiedCount > 0) {
                    shiftsUpdated++;
                }

                const totalHours = end ? calculateWorkHours(start, end) : 8;

                const attendanceRecord: any = {
                    staffId: user._id,
                    date: dateInfo.date,
                    actualStart: createDateTime(dateInfo.date, start),
                    actualEnd: end ? createDateTime(dateInfo.date, end) : undefined,
                    isManualEntry: true,
                    totalHours: totalHours,
                    regularHours: Math.min(totalHours, 8),
                    overtimeHours: Math.max(0, totalHours - 8),
                    updatedAt: new Date(),
                };

                const attendanceResult = await staffAttendanceCollection.updateOne(
                    { staffId: user._id, date: dateInfo.date },
                    {
                        $set: attendanceRecord,
                        $setOnInsert: { createdAt: new Date() }
                    },
                    { upsert: true }
                );

                if (attendanceResult.upsertedCount > 0) {
                    attendanceCreated++;
                } else if (attendanceResult.modifiedCount > 0) {
                    attendanceUpdated++;
                }
            }
        }

        console.log('\n📊 === ИТОГИ ===');
        console.log(`Смены создано: ${shiftsCreated}`);
        console.log(`Смены обновлено: ${shiftsUpdated}`);
        console.log(`Посещаемость создано: ${attendanceCreated}`);
        console.log(`Посещаемость обновлено: ${attendanceUpdated}`);
        console.log(`Не найдено в БД: ${notFound}`);

        if (notFoundList.length > 0) {
            console.log('\n⚠️ Не найденные сотрудники:');
            notFoundList.forEach(name => console.log(`   - ${name}`));
        }

    } catch (error) {
        console.error('❌ Ошибка:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 Отключено от MongoDB');
    }
}

importStaffAttendance();
