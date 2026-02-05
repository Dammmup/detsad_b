
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import User from '../src/entities/users/model';
import StaffAttendanceTracking from '../src/entities/staffAttendanceTracking/model';
import Shift from '../src/entities/staffShifts/model';
import Payroll from '../src/entities/payroll/model';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGO_URI || 'mongodb+srv://damir:damir@cluster0.ku60i6n.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0';

async function run() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to DB');

        const staffId = '693f1413cbcaf05d27ffc1fa';
        const user = await User.findById(staffId) as any;
        if (!user) {
            console.log('User not found');
            return;
        }
        console.log(`Analyzing user: ${user.fullName} (${user._id})`);

        const period = '2026-01';
        const startDate = new Date(`${period}-01T00:00:00+05:00`);
        const year = startDate.getFullYear();
        const monthIdx = startDate.getMonth();
        const lastDay = new Date(year, monthIdx + 1, 0).getDate();
        const endDate = new Date(`${period}-${String(lastDay).padStart(2, '0')}T23:59:59.999+05:00`);

        console.log(`Period: ${period}`);
        console.log(`Start Date (ISO): ${startDate.toISOString()}`);
        console.log(`End Date (ISO): ${endDate.toISOString()}`);

        console.log('\n--- ATTENDANCE RECORDS (StaffAttendanceTracking) ---');
        const attendanceRecords = await StaffAttendanceTracking.find({
            staffId: user._id,
            date: { $gte: startDate, $lte: endDate }
        }).sort({ date: 1 });

        attendanceRecords.forEach((r: any) => {
            console.log(` - Date: ${r.date.toISOString()}, Start: ${r.actualStart?.toISOString()}, End: ${r.actualEnd?.toISOString()}, Status: ${r.status}`);
        });
        console.log(`Total Attendance Records: ${attendanceRecords.length}`);

        console.log('\n--- SHIFTS (Shift Model) ---');
        const shiftDoc = await Shift.findOne({ staffId: user._id }) as any;
        let shiftCount = 0;
        if (shiftDoc) {
            shiftDoc.shifts.forEach((detail: any, dateStr: string) => {
                if (dateStr.startsWith(period)) {
                    const status = detail.status;
                    const isWorked = status === 'completed' || status === 'late';
                    if (isWorked) shiftCount++;
                    console.log(` - Date: ${dateStr}, Status: ${status}, IsWorked (Shifts UI): ${isWorked}`);
                }
            });
        }
        console.log(`Total Worked Shifts (by status): ${shiftCount}`);

        console.log('\n--- PAYROLL RECORD ---');
        const payroll = await Payroll.findOne({ staffId: user._id, period }) as any;
        if (payroll) {
            console.log(` - Worked Days (Payroll): ${payroll.workedDays}`);
            console.log(` - Accruals: ${payroll.accruals}`);
            console.log(` - Total: ${payroll.total}`);
        } else {
            console.log('No Payroll record found.');
        }

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

run();
