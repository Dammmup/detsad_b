
import * as xlsx from 'xlsx';
import * as path from 'path';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/detsad';


const SKIP_DEPARTMENTS = ['Штат', 'Аренда', 'ЦЗ', 'Продленка', 'Подготовка к школе'];


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


function normalizeName(name: string): string {
    return name.toLowerCase().replace(/\s+/g, ' ').trim();
}

async function importPayments() {
    console.log('🚀 Начинаем импорт оплаты...');

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
            childrenMap.set(normalizeName(child.fullName), child);
        }
        console.log(`✅ Загружено: ${children.length} детей`);


        const excelPath = path.join(__dirname, '../../docs/Оплата.xlsx');
        console.log(`📖 Читаем Excel файл: ${excelPath}`);

        const workbook = xlsx.readFile(excelPath);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows: any[][] = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: '' });

        console.log(`📊 Всего строк в файле: ${rows.length}`);


        let created = 0;
        let updated = 0;
        let skipped = 0;
        let notFound = 0;


        for (let i = 7; i < rows.length; i++) {
            const row = rows[i];

            const fullName = (row[COLUMNS.name] || '').toString().trim();
            const department = (row[COLUMNS.department] || '').toString().trim();
            const salary = parseFloat(row[COLUMNS.salary]) || 0;
            const accruals = parseFloat(row[COLUMNS.accruals]) || 0;
            const deductions = parseFloat(row[COLUMNS.deductions]) || 0;

            if (!fullName) continue;


            if (SKIP_DEPARTMENTS.some(skip => department.toLowerCase() === skip.toLowerCase())) {
                skipped++;
                continue;
            }

            const normalizedFullName = normalizeName(fullName);


            const child = childrenMap.get(normalizedFullName);

            if (!child) {
                notFound++;
                console.log(`⚠️ Не найден: ${fullName}`);
                continue;
            }


            const amount = salary;
            const total = amount + accruals - deductions;


            const existingPayment = await childPaymentsCollection.findOne({
                childId: child._id,
                'period.start': PERIOD_START,
                'period.end': PERIOD_END
            });

            if (existingPayment) {

                await childPaymentsCollection.updateOne(
                    { _id: existingPayment._id },
                    {
                        $set: {
                            amount: amount,
                            accruals: accruals,
                            deductions: deductions,
                            total: total,
                            updatedAt: new Date()
                        }
                    }
                );
                updated++;
                console.log(`✏️ Обновлен: ${fullName} (${amount} + ${accruals} - ${deductions} = ${total})`);
            } else {

                const paymentRecord: any = {
                    childId: child._id,
                    period: {
                        start: PERIOD_START,
                        end: PERIOD_END
                    },
                    amount: amount,
                    total: total,
                    status: 'active',
                    accruals: accruals,
                    deductions: deductions,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                };

                await childPaymentsCollection.insertOne(paymentRecord);
                created++;
                console.log(`✅ Создан: ${fullName} (${amount} + ${accruals} - ${deductions} = ${total})`);
            }
        }


        console.log('\n📊 === ИТОГИ ===');
        console.log(`Создано записей оплаты: ${created}`);
        console.log(`Обновлено записей: ${updated}`);
        console.log(`Пропущено (персонал): ${skipped}`);
        console.log(`Не найдено в БД: ${notFound}`);

    } catch (error) {
        console.error('❌ Ошибка:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 Отключено от MongoDB');
    }
}


importPayments();
