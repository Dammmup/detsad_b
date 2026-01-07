
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/entities/users/model';
import Shift from './src/entities/staffShifts/model';
import StaffAttendanceTracking from './src/entities/staffAttendanceTracking/model';

dotenv.config();

async function run() {
    await mongoose.connect(process.env.MONGO_URI!.replace('/?', '/det_sad?'));
    console.log('Connected to DB');

    const samal = await User.findOne({ fullName: /Самал/i });
    if (!samal) {
        console.log('Samal not found');
        process.exit(0);
    }

    console.log('Samal ID:', samal._id);
    console.log('Samal Name:', samal.fullName);
    console.log('Samal Salary:', samal.baseSalary);

    const shifts = await Shift.findOne({ staffId: samal._id });
    console.log('Shifts Found:', shifts ? 'Yes' : 'No');
    if (shifts) {
        console.log('Jan 7 Shift:', shifts.shifts.get('2026-01-07'));
    }

    const attendance = await StaffAttendanceTracking.find({
        staffId: samal._id
    }).sort({ date: -1 }).limit(10);
    console.log('Attendance Records:', JSON.stringify(attendance, null, 2));

    process.exit(0);
}

run().catch(err => {
    console.error(err);
    process.exit(1);
});
