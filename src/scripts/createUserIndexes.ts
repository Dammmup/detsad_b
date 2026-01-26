import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../entities/users/model';

dotenv.config();

const createIndexes = async () => {
    try {
        const mongoURI = process.env.MONGO_URI || 'mongodb+srv://damir:damir@cluster0.ku60i6n.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0';

        await mongoose.connect(mongoURI, {
            serverSelectionTimeoutMS: 15000,
            socketTimeoutMS: 45000,
            maxPoolSize: 10,
            minPoolSize: 2
        });

        console.log('✅ Connected to MongoDB');

        // Получаем список существующих индексов
        const existingIndexes = await User.collection.indexes();
        const existingIndexNames = existingIndexes.map(index => index.name);

        // Создаем индекс для поля phone, если он не существует
        if (!existingIndexNames.includes('phone_1')) {
            await User.collection.createIndex({ phone: 1 }, { unique: true, name: 'phone_unique_index' });
            console.log('✅ Created index on phone field');
        } else {
            console.log('⚠️ Index on phone field already exists');
        }

        // Создаем индекс для поля role, если он не существует
        if (!existingIndexNames.includes('role_1')) {
            await User.collection.createIndex({ role: 1 }, { name: 'role_index' });
            console.log('✅ Created index on role field');
        } else {
            console.log('⚠️ Index on role field already exists');
        }

        // Создаем индекс для поля uniqNumber, если он не существует
        if (!existingIndexNames.includes('uniqNumber_1')) {
            await User.collection.createIndex({ uniqNumber: 1 }, { name: 'uniqNumber_index' });
            console.log('✅ Created index on uniqNumber field');
        } else {
            console.log('⚠️ Index on uniqNumber field already exists');
        }

        // Создаем индекс для поля iin, если он не существует
        if (!existingIndexNames.includes('iin_1')) {
            await User.collection.createIndex({ iin: 1 }, { name: 'iin_index' });
            console.log('✅ Created index on iin field');
        } else {
            console.log('⚠️ Index on iin field already exists');
        }

        // Создаем индекс для поля groupId, если он не существует
        if (!existingIndexNames.includes('groupId_1')) {
            await User.collection.createIndex({ groupId: 1 }, { name: 'groupId_index' });
            console.log('✅ Created index on groupId field');
        } else {
            console.log('⚠️ Index on groupId field already exists');
        }

        // Создаем индекс для поля tenant, если он не существует
        if (!existingIndexNames.includes('tenant_1')) {
            await User.collection.createIndex({ tenant: 1 }, { name: 'tenant_index' });
            console.log('✅ Created index on tenant field');
        } else {
            console.log('⚠️ Index on tenant field already exists');
        }

        console.log('✅ Index verification completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating indexes:', error);
        process.exit(1);
    }
};

createIndexes();