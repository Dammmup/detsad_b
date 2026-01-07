
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import StaffAttendanceTracking from './src/entities/staffAttendanceTracking/model';
import User from './src/entities/users/model';

dotenv.config();

async function run() {
    await mongoose.connect(process.env.MONGO_URI!);
    console.log('Connected to DB');

    const start = new Date('2026-01-06T19:00:00Z');
    const end = new Date('2026-01-07T19:00:00Z');

    const attendance = await StaffAttendanceTracking.find({
        date: { $gte: start, $lte: end }
    }).populate('staffId', 'fullName');

    console.log('TODAY_RECORDS:', JSON.stringify(attendance.map(r => ({
        name: (r.staffId as any)?.fullName,
        date: r.date,
        late: r.lateMinutes,
        penalties: r.penalties
    })), null, 2));

    process.exit(0);
}

run().catch(err => {
    console.error(err);
    process.exit(1);
});
