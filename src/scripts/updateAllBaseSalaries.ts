/**
 * Скрипт миграции зарплат для ВСЕХ периодов
 * Обновляет baseSalary во всех записях payroll из данных Excel
 */

import * as xlsx from 'xlsx';
import * as path from 'path';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/detsad';

const COLUMNS = {
    name: 0,
    salary: 5,
};

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

async function updateAllBaseSalaries() {
    console.log('🚀 Начинаем обновление baseSalary для ВСЕХ записей...');

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

        // Читаем Excel для получения окладов
        const excelPath = path.join(__dirname, '../../docs/Payrolls.xlsx');
        console.log(`📖 Читаем Excel файл: ${excelPath}`);

        const workbook = xlsx.readFile(excelPath);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows: any[][] = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: '' });

        // Создаём карту окладов: staffId -> baseSalary
        const salaryMap = new Map<string, number>();

        for (let i = 7; i < rows.length; i++) {
            const row = rows[i];
            const fullName = (row[COLUMNS.name] || '').toString().trim();
            const salary = parseFloat(row[COLUMNS.salary]) || 0;

            if (!fullName || salary === 0) continue;

            const user = findByFullName(usersMap, fullName);
            if (user) {
                salaryMap.set(user._id.toString(), salary);
                console.log(`📋 Оклад для ${fullName}: ${salary} тг`);
            }
        }

        console.log(`\n✅ Найдено окладов: ${salaryMap.size}`);

        // Получаем все записи payroll
        const allPayrolls = await payrollsCollection.find({}).toArray();
        console.log(`📊 Всего записей payroll: ${allPayrolls.length}`);

        let updated = 0;
        let skipped = 0;

        for (const payroll of allPayrolls) {
            const staffId = payroll.staffId?.toString() || payroll.staffId;
            const correctBaseSalary = salaryMap.get(staffId);

            if (correctBaseSalary && payroll.baseSalary !== correctBaseSalary) {
                await payrollsCollection.updateOne(
                    { _id: payroll._id },
                    { $set: { baseSalary: correctBaseSalary, updatedAt: new Date() } }
                );
                updated++;

                // Находим имя для лога
                const user = users.find(u => u._id.toString() === staffId);
                console.log(`✏️ Обновлено: ${user?.fullName || staffId} | ${payroll.period} | ${payroll.baseSalary} → ${correctBaseSalary}`);
            } else {
                skipped++;
            }
        }

        console.log('\n📊 === ИТОГИ ===');
        console.log(`Обновлено записей: ${updated}`);
        console.log(`Пропущено (без изменений): ${skipped}`);

    } catch (error) {
        console.error('❌ Ошибка:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 Отключено от MongoDB');
    }
}

updateAllBaseSalaries();
