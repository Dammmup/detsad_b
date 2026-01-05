/**
 * API контроллер для импорта данных из Excel
 * Обёртка над скриптами миграции для вызова через HTTP
 */

import { Request, Response } from 'express';
import * as xlsx from 'xlsx';
import * as path from 'path';
import mongoose from 'mongoose';

// Коллекции
const getDb = () => mongoose.connection.db;

// Улучшенный поиск по имени
function findByFullName(dbRecords: Map<string, any>, excelFullName: string): any | null {
    const searchName = excelFullName.toLowerCase().trim();

    if (dbRecords.has(searchName)) {
        return dbRecords.get(searchName);
    }

    for (const [fullName, record] of dbRecords) {
        if (fullName.startsWith(searchName)) {
            return record;
        }
    }

    const searchWords = searchName.split(' ').filter(w => w.length > 1);
    for (const [fullName, record] of dbRecords) {
        let allMatch = true;
        for (const word of searchWords) {
            if (!fullName.includes(word)) {
                allMatch = false;
                break;
            }
        }
        if (allMatch && searchWords.length > 0) {
            return record;
        }
    }

    return null;
}

function findByNameParts(dbRecords: Map<string, any>, firstName: string, lastName: string): any | null {
    const searchFirst = firstName.toLowerCase().trim();
    const searchLast = lastName.toLowerCase().trim();

    const exactKey = `${searchFirst} ${searchLast}`;
    if (dbRecords.has(exactKey)) {
        return dbRecords.get(exactKey);
    }

    for (const [fullName, record] of dbRecords) {
        if (fullName.startsWith(`${searchFirst} ${searchLast}`)) {
            return record;
        }
    }

    for (const [fullName, record] of dbRecords) {
        if (fullName.includes(searchFirst) && fullName.includes(searchLast)) {
            return record;
        }
    }

    return null;
}

// Парсинг дат
const MONTH_MAP: { [key: string]: number } = {
    'янв': 0, 'фев': 1, 'мар': 2, 'апр': 3, 'май': 4, 'июн': 5,
    'июл': 6, 'авг': 7, 'сен': 8, 'окт': 9, 'ноя': 10, 'дек': 11
};

