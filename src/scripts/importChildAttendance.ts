/**
 * Скрипт миграции посещаемости детей из Excel
 * УЛУЧШЕННАЯ ВЕРСИЯ: поиск по частичному совпадению имени+фамилии
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

const CHILD_GROUPS = ['БУКВАРИКИ', 'ПОЧЕМУЧКИ', 'ЛУЧИКИ', 'ЗВЕЗДОЧКИ'];

interface DateInfo {
    date: Date;
    columnIndex: number;
}

// Улучшенный поиск: ищет по имени и фамилии (имя в начале)
function findByNameParts(dbRecords: Map<string, any>, firstName: string, lastName: string): any | null {
    const searchFirst = firstName.toLowerCase().trim();
    const searchLast = lastName.toLowerCase().trim();

    // 1. Точное совпадение "Имя Фамилия"
    const exactKey = `${searchFirst} ${searchLast}`;
    if (dbRecords.has(exactKey)) {
        return dbRecords.get(exactKey);
    }

    // 2. Поиск по началу строки (Имя Фамилия + отчество)
    for (const [fullName, child] of dbRecords) {
        // fullName в БД: "Имя Фамилия Отчество" или "Имя Фамилия"
        if (fullName.startsWith(`${searchFirst} ${searchLast}`)) {
            return child;
        }
    }

    // 3. Поиск по содержанию имени И фамилии
    for (const [fullName, child] of dbRecords) {
        if (fullName.includes(searchFirst) && fullName.includes(searchLast)) {
            return child;
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

async function importChildAttendance() {
    console.log('🚀 Начинаем импорт посещаемости детей (улучшенный поиск)...');

    try {
        console.log('📡 Подключение к MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('✅ Подключено к MongoDB');

        const db = mongoose.connection.db;
        if (!db) throw new Error('База данных не доступна');

        const childrenCollection = db.collection('children');
        const groupsCollection = db.collection('groups');
        const childAttendanceCollection = db.collection('childattendances');
        const usersCollection = db.collection('users');

        console.log('📚 Загружаем данные...');

        const children = await childrenCollection.find({}).toArray();
        const childrenMap = new Map<string, any>();
        for (const child of children) {
            const key = child.fullName.toLowerCase().trim();
            childrenMap.set(key, child);
        }

        const groups = await groupsCollection.find({}).toArray();
        const groupMap = new Map<string, string>();
        for (const group of groups) {
            groupMap.set(group.name.toUpperCase(), group._id.toString());
        }

        const adminUser = await usersCollection.findOne({ role: 'admin' });
        const adminId = adminUser?._id || new mongoose.Types.ObjectId();

        console.log(`✅ Загружено: ${children.length} детей, ${groups.length} групп`);

        const excelPath = path.join(__dirname, '../../docs/Посещаемость детей.xlsx');
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

        let created = 0;
        let updated = 0;
        let skipped = 0;
        let notFound = 0;
        const notFoundList: string[] = [];

        for (let i = 5; i < rows.length; i++) {
            const row = rows[i];

            const surname = (row[0] || '').toString().trim();
            const firstName = (row[1] || '').toString().trim();
            const department = (row[2] || '').toString().trim().toUpperCase();

            if (!surname && !firstName) continue;

            if (!CHILD_GROUPS.includes(department)) {
                skipped++;
                continue;
            }

            // Используем улучшенный поиск
            const child = findByNameParts(childrenMap, firstName, surname);

            if (!child) {
                notFound++;
                const fullName = `${firstName} ${surname}`;
                if (!notFoundList.includes(fullName)) {
                    notFoundList.push(fullName);
                }
                continue;
            }

            const gId = groupMap.get(department);
            const groupId = gId ? new mongoose.Types.ObjectId(gId) : child.groupId;

            for (const dateInfo of dates) {
                const cellValue = (row[dateInfo.columnIndex] || '').toString().trim();
                const { start, end, isWeekend } = parseTimeCell(cellValue);

                if (isWeekend) continue;

                let status: string;
                if (start) {
                    status = 'present';
                } else {
                    status = 'absent';
                }

                const attendanceRecord: any = {
                    childId: child._id,
                    groupId: groupId,
                    date: dateInfo.date,
                    status: status,
                    markedBy: adminId,
                    updatedAt: new Date(),
                };

                if (start) {
                    attendanceRecord.actualStart = createDateTime(dateInfo.date, start);
                }
                if (end) {
                    attendanceRecord.actualEnd = createDateTime(dateInfo.date, end);
                }

                const result = await childAttendanceCollection.updateOne(
                    { childId: child._id, date: dateInfo.date },
                    {
                        $set: attendanceRecord,
                        $setOnInsert: { createdAt: new Date() }
                    },
                    { upsert: true }
                );

                if (result.upsertedCount > 0) {
                    created++;
                } else if (result.modifiedCount > 0) {
                    updated++;
                }
            }
        }

        console.log('\n📊 === ИТОГИ ===');
        console.log(`Создано записей: ${created}`);
        console.log(`Обновлено записей: ${updated}`);
        console.log(`Пропущено (сотрудники): ${skipped}`);
        console.log(`Не найдено в БД: ${notFound}`);

        if (notFoundList.length > 0) {
            console.log('\n⚠️ Не найденные дети:');
            notFoundList.forEach(name => console.log(`   - ${name}`));
        }

    } catch (error) {
        console.error('❌ Ошибка:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 Отключено от MongoDB');
    }
}

importChildAttendance();
