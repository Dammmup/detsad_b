
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import User from '../src/entities/users/model';
import StaffAttendanceTracking from '../src/entities/staffAttendanceTracking/model';
import Shift from '../src/entities/staffShifts/model';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGO_URI || 'mongodb+srv://damir:damir@cluster0.ku60i6n.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0';

async function run() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to DB');

        const aisha = await User.findOne({ fullName: /Айша/i });
        if (!aisha) {
            console.log('Aisha not found');
            return;
        }
        console.log(`Analyzing user: ${aisha.fullName} (${aisha._id})`);

        const startDate = new Date('2026-02-01T00:00:00+05:00');
        const endDate = new Date('2026-02-28T23:59:59+05:00');

        console.log('\n--- ATTENDANCE RECORDS (StaffAttendanceTracking) ---');
        const attendances = await StaffAttendanceTracking.find({
            staffId: aisha._id,
            date: { $gte: startDate, $lte: endDate }
        }).sort({ date: 1 });

        if (attendances.length > 0) {
            attendances.forEach(a => {
                const dateOnly = a.date.toISOString().slice(0, 10);
                console.log(` - Date: ${dateOnly} (${a.date.toISOString()}), Start: ${a.actualStart?.toISOString()}, End: ${a.actualEnd?.toISOString()}, Status: ${a.status}`);
            });
        } else {
            console.log('No attendance records found for February');
        }

        console.log('\n--- SHIFT (Shift Model) ---');
        const shiftDoc = await Shift.findOne({ staffId: aisha._id }) as any;
        if (shiftDoc) {
            const dateStr = '2026-02-02';
            if (shiftDoc.shifts.has(dateStr)) {
                const detail = shiftDoc.shifts.get(dateStr);
                console.log(` - Date: ${dateStr}`);
                console.log(` - Status in Shifts: ${detail.status}`);
            } else {
                console.log(`Shift detail not found for ${dateStr}`);
            }
        } else {
            console.log('Shift document not found for Aisha');
        }

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

run();
