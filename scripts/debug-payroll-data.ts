
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import User from '../src/entities/users/model';
import StaffAttendanceTracking from '../src/entities/staffAttendanceTracking/model';
import Payroll from '../src/entities/payroll/model';
// import { shouldCountAttendance } from '../src/services/payrollAutomationService';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGO_URI || 'mongodb+srv://damir:damir@cluster0.ku60i6n.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0';

const shouldCountAttendance = (record: any): boolean => {
    return !!record.actualStart;
};

async function run() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to DB');

        // Find a user involved in payroll (e.g., teacher)
        const user = await User.findOne({ role: 'teacher', active: true }) as any;
        if (!user) {
            console.log('No teacher found');
            return;
        }
        console.log(`Analyzing user: ${user.fullName} (${user._id})`);

        const period = '2026-01'; // User complaint is likely recent
        const startDate = new Date(`${period}-01T00:00:00+05:00`);
        const year = startDate.getFullYear();
        const monthIdx = startDate.getMonth();
        const lastDay = new Date(year, monthIdx + 1, 0).getDate();
        const endDate = new Date(`${period}-${String(lastDay).padStart(2, '0')}T23:59:59.999+05:00`);

        console.log(`Period: ${period}`);
        console.log(`Start Date: ${startDate.toISOString()}`);
        console.log(`End Date: ${endDate.toISOString()}`);

        const attendanceRecords = await StaffAttendanceTracking.find({
            staffId: user._id,
            date: { $gte: startDate, $lte: endDate }
        }).sort({ date: 1 });

        console.log(`Found ${attendanceRecords.length} attendance records:`);
        let counted = 0;
        attendanceRecords.forEach((rec: any) => {
            const include = shouldCountAttendance(rec);
            if (include) counted++;
            console.log(` - Date: ${rec.date}, ActualStart: ${rec.actualStart}, Counted: ${include}`);
        });
        console.log(`Total Counted by Logic: ${counted}`);

        const payroll = await Payroll.findOne({ staffId: user._id, period }) as any;
        if (payroll) {
            console.log('Payroll Record:');
            console.log(` - Worked Days: ${payroll.workedDays}`);
            console.log(` - Worked Shifts: ${payroll.workedShifts}`);
            console.log(` - Norm Days: ${payroll.normDays || 'N/A'}`);
            console.log(` - Total: ${payroll.total}`);
        } else {
            console.log('No Payroll record found for this period.');
        }

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

run();
