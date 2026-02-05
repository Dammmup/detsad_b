
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import StaffAttendanceTracking from '../src/entities/staffAttendanceTracking/model';
import Shift from '../src/entities/staffShifts/model';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGO_URI || 'mongodb+srv://damir:damir@cluster0.ku60i6n.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0';

async function run() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to DB');

        const startDate = new Date('2026-02-01T00:00:00+05:00');
        const endDate = new Date('2026-02-28T23:59:59+05:00');

        console.log(`Syncing records from ${startDate.toISOString()} to ${endDate.toISOString()}`);

        const records = await StaffAttendanceTracking.find({
            date: { $gte: startDate, $lte: endDate }
        });

        console.log(`Found ${records.length} records to sync.`);

        for (const record of records) {
            // Trigger the post-save hook by saving
            // The hook logic handles status calculation if record.status is undefined
            try {
                await record.save();
                process.stdout.write('.');
            } catch (e) {
                console.error(`\nError saving record ${record._id}:`, e);
            }
        }

        console.log('\nSync completed.');

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

run();
