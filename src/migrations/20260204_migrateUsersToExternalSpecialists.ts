
import mongoose from 'mongoose';
import User from '../entities/users/model';
import Rent from '../entities/rent/model';
import ExternalSpecialist from '../entities/externalSpecialists/model';
import dotenv from 'dotenv';
import path from 'path';

const envPath = path.resolve(__dirname, '../../.env');
console.log('Loading .env from:', envPath);
dotenv.config({ path: envPath });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/detsad';

const migrate = async () => {
    try {
        console.log('Connecting to MongoDB...', MONGODB_URI.replace(/\/\/.*@/, '//***@'));
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        const EXTERNAL_ROLES = ['tenant', 'speech_therapist'];

        // 1. Находим пользователей для переноса
        const usersToMigrate = await User.find({ role: { $in: EXTERNAL_ROLES } });
        console.log(`Found ${usersToMigrate.length} users to migrate.`);

        for (const user of usersToMigrate) {
            console.log(`Migrating user: ${user.fullName} (${user.role})`);

            // 2. Создаем ExternalSpecialist
            const specialistData = {
                name: user.fullName,
                type: user.role === 'speech_therapist' ? 'speech_therapist' : 'tenant', // map roles to types
                phone: user.phone,
                active: user.active !== false
            };

            // Проверяем, существует ли уже такой специалист (чтобы избежать дублей при повторном запуске)
            let specialist = await ExternalSpecialist.findOne({ name: specialistData.name, type: specialistData.type });

            if (!specialist) {
                specialist = new ExternalSpecialist(specialistData);
                await specialist.save();
                console.log(`Created ExternalSpecialist: ${specialist.name} (${specialist._id})`);
            } else {
                console.log(`ExternalSpecialist already exists: ${specialist.name} (${specialist._id})`);
            }

            // 3. Обновляем ссылки в Rent
            const updateResult = await Rent.updateMany(
                { tenantId: user._id },
                { $set: { tenantId: specialist._id } }
            );

            console.log(`Updated ${updateResult.modifiedCount} rent records for user ${user.fullName}`);

            // Опционально: можно пометить пользователя как deleted или изменить роль, но пока оставляем как есть,
            // чтобы не ломать старые связи в других местах, если они есть (хотя мы их отделили).
            // Если пользователь уверен, что хочет удалить их доступ - можно сделать user.active = false.
            // user.active = false;
            // await user.save();
        }

        console.log('Migration completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};

migrate();
