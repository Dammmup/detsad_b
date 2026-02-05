
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

        const dateObj = new Date('2026-02-02T00:00:00.000Z');
        const attendance = await StaffAttendanceTracking.findOne({
            staffId: aisha._id,
            date: dateObj
        });

        if (attendance) {
            console.log('Found attendance record. Saving it to trigger hook...');
            // Manually set status to completed to be sure
            attendance.status = 'completed';
            await attendance.save();
            console.log('Saved.');
        } else {
            console.log('Attendance record not found.');
        }

        // Check Shift status again
        const shiftDoc = await Shift.findOne({ staffId: aisha._id }) as any;
        if (shiftDoc) {
            const dateStr = '2026-02-02';
            if (shiftDoc.shifts.has(dateStr)) {
                const detail = shiftDoc.shifts.get(dateStr);
                console.log(`New status in Shifts for ${dateStr}: ${detail.status}`);
            }
        }

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

run();
