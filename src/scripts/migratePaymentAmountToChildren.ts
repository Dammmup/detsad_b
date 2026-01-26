/**
 * Миграция: Перенос суммы оплаты из childPayments в поле paymentAmount модели Child
 * 
 * Логика:
 * 1. Для каждого ребенка находим последнюю запись платежа
 * 2. Устанавливаем paymentAmount из этой записи
 * 3. Если записей нет — устанавливаем значение по умолчанию (40000)
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { getDatabase } from '../config/mongo';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import Child from '../entities/children/model';
import ChildPayment from '../entities/childPayment/model';

const DEFAULT_PAYMENT_AMOUNT = 40000;

async function migratePaymentAmountToChildren() {
    console.log('Подключение к MongoDB...');
    const { connectDB } = await import('../config/database'); // Import centralized connection
    await connectDB();
    console.log('Подключено к MongoDB');

    try {
        // Получаем всех детей
        const children = await Child.find({});
        console.log(`Найдено детей: ${children.length}`);

        let updatedCount = 0;
        let defaultCount = 0;

        for (const child of children) {
            // Находим последнюю запись платежа для этого ребенка
            const lastPayment = await ChildPayment.findOne({ childId: child._id })
                .sort({ 'period.start': -1 })
                .lean();

            let paymentAmount = DEFAULT_PAYMENT_AMOUNT;

            if (lastPayment && lastPayment.amount) {
                paymentAmount = lastPayment.amount;
                console.log(`${child.fullName}: сумма из платежа = ${paymentAmount}`);
            } else {
                console.log(`${child.fullName}: записей платежей нет, устанавливаем ${DEFAULT_PAYMENT_AMOUNT}`);
                defaultCount++;
            }

            // Обновляем поле paymentAmount у ребенка
            await Child.updateOne(
                { _id: child._id },
                { $set: { paymentAmount } }
            );
            updatedCount++;
        }

        console.log('\n=== Миграция завершена ===');
        console.log(`Всего обновлено детей: ${updatedCount}`);
        console.log(`Из них с дефолтным значением: ${defaultCount}`);

    } catch (error) {
        console.error('Ошибка миграции:', error);
        throw error;
    } finally {
        // Note: In serverless environments, we typically don't disconnect
        // as the connection is managed by the connection pool
        console.log('Соединение с MongoDB остается активным');
    }
}

// Запуск миграции
migratePaymentAmountToChildren()
    .then(() => {
        console.log('Миграция успешно завершена');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Ошибка при выполнении миграции:', error);
        process.exit(1);
    });
