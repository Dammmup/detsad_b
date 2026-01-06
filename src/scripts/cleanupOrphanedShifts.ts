
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/detsad';

async function cleanup() {
    console.log('🚀 Начинаем очистку осиротевших записей смен...');

    try {
        await mongoose.connect(MONGO_URI);
        const db = mongoose.connection.db;
        if (!db) throw new Error('База данных не доступна');

        const shiftsCollection = db.collection('shifts');
        const usersCollection = db.collection('users');

        const shifts = await shiftsCollection.find({}).toArray();
        const users = await usersCollection.find({}).toArray();
        const userIds = new Set(users.map(u => u._id.toString()));

        let deletedCount = 0;
        for (const record of shifts) {
            if (!record.staffId || !userIds.has(record.staffId.toString())) {
                console.log(`🗑️ Удаляем осиротевшую запись: ${record._id} (StaffId: ${record.staffId})`);
                await shiftsCollection.deleteOne({ _id: record._id });
                deletedCount++;
            }
        }

        console.log(`✅ Очистка завершена. Удалено записей: ${deletedCount}`);
    } catch (error) {
        console.error('❌ Ошибка при очистке:', error);
    } finally {
        await mongoose.disconnect();
    }
}

cleanup();
