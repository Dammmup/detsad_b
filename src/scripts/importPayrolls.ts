/**
 * Скрипт миграции зарплат сотрудников из Excel + сравнение + закрепление оклада
 * УЛУЧШЕННАЯ ВЕРСИЯ: поиск по частичному совпадению
 * 
 * ВАЖНО: Обновляет baseSalary для ВСЕХ найденных сотрудников!
 */

import * as xlsx from 'xlsx';
import * as path from 'path';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/detsad';

const PERIOD = '2025-12';

const COLUMNS = {
    name: 0,
    location: 1,
    department: 2,
    position: 3,
    period: 4,
    salary: 5,
    accruals: 6,
    deductions: 7,
    taxEmployee: 8,
    taxEmployer: 9,
    loan: 10,
    netSalary: 11,
    companyCost: 12,
};

interface ComparisonResult {
    fullName: string;
    position: string;
    excelSalary: number;
    excelAccruals: number;
    excelDeductions: number;
    excelNetSalary: number;
    dbBaseSalary: number;
    dbAccruals: number;
    dbPenalties: number;
    dbTotal: number;
    dbWorkedShifts: number;
    difference: number;
    percentDiff: number;
}

// Улучшенный поиск
function findByFullName(dbRecords: Map<string, any>, excelFullName: string): any | null {
    const searchName = excelFullName.toLowerCase().trim();

    if (dbRecords.has(searchName)) {
        return dbRecords.get(searchName);
    }

    for (const [fullName, user] of dbRecords) {
        if (fullName.startsWith(searchName)) {
            return user;
        }
    }

    const searchWords = searchName.split(' ').filter(w => w.length > 1);
    for (const [fullName, user] of dbRecords) {
        let allMatch = true;
        for (const word of searchWords) {
            if (!fullName.includes(word)) {
                allMatch = false;
                break;
            }
        }
        if (allMatch && searchWords.length > 0) {
            return user;
        }
    }

    return null;
}

