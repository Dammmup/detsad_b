import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import * as path from 'path';
import Shift from './src/entities/staffShifts/model';
import StaffAttendanceTracking from './src/entities/staffAttendanceTracking/model';

dotenv.config({ path: path.resolve(__dirname, '.env') });

async function run() {
    await mongoose.connect(process.env.MONGO_URI!);

    // 1. Remove Sunday shifts from the map for everyone
    const allShifts = await Shift.find({});
    let shiftCleaned = 0;

    for (const doc of allShifts) {
        let changed = false;
        const keys = Array.from(doc.shifts.keys());
        for (const dateStr of keys) {
            if (dateStr.startsWith('2026-02')) {
                const date = new Date(dateStr);
                // 0 is Sunday
                if (date.getDay() === 0) {
                    console.log(`Removing Sunday shift ${dateStr} for staff ${doc.staffId}`);
                    doc.shifts.delete(dateStr);
                    changed = true;
                }
            }
        }
        if (changed) {
            await doc.save();
            shiftCleaned++;
        }
    }

    // 2. Remove Sunday attendance records for everyone in Feb
    const febStart = new Date('2026-02-01T00:00:00+05:00');
    const febEnd = new Date('2026-02-28T23:59:59+05:00');

    const attendanceRecords = await StaffAttendanceTracking.find({
        date: { $gte: febStart, $lte: febEnd }
    });

    let attendanceDeleted = 0;
    for (const record of attendanceRecords) {
        const almatyDate = new Date(record.date).toLocaleDateString('sv-SE', { timeZone: 'Asia/Almaty' });
        const date = new Date(almatyDate);
        if (date.getDay() === 0) {
            console.log(`Deleting Sunday attendance record ${almatyDate} for staff ${record.staffId}`);
            await StaffAttendanceTracking.deleteOne({ _id: record._id });
            attendanceDeleted++;
        }
    }

    console.log(`\nCleanup Finished!`);
    console.log(`Shifts cleaned: ${shiftCleaned}`);
    console.log(`Attendance records deleted: ${attendanceDeleted}`);

    // 3. Trigger global recalculation
    const { PayrollService } = await import('./src/entities/payroll/service');
    const service = new PayrollService();
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');
    const staff = await usersCollection.find({ role: { $ne: 'admin' }, active: true }).toArray();

    console.log(`Recalculating ${staff.length} payrolls...`);
    for (const employee of staff) {
        await service.ensurePayrollForUser(employee._id.toString(), '2026-02', true);
    }

    await mongoose.disconnect();
}
run().catch(console.error);
