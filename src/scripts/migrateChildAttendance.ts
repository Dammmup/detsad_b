import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const MONGODB_URI = process.env.MONGO_URI || 'mongodb+srv://admin:admin@balbobek.5onsh.mongodb.net/childcheck?retryWrites=true&w=majority&appName=balbobek';

async function migrateChildAttendance() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        const db = mongoose.connection.db;
        const collections = await db.listCollections({ name: 'childattendances' }).toArray();

        if (collections.length === 0) {
            console.log('Collection childattendances not found');
            return;
        }

        // Backup
        const backupName = `childattendances_backup_${Date.now()}`;
        await db.collection('childattendances').aggregate([{ $out: backupName }]).toArray();
        console.log(`Backup created: ${backupName}`);

        const oldRecords = await db.collection('childattendances').find({}).toArray();
        console.log(`Found ${oldRecords.length} records to migrate`);

        // Group by childId
        const grouped = new Map<string, any[]>();
        for (const record of oldRecords) {
            const cid = record.childId.toString();
            if (!grouped.has(cid)) grouped.set(cid, []);
            grouped.get(cid)!.push(record);
        }

        console.log(`Grouped into ${grouped.size} children`);

        let migratedChildren = 0;
        let migratedRecords = 0;

        for (const [childId, records] of grouped) {
            const attendanceMap = new Map();

            for (const record of records) {
                if (!record.date) continue;

                const dateStr = new Date(record.date).toISOString().split('T')[0];
                attendanceMap.set(dateStr, {
                    groupId: record.groupId,
                    status: record.status || 'absent',
                    actualStart: record.actualStart,
                    actualEnd: record.actualEnd,
                    notes: record.notes,
                    markedBy: record.markedBy,
                    createdAt: record.createdAt || new Date(),
                    updatedAt: record.updatedAt || new Date()
                });
                migratedRecords++;
            }

            await db.collection('childattendances_new').updateOne(
                { childId: new mongoose.Types.ObjectId(childId) },
                {
                    $set: {
                        attendance: Object.fromEntries(attendanceMap),
                        updatedAt: new Date()
                    },
                    $setOnInsert: {
                        createdAt: new Date()
                    }
                },
                { upsert: true }
            );
            migratedChildren++;
        }

        console.log(`Migration to temporary collection completed: ${migratedRecords} records across ${migratedChildren} children`);

        // Replace collection
        await db.collection('childattendances').drop();
        await db.collection('childattendances_new').rename('childattendances');
        console.log('Collection replaced successfully');

        // Create unique index
        await db.collection('childattendances').createIndex({ childId: 1 }, { unique: true });
        console.log('Unique index on childId created');

    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await mongoose.disconnect();
    }
}

migrateChildAttendance();