function parseDateHeader(header: string, year: number): Date | null {
    if (!header || typeof header !== 'string') return null;
    const match = header.match(/(\d{1,2})\s+([а-яА-Яa-zA-Z]+),/);
    if (!match) return null;
    const day = parseInt(match[1]);
    const monthStr = match[2].toLowerCase().substring(0, 3);
    const month = MONTH_MAP[monthStr];
    if (month === undefined) return null;
    return new Date(year, month, day);
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

// ==================== КОНТРОЛЛЕРЫ ====================

/**
 * Импорт посещаемости детей
 */
export const importChildAttendance = async (req: Request, res: Response) => {
    try {
        const year = req.body.year || new Date().getFullYear();
        const CHILD_GROUPS = ['БУКВАРИКИ', 'ПОЧЕМУЧКИ', 'ЛУЧИКИ', 'ЗВЕЗДОЧКИ'];

        const db = getDb();
        if (!db) throw new Error('База данных не доступна');

        const childrenCollection = db.collection('children');
        const groupsCollection = db.collection('groups');
        const childAttendanceCollection = db.collection('childattendances');
        const usersCollection = db.collection('users');

        const children = await childrenCollection.find({}).toArray();
        const childrenMap = new Map<string, any>();
        for (const child of children) {
            childrenMap.set(child.fullName.toLowerCase().trim(), child);
        }

        const groups = await groupsCollection.find({}).toArray();
        const groupMap = new Map<string, string>();
        for (const group of groups) {
            groupMap.set(group.name.toUpperCase(), group._id.toString());
        }

        const adminUser = await usersCollection.findOne({ role: 'admin' });
        const adminId = adminUser?._id || new mongoose.Types.ObjectId();

        const excelPath = path.join(__dirname, '../../docs/Посещаемость детей.xlsx');
        const workbook = xlsx.readFile(excelPath);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows: any[][] = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: '' });

        const dateRow = rows[4];
        const dates: { date: Date; columnIndex: number }[] = [];
        for (let col = 3; col < dateRow.length; col++) {
            const date = parseDateHeader(dateRow[col], year);
            if (date) dates.push({ date, columnIndex: col });
        }

        let created = 0, updated = 0, skipped = 0, notFound = 0;
        const notFoundList: string[] = [];

        for (let i = 5; i < rows.length; i++) {
            const row = rows[i];
            const surname = (row[0] || '').toString().trim();
            const firstName = (row[1] || '').toString().trim();
            const department = (row[2] || '').toString().trim().toUpperCase();

            if (!surname && !firstName) continue;
            if (!CHILD_GROUPS.includes(department)) { skipped++; continue; }

            const child = findByNameParts(childrenMap, firstName, surname);
            if (!child) {
                notFound++;
                const fullName = `${firstName} ${surname}`;
                if (!notFoundList.includes(fullName)) notFoundList.push(fullName);
                continue;
            }

            const gId = groupMap.get(department);
            const groupId = gId ? new mongoose.Types.ObjectId(gId) : child.groupId;

            for (const dateInfo of dates) {
                const cellValue = (row[dateInfo.columnIndex] || '').toString().trim();
                const { start, end, isWeekend } = parseTimeCell(cellValue);
                if (isWeekend) continue;

                const dateStr = dateInfo.date.toISOString().split('T')[0];
                const attendanceDetail: any = {
                    groupId: groupId,
                    status: start ? 'present' : 'absent',
                    markedBy: adminId,
                    updatedAt: new Date(),
                    createdAt: new Date()
                };

                if (start) attendanceDetail.actualStart = createDateTime(dateInfo.date, start);
                if (end) attendanceDetail.actualEnd = createDateTime(dateInfo.date, end);

                const result = await childAttendanceCollection.updateOne(
                    { childId: child._id },
                    {
                        $set: {
                            [`attendance.${dateStr}`]: attendanceDetail,
                            updatedAt: new Date()
                        },
                        $setOnInsert: { createdAt: new Date() }
                    },
                    { upsert: true }
                );

                if (result.upsertedCount > 0) created++;
                else if (result.modifiedCount > 0) updated++;
            }
        }

        res.json({
            success: true,
            message: 'Импорт посещаемости детей завершён',
            stats: { created, updated, skipped, notFound, notFoundList }
        });
    } catch (error: any) {
        console.error('Ошибка импорта посещаемости детей:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Импорт посещаемости сотрудников
 */
export const importStaffAttendance = async (req: Request, res: Response) => {
    try {
        const year = req.body.year || new Date().getFullYear();

        const db = getDb();
        if (!db) throw new Error('База данных не доступна');

        const usersCollection = db.collection('users');
        const shiftsCollection = db.collection('staff_shifts');
        const staffAttendanceCollection = db.collection('staff_attendance_tracking');

        const users = await usersCollection.find({}).toArray();
        const usersMap = new Map<string, any>();
        for (const user of users) {
            usersMap.set(user.fullName.toLowerCase().trim(), user);
        }

        const adminUser = await usersCollection.findOne({ role: 'admin' });
        const adminId = adminUser?._id || new mongoose.Types.ObjectId();

        const excelPath = path.join(__dirname, '../../docs/Посещаемость сотрудников.xlsx');
        const workbook = xlsx.readFile(excelPath);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows: any[][] = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: '' });

        const dateRow = rows[4];
        const dates: { date: Date; columnIndex: number }[] = [];
        for (let col = 3; col < dateRow.length; col++) {
            const date = parseDateHeader(dateRow[col], year);
            if (date) dates.push({ date, columnIndex: col });
        }

        let shiftsCreated = 0, shiftsUpdated = 0, attendanceCreated = 0, attendanceUpdated = 0, notFound = 0;
        const notFoundList: string[] = [];

        for (let i = 5; i < rows.length; i++) {
            const row = rows[i];
            const surname = (row[0] || '').toString().trim();
            const firstName = (row[1] || '').toString().trim();
            const department = (row[2] || '').toString().trim();

            if (!surname && !firstName) continue;
            if (surname === 'Всего' || department !== 'Штат') continue;

            const user = findByNameParts(usersMap, firstName, surname);
            if (!user) {
                notFound++;
                const fullName = `${firstName} ${surname}`;
                if (!notFoundList.includes(fullName)) notFoundList.push(fullName);
                continue;
            }

            for (const dateInfo of dates) {
                const cellValue = (row[dateInfo.columnIndex] || '').toString().trim();
                const { start, end, isWeekend } = parseTimeCell(cellValue);
                if (isWeekend || !start) continue;

                const dateStr = dateInfo.date.toISOString().split('T')[0];

                // Shift
                const shiftDetail: any = {
                    status: 'completed',
                    createdBy: adminId,
                    updatedAt: new Date(),
                    createdAt: new Date()
                };

                const shiftResult = await shiftsCollection.updateOne(
                    { staffId: user._id },
                    {
                        $set: {
                            [`shifts.${dateStr}`]: shiftDetail,
                            updatedAt: new Date()
                        },
                        $setOnInsert: { createdAt: new Date() }
                    },
                    { upsert: true }
                );

                if (shiftResult.upsertedCount > 0) shiftsCreated++;
                else if (shiftResult.modifiedCount > 0) shiftsUpdated++;

                // Attendance
                const attendanceRecord = {
                    staffId: user._id,
                    date: dateInfo.date,
                    actualStart: createDateTime(dateInfo.date, start),
                    actualEnd: end ? createDateTime(dateInfo.date, end) : undefined,
                    isManualEntry: true,
                    updatedAt: new Date(),
                };

                const attendanceResult = await staffAttendanceCollection.updateOne(
                    { staffId: user._id, date: dateInfo.date },
                    { $set: attendanceRecord, $setOnInsert: { createdAt: new Date() } },
                    { upsert: true }
                );

                if (attendanceResult.upsertedCount > 0) attendanceCreated++;
                else if (attendanceResult.modifiedCount > 0) attendanceUpdated++;
            }
        }

        res.json({
            success: true,
            message: 'Импорт посещаемости сотрудников завершён',
            stats: { shiftsCreated, shiftsUpdated, attendanceCreated, attendanceUpdated, notFound, notFoundList }
        });
    } catch (error: any) {
        console.error('Ошибка импорта посещаемости сотрудников:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Импорт оплаты детей
 */
export const importChildPayments = async (req: Request, res: Response) => {
    try {
        const year = req.body.year || new Date().getFullYear();
        const month = req.body.month !== undefined ? req.body.month : new Date().getMonth();

        const PERIOD_START = new Date(year, month, 1);
        const PERIOD_END = new Date(year, month + 1, 0);

        const db = getDb();
        if (!db) throw new Error('База данных не доступна');

        const childrenCollection = db.collection('children');
        const childPaymentsCollection = db.collection('childPayments');

        const children = await childrenCollection.find({}).toArray();
        const childrenMap = new Map<string, any>();
        for (const child of children) {
            childrenMap.set(child.fullName.toLowerCase().trim(), child);
        }

        const excelPath = path.join(__dirname, '../../docs/ChildPayment.xlsx');
        const workbook = xlsx.readFile(excelPath);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows: any[][] = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: '' });

        let created = 0, updated = 0, skipped = 0, notFound = 0;
        const notFoundList: string[] = [];

        for (let i = 5; i < rows.length; i++) {
            const row = rows[i];
            const fullName = (row[0] || '').toString().trim();
            const position = (row[3] || '').toString().trim();
            const salary = parseFloat(row[5]) || 0;
            const accruals = parseFloat(row[6]) || 0;
            const deductions = parseFloat(row[7]) || 0;

            if (!fullName) continue;
            if (position !== 'Воспитанник') { skipped++; continue; }

            const child = findByFullName(childrenMap, fullName);
            if (!child) {
                notFound++;
                if (!notFoundList.includes(fullName)) notFoundList.push(fullName);
                continue;
            }

            const paymentRecord = {
                childId: child._id,
                period: { start: PERIOD_START, end: PERIOD_END },
                amount: salary,
                total: deductions,
                status: 'active',
                accruals: accruals,
                deductions: 0,
                updatedAt: new Date(),
            };

            const result = await childPaymentsCollection.updateOne(
                { childId: child._id, 'period.start': PERIOD_START, 'period.end': PERIOD_END },
                { $set: paymentRecord, $setOnInsert: { createdAt: new Date() } },
                { upsert: true }
            );

            if (result.upsertedCount > 0) created++;
            else if (result.modifiedCount > 0) updated++;
        }

        res.json({
            success: true,
            message: 'Импорт оплаты детей завершён',
            stats: { created, updated, skipped, notFound, notFoundList }
        });
    } catch (error: any) {
        console.error('Ошибка импорта оплаты детей:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Импорт зарплат сотрудников
 */
export const importPayrolls = async (req: Request, res: Response) => {
    try {
        const period = req.body.period || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;

        const db = getDb();
        if (!db) throw new Error('База данных не доступна');

        const usersCollection = db.collection('users');
        const payrollsCollection = db.collection('payrolls');

        const users = await usersCollection.find({}).toArray();
        const usersMap = new Map<string, any>();
        for (const user of users) {
            usersMap.set(user.fullName.toLowerCase().trim(), user);
        }

        const excelPath = path.join(__dirname, '../../docs/Payrolls.xlsx');
        const workbook = xlsx.readFile(excelPath);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows: any[][] = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: '' });

        let created = 0, updated = 0, notFound = 0;
        const notFoundList: string[] = [];

        for (let i = 7; i < rows.length; i++) {
            const row = rows[i];
            const fullName = (row[0] || '').toString().trim();
            const position = (row[3] || '').toString().trim();
            const salary = parseFloat(row[5]) || 0;
            const accruals = parseFloat(row[6]) || 0;
            const deductions = parseFloat(row[7]) || 0;
            const netSalary = parseFloat(row[11]) || 0;

            if (!fullName || fullName === 'Сотрудник' || !position) continue;

            const user = findByFullName(usersMap, fullName);
            if (!user) {
                notFound++;
                if (!notFoundList.includes(fullName)) notFoundList.push(fullName);
                continue;
            }

            const existingPayroll = await payrollsCollection.findOne({ staffId: user._id, period });

            if (existingPayroll) {
                await payrollsCollection.updateOne(
                    { staffId: user._id, period },
                    { $set: { baseSalary: salary, bonuses: accruals, updatedAt: new Date() } }
                );
                updated++;
            } else {
                await payrollsCollection.insertOne({
                    staffId: user._id,
                    period,
                    baseSalary: salary,
                    baseSalaryType: 'month',
                    bonuses: accruals,
                    deductions: deductions,
                    total: netSalary,
                    accruals: netSalary,
                    penalties: 0,
                    status: 'generated',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                });
                created++;
            }
        }

        res.json({
            success: true,
            message: 'Импорт зарплат завершён',
            stats: { created, updated, notFound, notFoundList }
        });
    } catch (error: any) {
        console.error('Ошибка импорта зарплат:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};
