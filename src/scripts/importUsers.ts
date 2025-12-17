
import * as xlsx from 'xlsx';
import * as path from 'path';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv:27017/test';


const SKIP_DEPARTMENTS = ['Штат', 'Аренда', 'ЦЗ', 'Продленка', 'Подготовка к школе'];


const COLUMNS = {
    name: 1,
    surname: 2,
    patronymic: 3,
    department: 6,
    phone: 9,
    birthday: 16,
    duties: 21,
};

interface ExcelRow {
    fullName: string;
    groupName: string;
    phone: string;
    birthday: Date | null;
    notes: string;
}


function parseExcelDate(value: any): Date | null {
    if (!value) return null;


    if (typeof value === 'number') {
        const excelEpoch = new Date(1899, 11, 30);
        return new Date(excelEpoch.getTime() + value * 24 * 60 * 60 * 1000);
    }


    if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return new Date(value);
    }

    return null;
}


function normalizeName(name: string): string {
    return name
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .trim();
}

async function importUsers() {
    console.log('🚀 Начинаем импорт данных пользователей...');

    try {

        console.log('📡 Подключение к MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('✅ Подключено к MongoDB');


        const db = mongoose.connection.db;
        if (!db) {
            throw new Error('База данных не доступна');
        }

        const childrenCollection = db.collection('children');
        const groupsCollection = db.collection('groups');


        console.log('📚 Загружаем группы...');
        const groups = await groupsCollection.find({}).toArray();
        const groupMap = new Map<string, string>();

        for (const group of groups) {
            groupMap.set(group.name.toLowerCase(), group._id.toString());
        }
        console.log(`✅ Загружено ${groups.length} групп`);


        console.log('👶 Загружаем детей...');
        const children = await childrenCollection.find({}).toArray();
        const childrenMap = new Map<string, any>();

        for (const child of children) {
            const normalizedName = normalizeName(child.fullName);
            childrenMap.set(normalizedName, child);
        }
        console.log(`✅ Загружено ${children.length} детей`);


        const excelPath = path.join(__dirname, '../../docs/Пользователи (1).xlsx');
        console.log(`📖 Читаем Excel файл: ${excelPath}`);

        const workbook = xlsx.readFile(excelPath);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows: any[][] = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: '' });

        console.log(`📊 Всего строк в файле: ${rows.length}`);


        let processed = 0;
        let skipped = 0;
        let updated = 0;
        let created = 0;
        let notFound = 0;
        const notFoundNames: string[] = [];


        for (let i = 6; i < rows.length; i++) {
            const row = rows[i];

            const name = (row[COLUMNS.name] || '').toString().trim();
            const surname = (row[COLUMNS.surname] || '').toString().trim();
            const patronymic = (row[COLUMNS.patronymic] || '').toString().trim();
            const department = (row[COLUMNS.department] || '').toString().trim();
            const phone = (row[COLUMNS.phone] || '').toString().trim();
            const birthdayRaw = row[COLUMNS.birthday];
            const duties = (row[COLUMNS.duties] || '').toString().trim();


            if (!name && !surname) {
                continue;
            }

            processed++;


            if (SKIP_DEPARTMENTS.some(skip => department.toLowerCase() === skip.toLowerCase())) {
                skipped++;
                continue;
            }


            const fullNameParts = [name, surname, patronymic].filter(Boolean);
            const fullName = fullNameParts.join(' ');
            const normalizedFullName = normalizeName(fullName);


            const groupId = groupMap.get(department.toLowerCase());


            const birthday = parseExcelDate(birthdayRaw);


            const child = childrenMap.get(normalizedFullName);

            if (!child) {

                if (groupId) {

                    const newChild: any = {
                        fullName: fullName,
                        groupId: new mongoose.Types.ObjectId(groupId),
                        active: true,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    };

                    if (phone && phone !== '__-__') {
                        newChild.parentPhone = phone;
                    }

                    if (birthday) {
                        newChild.birthday = birthday;
                    }

                    if (duties) {
                        newChild.notes = duties;
                    }

                    await childrenCollection.insertOne(newChild);
                    created++;
                    console.log(`🆕 Создан: ${fullName} (группа: ${department})`);
                } else {

                    notFound++;
                    notFoundNames.push(`${fullName} (отдел: ${department})`);
                }
                continue;
            }


            const updateData: any = {};

            if (groupId) {
                updateData.groupId = new mongoose.Types.ObjectId(groupId);
            }

            if (phone && phone !== '__-__') {
                updateData.parentPhone = phone;
            }

            if (birthday) {
                updateData.birthday = birthday;
            }

            if (duties) {
                updateData.notes = duties;
            }


            if (Object.keys(updateData).length > 0) {
                await childrenCollection.updateOne(
                    { _id: child._id },
                    { $set: updateData }
                );
                updated++;
                console.log(`✅ Обновлен: ${fullName}`);
            }
        }


        console.log('\n📊 === ИТОГИ ===');
        console.log(`Всего обработано строк: ${processed}`);
        console.log(`Пропущено (персонал): ${skipped}`);
        console.log(`Создано детей: ${created}`);
        console.log(`Обновлено детей: ${updated}`);
        console.log(`Не найдено (неизвестный отдел): ${notFound}`);

        if (notFoundNames.length > 0 && notFoundNames.length <= 20) {
            console.log('\n⚠️ Не найдены в базе данных:');
            notFoundNames.forEach(name => console.log(`  - ${name}`));
        } else if (notFoundNames.length > 20) {
            console.log(`\n⚠️ Слишком много не найденных (${notFoundNames.length}), первые 20:`);
            notFoundNames.slice(0, 20).forEach(name => console.log(`  - ${name}`));
        }

    } catch (error) {
        console.error('❌ Ошибка:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 Отключено от MongoDB');
    }
}


importUsers();
