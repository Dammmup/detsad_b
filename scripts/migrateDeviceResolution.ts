import dotenv from 'dotenv';
import mongoose from 'mongoose';

// Load env from root
dotenv.config();

import StaffAttendanceTracking from '../src/entities/staffAttendanceTracking/model';
import { enrichDeviceMetadata } from '../src/shared/utils/deviceDetector';
import { connectDB } from '../src/config/database';

const migrate = async () => {
    try {
        console.log('🔄 Подключение к базе данных...');
        await connectDB();

        console.log('🔍 Поиск записей для обработки...');
        const records = await StaffAttendanceTracking.find({});

        console.log(`📊 Найдено записей всего: ${records.length}`);

        let updatedCount = 0;
        let skippedCount = 0;

        for (const record of records) {
            let changed = false;

            // Обработка Check-In
            if (record.checkInDevice) {
                const original = JSON.stringify(record.checkInDevice);
                const enriched = enrichDeviceMetadata(record.checkInDevice as any);
                if (original !== JSON.stringify(enriched)) {
                    console.log(`  [Check-In] ${record.staffId} (${record.date.toISOString().split('T')[0]})`);
                    record.checkInDevice = enriched;
                    changed = true;
                }
            }

            // Обработка Check-Out
            if (record.checkOutDevice) {
                const original = JSON.stringify(record.checkOutDevice);
                const enriched = enrichDeviceMetadata(record.checkOutDevice as any);
                if (original !== JSON.stringify(enriched)) {
                    console.log(`  [Check-Out] ${record.staffId} (${record.date.toISOString().split('T')[0]})`);
                    record.checkOutDevice = enriched;
                    changed = true;
                }
            }

            if (changed) {
                await record.save();
                updatedCount++;
            } else {
                skippedCount++;
            }
        }

        console.log('\n✅ Миграция завершена!');
        console.log(`📝 Обновлено записей: ${updatedCount}`);
        console.log(`⏩ Пропущено: ${skippedCount}`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Ошибка миграции:', error);
        process.exit(1);
    }
};

migrate();
