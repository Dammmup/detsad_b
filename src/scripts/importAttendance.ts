
import * as xlsx from 'xlsx';
import * as path from 'path';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv:27017/test';


const STAFF_DEPARTMENTS = ['Штат'];


const YEAR = 2025;


const MONTH_MAP: { [key: string]: number } = {
    'янв': 0, 'фев': 1, 'мар': 2, 'апр': 3, 'май': 4, 'июн': 5,
    'июл': 6, 'авг': 7, 'сен': 8, 'окт': 9, 'ноя': 10, 'дек': 11
};

interface DateInfo {
    date: Date;
    columnIndex: number;
}


function normalizeName(name: string): string {
    return name.toLowerCase().replace(/\s+/g, ' ').trim();
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


function parseTimeCell(cell: string): { start: string | null; end: string | null } {
    if (!cell || cell === '__ - __' || cell === 'В') {
        return { start: null, end: null };
    }

    const parts = cell.split(' - ');
    const start = parts[0] !== '__' ? parts[0] : null;
    const end = parts[1] !== '__' ? parts[1] : null;

    return { start, end };
}


function createDateTime(date: Date, time: string): Date {
    const [hours, minutes] = time.split(':').map(Number);
    const result = new Date(date);
    result.setHours(hours, minutes, 0, 0);
    return result;
}

async function importAttendance() {
    console.log('🚀 Начинаем импорт посещаемости...');

    try {

        console.log('📡 Подключение к MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('✅ Подключено к MongoDB');

        const db = mongoose.connection.db;
        if (!db) throw new Error('База данных не доступна');


        const childrenCollection = db.collection('children');
        const usersCollection = db.collection('users');
        const groupsCollection = db.collection('groups');
        const childAttendanceCollection = db.collection('childattendances');
        const staffAttendanceCollection = db.collection('staff_attendance_tracking');
        const shiftsCollection = db.collection('shifts');


        console.log('📚 Загружаем данные...');

        const children = await childrenCollection.find({}).toArray();
        const childrenMap = new Map<string, any>();
        for (const child of children) {
            childrenMap.set(normalizeName(child.fullName), child);
        }

        const users = await usersCollection.find({}).toArray();
        const usersMap = new Map<string, any>();
        for (const user of users) {
            usersMap.set(normalizeName(user.fullName), user);
        }

        const groups = await groupsCollection.find({}).toArray();
        const groupMap = new Map<string, string>();
        for (const group of groups) {
            groupMap.set(group.name.toLowerCase(), group._id.toString());
        }

        console.log(`✅ Загружено: ${children.length} детей, ${users.length} пользователей, ${groups.length} групп`);


        const excelPath = path.join(__dirname, '../../docs/Посещаемость.xlsx');
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
        console.log(`📅 Найдено ${dates.length} дат (${dates[0]?.date.toLocaleDateString('ru')} - ${dates[dates.length - 1]?.date.toLocaleDateString('ru')})`);


        let childAttendanceCreated = 0;
        let staffAttendanceCreated = 0;
        let shiftsCreated = 0;
        let skipped = 0;
        let notFound = 0;


        const adminUser = await usersCollection.findOne({ role: 'admin' });
        const adminId = adminUser?._id || new mongoose.Types.ObjectId();


        for (let i = 5; i < rows.length; i++) {
            const row = rows[i];

            const surname = (row[0] || '').toString().trim();
            const name = (row[1] || '').toString().trim();
            const department = (row[2] || '').toString().trim();

            if (!surname && !name) continue;

            const fullName = `${name} ${surname}`;
            const normalizedFullName = normalizeName(fullName);

            const isStaff = STAFF_DEPARTMENTS.includes(department);


            let entity: any = null;
            let groupId: mongoose.Types.ObjectId | null = null;

            if (isStaff) {
                entity = usersMap.get(normalizedFullName);
            } else {
                entity = childrenMap.get(normalizedFullName);
                const gId = groupMap.get(department.toLowerCase());
                if (gId) groupId = new mongoose.Types.ObjectId(gId);
            }

            if (!entity) {
                notFound++;
                continue;
            }


            for (const dateInfo of dates) {
                const cellValue = (row[dateInfo.columnIndex] || '').toString().trim();


                if (!cellValue || cellValue === '__ - __' || cellValue === 'В') {
                    continue;
                }

                const { start, end } = parseTimeCell(cellValue);


                if (!start) {
                    skipped++;
                    continue;
                }

                if (isStaff) {

                    const attendanceRecord: any = {
                        staffId: entity._id,
                        date: dateInfo.date,
                        actualStart: createDateTime(dateInfo.date, start),
                        actualEnd: end ? createDateTime(dateInfo.date, end) : undefined,
                        isManualEntry: true,
                        totalHours: 0,
                        regularHours: 0,
                        overtimeHours: 0,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    };


                    const existing = await staffAttendanceCollection.findOne({
                        staffId: entity._id,
                        date: dateInfo.date
                    });

                    if (!existing) {
                        await staffAttendanceCollection.insertOne(attendanceRecord);
                        staffAttendanceCreated++;
                    }


                    const shiftRecord: any = {
                        staffId: entity._id,
                        date: dateInfo.date.toISOString().split('T')[0],
                        startTime: start,
                        endTime: end || '18:00',
                        status: 'completed',
                        createdBy: adminId,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    };

                    const existingShift = await shiftsCollection.findOne({
                        staffId: entity._id,
                        date: shiftRecord.date
                    });

                    if (!existingShift) {
                        await shiftsCollection.insertOne(shiftRecord);
                        shiftsCreated++;
                    }

                } else {

                    const childAttendanceRecord: any = {
                        childId: entity._id,
                        groupId: groupId || entity.groupId,
                        date: dateInfo.date,
                        status: 'present',
                        actualStart: createDateTime(dateInfo.date, start),
                        actualEnd: end ? createDateTime(dateInfo.date, end) : undefined,
                        markedBy: adminId,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    };


                    const existing = await childAttendanceCollection.findOne({
                        childId: entity._id,
                        date: dateInfo.date
                    });

                    if (!existing) {
                        await childAttendanceCollection.insertOne(childAttendanceRecord);
                        childAttendanceCreated++;
                    }
                }
            }
        }


        console.log('\n📊 === ИТОГИ ===');
        console.log(`Создано записей посещаемости детей: ${childAttendanceCreated}`);
        console.log(`Создано записей посещаемости сотрудников: ${staffAttendanceCreated}`);
        console.log(`Создано смен: ${shiftsCreated}`);
        console.log(`Пропущено (нет времени): ${skipped}`);
        console.log(`Не найдено в БД: ${notFound}`);

    } catch (error) {
        console.error('❌ Ошибка:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 Отключено от MongoDB');
    }
}


importAttendance();
