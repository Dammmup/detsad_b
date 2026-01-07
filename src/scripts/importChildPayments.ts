/**
 * Скрипт миграции оплаты детей из Excel
 * УЛУЧШЕННАЯ ВЕРСИЯ: поиск по частичному совпадению
 */

import * as xlsx from 'xlsx';
import * as path from 'path';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/detsad';

const PERIOD_START = new Date(2025, 11, 1);
const PERIOD_END = new Date(2025, 11, 31);

const COLUMNS = {
    name: 0,
    location: 1,
    department: 2,
    position: 3,
    period: 4,
    salary: 5,
    accruals: 6,
    deductions: 7,
};

// Улучшенный поиск: ищет по имени и фамилии
function findByFullName(dbRecords: Map<string, any>, excelFullName: string): any | null {
    const searchName = excelFullName.toLowerCase().trim();

    // 1. Точное совпадение
    if (dbRecords.has(searchName)) {
        return dbRecords.get(searchName);
    }

    // 2. Поиск по началу строки (Excel: "Имя Фамилия", БД: "Имя Фамилия Отчество")
    for (const [fullName, child] of dbRecords) {
        if (fullName.startsWith(searchName)) {
            return child;
        }
    }

    // 3. Поиск по содержанию всех слов
    const searchWords = searchName.split(' ').filter(w => w.length > 1);
    for (const [fullName, child] of dbRecords) {
        let allMatch = true;
        for (const word of searchWords) {
            if (!fullName.includes(word)) {
                allMatch = false;
                break;
            }
        }
        if (allMatch && searchWords.length > 0) {
            return child;
        }
    }

    return null;
}

async function importChildPayments() {
    console.log('🚀 Начинаем импорт оплаты детей (улучшенный поиск)...');

    try {
        console.log('📡 Подключение к MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('✅ Подключено к MongoDB');

        const db = mongoose.connection.db;
        if (!db) throw new Error('База данных не доступна');

        const childrenCollection = db.collection('children');
        const childPaymentsCollection = db.collection('childPayments');

        console.log('📚 Загружаем данные...');

        const children = await childrenCollection.find({}).toArray();
        const childrenMap = new Map<string, any>();
        for (const child of children) {
            const key = child.fullName.toLowerCase().trim();
            childrenMap.set(key, child);
        }
        console.log(`✅ Загружено: ${children.length} детей`);

        const excelPath = path.join(__dirname, '../../docs/ChildPayment.xlsx');
        console.log(`📖 Читаем Excel файл: ${excelPath}`);

        const workbook = xlsx.readFile(excelPath);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows: any[][] = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: '' });

        console.log(`📊 Всего строк в файле: ${rows.length}`);

        let created = 0;
        let updated = 0;
        let skipped = 0;
        let notFound = 0;
        const notFoundList: string[] = [];

        for (let i = 5; i < rows.length; i++) {
            const row = rows[i];

            const fullName = (row[COLUMNS.name] || '').toString().trim();
            const position = (row[COLUMNS.position] || '').toString().trim();
            const salary = parseFloat(row[COLUMNS.salary]) || 0;
            const accruals = parseFloat(row[COLUMNS.accruals]) || 0;
            const deductions = parseFloat(row[COLUMNS.deductions]) || 0;

            if (!fullName) continue;

            if (position !== 'Воспитанник') {
                skipped++;
                continue;
            }

            const child = findByFullName(childrenMap, fullName);

            if (!child) {
                notFound++;
                if (!notFoundList.includes(fullName)) {
                    notFoundList.push(fullName);
                }
                continue;
            }

            const amount = salary;
            const total = deductions;

            const mp = `${PERIOD_START.getFullYear()}-${String(PERIOD_START.getMonth() + 1).padStart(2, '0')}`;

            const paymentRecord: any = {
                childId: child._id,
                period: {
                    start: PERIOD_START,
                    end: PERIOD_END
                },
                monthPeriod: mp,
                amount: amount,
                total: total,
                status: 'active',
                accruals: accruals,
                deductions: 0,
                updatedAt: new Date(),
            };

            const result = await childPaymentsCollection.updateOne(
                {
                    childId: child._id,
                    monthPeriod: mp
                },
                {
                    $set: paymentRecord,
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

        console.log('\n📊 === ИТОГИ ===');
        console.log(`Создано записей: ${created}`);
        console.log(`Обновлено записей: ${updated}`);
        console.log(`Пропущено (не воспитанники): ${skipped}`);
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

importChildPayments();
