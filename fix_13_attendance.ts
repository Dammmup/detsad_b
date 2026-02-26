import mongoose from 'mongoose';
import * as dotenv from 'dotenv';

import * as path from 'path';
dotenv.config({ path: path.resolve(__dirname, '.env') });

async function fixAttendance() {
    await mongoose.connect(process.env.MONGO_URI!);

    const start = new Date('2026-02-01T00:00:00Z');
    const end = new Date('2026-02-28T23:59:59Z');

    const db = mongoose.connection.db;
    const tracking = db.collection('staff_attendance_tracking');
    const payrolls = db.collection('payrolls');

    const targetStaffId = new mongoose.Types.ObjectId('693f1415cbcaf05d27ffc207');

    const records = await tracking.find({
        staffId: targetStaffId,
        date: { $gte: start, $lte: end }
    }).toArray();

    console.log(`Found ${records.length} attendance records for user in February`);

    let updated = 0;
    for (const record of records) {
        let changed = false;
        const updates: any = {};

        if (record.actualStart) {
            const date = new Date(record.actualStart);
            if (date.getUTCHours() === 8) { // 8 UTC = 13:00 Almaty
                // subtract 5 hours to make it 03:00 UTC = 08:00 Almaty
                date.setUTCHours(date.getUTCHours() - 5);
                updates.actualStart = date;
                updates.lateMinutes = 0;
                changed = true;
            }
        }

        if (record.actualEnd) {
            const date = new Date(record.actualEnd);
            if (date.getUTCHours() === 13) { // 13 UTC = 18:00 Almaty
                date.setUTCHours(date.getUTCHours() - 5);
                updates.actualEnd = date;
                updates.earlyLeaveMinutes = 0;
                changed = true;
            } else if (date.getUTCHours() === 18) { // if they put 18:00 resulting in 23:00?
                date.setUTCHours(date.getUTCHours() - 5);
                updates.actualEnd = date;
                updates.earlyLeaveMinutes = 0;
                changed = true;
            }
        }

        if (changed) {
            await tracking.updateOne({ _id: record._id }, { $set: updates });
            updated++;
        }
    }

    console.log(`Fixed times for ${updated} records!`);

    // reset payroll
    console.log('Cleaning up old payrolls...');
    await payrolls.deleteMany({ staffId: targetStaffId, period: '2026-02' });

    await mongoose.disconnect();
}
fixAttendance();
