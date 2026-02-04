
import mongoose from 'mongoose';
import User from '../entities/users/model';
import Rent from '../entities/rent/model';
import dotenv from 'dotenv';
import path from 'path';

// Загружаем переменные окружения из .env файла в корне проекта
const envPath = path.resolve(__dirname, '../../.env');
console.log('Loading .env from:', envPath);
dotenv.config({ path: envPath });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/detsad';
console.log('Using MongoDB URI:', MONGO_URI.replace(/\/\/.*@/, '//***@'));

const cleanupNonTenantRents = async () => {
    try {
        console.log('Connecting to MongoDB...', MONGO_URI);
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        const EXTERNAL_ROLES = ['tenant', 'speech_therapist'];

        // Находим всех пользователей, которые НЕ являются внешними специалистами
        const nonExternalUsers = await User.find({ role: { $nin: EXTERNAL_ROLES } }).select('_id fullName role');
        const nonExternalUserIds = nonExternalUsers.map(u => u._id);

        console.log(`Found ${nonExternalUsers.length} non-external users.`);

        if (nonExternalUserIds.length > 0) {
            // Подсчитываем сколько записей будет удалено
            const count = await Rent.countDocuments({ tenantId: { $in: nonExternalUserIds } });
            console.log(`Found ${count} invalid rent records to delete.`);

            if (count > 0) {
                const result = await Rent.deleteMany({ tenantId: { $in: nonExternalUserIds } });
                console.log(`Successfully deleted ${result.deletedCount} invalid rent records.`);
            } else {
                console.log('No invalid rent records found.');
            }
        } else {
            console.log('No non-external users found (?!)');
        }

        console.log('Migration completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};

cleanupNonTenantRents();