async function importPayrolls() {
    console.log('🚀 Начинаем импорт зарплат и сравнение (улучшенный поиск)...');

    try {
        console.log('📡 Подключение к MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('✅ Подключено к MongoDB');

        const db = mongoose.connection.db;
        if (!db) throw new Error('База данных не доступна');

        const usersCollection = db.collection('users');
        const payrollsCollection = db.collection('payrolls');

        console.log('📚 Загружаем данные...');

        const users = await usersCollection.find({}).toArray();
        const usersMap = new Map<string, any>();
        for (const user of users) {
            const key = user.fullName.toLowerCase().trim();
            usersMap.set(key, user);
        }
        console.log(`✅ Загружено: ${users.length} пользователей`);

        const excelPath = path.join(__dirname, '../../docs/Payrolls.xlsx');
        console.log(`📖 Читаем Excel файл: ${excelPath}`);

        const workbook = xlsx.readFile(excelPath);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows: any[][] = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: '' });

        console.log(`📊 Всего строк в файле: ${rows.length}`);

        const comparisons: ComparisonResult[] = [];
        let created = 0;
        let updated = 0;
        let notFound = 0;
        const notFoundList: string[] = [];

        for (let i = 7; i < rows.length; i++) {
            const row = rows[i];

            const fullName = (row[COLUMNS.name] || '').toString().trim();
            const position = (row[COLUMNS.position] || '').toString().trim();
            const salary = parseFloat(row[COLUMNS.salary]) || 0;
            const accruals = parseFloat(row[COLUMNS.accruals]) || 0;
            const deductions = parseFloat(row[COLUMNS.deductions]) || 0;
            const netSalary = parseFloat(row[COLUMNS.netSalary]) || 0;

            if (!fullName) continue;
            if (fullName === 'Сотрудник' || !position) continue;

            const user = findByFullName(usersMap, fullName);

            if (!user) {
                notFound++;
                if (!notFoundList.includes(fullName)) {
                    notFoundList.push(fullName);
                }
                continue;
            }

            const existingPayroll = await payrollsCollection.findOne({
                staffId: user._id,
                period: PERIOD
            });

            const comparison: ComparisonResult = {
                fullName,
                position,
                excelSalary: salary,
                excelAccruals: accruals,
                excelDeductions: deductions,
                excelNetSalary: netSalary,
                dbBaseSalary: existingPayroll?.baseSalary || 0,
                dbAccruals: existingPayroll?.accruals || 0,
                dbPenalties: existingPayroll?.penalties || 0,
                dbTotal: existingPayroll?.total || 0,
                dbWorkedShifts: existingPayroll?.workedShifts || 0,
                difference: netSalary - (existingPayroll?.total || 0),
                percentDiff: 0,
            };

            if (existingPayroll?.total && existingPayroll.total > 0) {
                comparison.percentDiff = ((netSalary - existingPayroll.total) / existingPayroll.total) * 100;
            }

            comparisons.push(comparison);

            // ОБНОВЛЯЕМ ВСЕ ЗАПИСИ: создаём или обновляем с ЗАКРЕПЛЁННЫМ окладом
            if (existingPayroll) {
                // Обновляем оклад и пересчитываем
                await payrollsCollection.updateOne(
                    { staffId: user._id, period: PERIOD },
                    {
                        $set: {
                            baseSalary: salary,
                            bonuses: accruals,
                            updatedAt: new Date()
                        }
                    }
                );
                updated++;
                console.log(`✏️ Обновлён оклад: ${fullName} → ${salary} тг`);
            } else {
                // Создаём новую запись
                const newPayrollRecord: any = {
                    staffId: user._id,
                    period: PERIOD,
                    baseSalary: salary,
                    baseSalaryType: 'month',
                    bonuses: accruals,
                    deductions: deductions,
                    total: netSalary,
                    accruals: netSalary,
                    penalties: 0,
                    latePenalties: 0,
                    absencePenalties: 0,
                    workedShifts: 0,
                    workedDays: 0,
                    status: 'generated',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                };
                await payrollsCollection.insertOne(newPayrollRecord);
                created++;
                console.log(`✅ Создан: ${fullName} (оклад: ${salary} тг)`);
            }
        }

        // Отчёт сравнения
        console.log('\n');
        console.log('═'.repeat(120));
        console.log('                     ОТЧЁТ СРАВНЕНИЯ ЗАРПЛАТ: Excel vs База данных');
        console.log('═'.repeat(120));
        console.log('');
        console.log('┌' + '─'.repeat(25) + '┬' + '─'.repeat(15) + '┬' + '─'.repeat(12) + '┬' + '─'.repeat(12) + '┬' + '─'.repeat(12) + '┬' + '─'.repeat(12) + '┬' + '─'.repeat(12) + '┬' + '─'.repeat(10) + '┐');
        console.log('│ ФИО                     │ Должность     │ Оклад Excel│ Оклад БД   │ Итого Excel│ Итого БД   │ Разница    │ %          │');
        console.log('├' + '─'.repeat(25) + '┼' + '─'.repeat(15) + '┼' + '─'.repeat(12) + '┼' + '─'.repeat(12) + '┼' + '─'.repeat(12) + '┼' + '─'.repeat(12) + '┼' + '─'.repeat(12) + '┼' + '─'.repeat(10) + '┤');

        for (const c of comparisons) {
            const name = c.fullName.padEnd(23).substring(0, 23);
            const pos = c.position.padEnd(13).substring(0, 13);
            const exSal = c.excelSalary.toString().padStart(10);
            const dbSal = c.dbBaseSalary.toString().padStart(10);
            const exNet = c.excelNetSalary.toString().padStart(10);
            const dbTot = c.dbTotal.toString().padStart(10);
            const diff = c.difference.toString().padStart(10);
            const pct = c.percentDiff.toFixed(1).padStart(8);

            console.log(`│ ${name} │ ${pos} │ ${exSal} │ ${dbSal} │ ${exNet} │ ${dbTot} │ ${diff} │ ${pct}% │`);
        }

        console.log('└' + '─'.repeat(25) + '┴' + '─'.repeat(15) + '┴' + '─'.repeat(12) + '┴' + '─'.repeat(12) + '┴' + '─'.repeat(12) + '┴' + '─'.repeat(12) + '┴' + '─'.repeat(12) + '┴' + '─'.repeat(10) + '┘');

        const totalExcel = comparisons.reduce((sum, c) => sum + c.excelNetSalary, 0);
        const totalDB = comparisons.reduce((sum, c) => sum + c.dbTotal, 0);
        const totalDiff = totalExcel - totalDB;

        console.log('');
        console.log(`Итого по Excel:  ${totalExcel.toLocaleString('ru')} тг`);
        console.log(`Итого по БД:     ${totalDB.toLocaleString('ru')} тг`);
        if (totalDB > 0) {
            console.log(`Общая разница:   ${totalDiff.toLocaleString('ru')} тг (${((totalDiff / totalDB) * 100).toFixed(1)}%)`);
        }

        console.log('\n📊 === ИТОГИ МИГРАЦИИ ===');
        console.log(`Создано записей: ${created}`);
        console.log(`Обновлено (оклад): ${updated}`);
        console.log(`Не найдено в БД: ${notFound}`);

        if (notFoundList.length > 0) {
            console.log('\n⚠️ Не найденные сотрудники:');
            notFoundList.forEach(name => console.log(`   - ${name}`));
        }

        const significantDiffs = comparisons.filter(c => Math.abs(c.percentDiff) > 5);
        if (significantDiffs.length > 0) {
            console.log('\n📋 === РАСХОЖДЕНИЯ > 5% ===');
            for (const c of significantDiffs) {
                console.log(`   - ${c.fullName}: Excel=${c.excelNetSalary}, БД=${c.dbTotal}, разница=${c.difference} (${c.percentDiff.toFixed(1)}%)`);
            }
        }

    } catch (error) {
        console.error('❌ Ошибка:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 Отключено от MongoDB');
    }
}

importPayrolls();
