/**
 * Скрипт импорта шаблонов активностей в базу данных
 * Запуск: npx ts-node src/scripts/importActivityTemplates.ts
 */

import mongoose from 'mongoose';
import ActivityTemplate from '../entities/cyclogram/activityTemplate/model';
import * as fs from 'fs';
import * as path from 'path';

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://damir:damir@cluster0.ku60i6n.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

async function importTemplates() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        // Читаем файл с шаблонами
        const templatesPath = path.join(__dirname, '../../docs/activity_templates_full.json');
        const templatesData = fs.readFileSync(templatesPath, 'utf-8');
        const templates = JSON.parse(templatesData);

        console.log(`Found ${templates.length} templates to import`);

        // Очищаем существующие шаблоны (опционально)
        const existingCount = await ActivityTemplate.countDocuments();
        if (existingCount > 0) {
            console.log(`Deleting ${existingCount} existing templates...`);
            await ActivityTemplate.deleteMany({});
        }

        // Вставляем новые шаблоны
        const result = await ActivityTemplate.insertMany(templates.map((t: any) => ({
            ...t,
            isActive: true
        })));

        console.log(`Successfully imported ${result.length} templates`);

        // Статистика по типам
        const stats = await ActivityTemplate.aggregate([
            { $group: { _id: '$type', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        console.log('\nTemplates by type:');
        stats.forEach((s: any) => {
            console.log(`  ${s._id}: ${s.count}`);
        });

    } catch (error) {
        console.error('Import error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\nDisconnected from MongoDB');
    }
}

importTemplates();
