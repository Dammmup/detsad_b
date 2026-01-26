import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { getDatabase } from '../config/mongo';

// Load env
dotenv.config({ path: path.join(__dirname, '../../.env') });

async function migrate() {
    console.log('Starting migration...');
    const db = await getDatabase();
    console.log('Connected to MongoDB');

    const oldShiftsCollection = db.collection('shifts');
    const backupCollectionName = `shifts_backup_${Date.now()}`;

    console.log(`Backing up shifts to ${backupCollectionName}...`);
    await oldShiftsCollection.aggregate([{ $out: backupCollectionName }]).toArray();

    const allOldShifts = await oldShiftsCollection.find({}).toArray();
    console.log(`Found ${allOldShifts.length} old shift records`);

    const staffShiftsMap = new Map<string, any>();

    for (const shift of allOldShifts) {
        // Some old shifts might not have staffId or date due to data issues, skip them
        if (!shift.staffId || !shift.date) {
            console.warn('Skipping invalid shift:', shift._id);
            continue;
        }

        const staffIdStr = shift.staffId.toString();
        if (!staffShiftsMap.has(staffIdStr)) {
            staffShiftsMap.set(staffIdStr, {
                staffId: shift.staffId,
                shifts: {},
                createdAt: new Date(),
                updatedAt: new Date()
            });
        }

        const staffRecord = staffShiftsMap.get(staffIdStr);

        // Key by date
        staffRecord.shifts[shift.date] = {
            status: shift.status || 'scheduled',
            notes: shift.notes || '',
            createdBy: shift.createdBy,
            alternativeStaffId: shift.alternativeStaffId,
            createdAt: shift.createdAt || new Date(),
            updatedAt: shift.updatedAt || new Date()
        };
    }

    console.log(`Grouped into ${staffShiftsMap.size} staff records`);

    // Clear original collection
    await oldShiftsCollection.deleteMany({});
    console.log('Cleared original shifts collection');

    // Insert new records
    const newRecords = Array.from(staffShiftsMap.values());
    if (newRecords.length > 0) {
        await oldShiftsCollection.insertMany(newRecords);
        console.log(`Successfully inserted ${newRecords.length} staff records`);
    }

    // Note: In serverless environments, we typically don't disconnect
    // as the connection is managed by the connection pool
    console.log('Migration completed successfully');
}

migrate().catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
});
