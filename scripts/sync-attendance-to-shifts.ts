import mongoose from 'mongoose';
import { connectDB } from '../src/config/database';
import StaffAttendanceTracking from '../src/entities/staffAttendanceTracking/model';
import Shift from '../src/entities/staffShifts/model';
import moment from 'moment';

const syncAttendanceToShifts = async () => {
  try {
    console.log('🚀 Starting synchronization of attendance statuses to shifts...');
    await connectDB();
    console.log('✅ Database connection established.');

    const startDate = moment().subtract(30, 'days').startOf('day').toDate();
    const endDate = moment().endOf('day').toDate();

    console.log(`
🔍 Fetching attendance records from ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}...`);

    const attendanceRecords = await StaffAttendanceTracking.find({
      date: { $gte: startDate, $lte: endDate }
    }).sort({ staffId: 1, date: 1 });

    console.log(`Found ${attendanceRecords.length} attendance records to process.`);

    if (attendanceRecords.length === 0) {
      console.log('No records to process. Exiting.');
      return;
    }

    // Group records by staffId
    const recordsByStaff = attendanceRecords.reduce((acc, record) => {
      const staffId = record.staffId.toString();
      if (!acc[staffId]) {
        acc[staffId] = [];
      }
      acc[staffId].push(record);
      return acc;
    }, {} as Record<string, any[]>);

    let updatedShiftsCount = 0;
    let updatedStaffCount = 0;

    for (const staffId in recordsByStaff) {
      console.log(`
Processing staff ID: ${staffId}...`);
      const staffShifts = await Shift.findOne({ staffId: staffId });

      if (!staffShifts) {
        console.log(`  - ⚠️ No shift document found for staff. Skipping.`);
        continue;
      }

      let isModified = false;
      const records = recordsByStaff[staffId];

      for (const record of records) {
        const dateStr = moment(record.date).format('YYYY-MM-DD');
        const shiftDetail = staffShifts.shifts.get(dateStr);

        if (shiftDetail) {
          let newStatus = shiftDetail.status;

          if (record.status) {
            const mapping: Record<string, string> = {
              'checked_out': 'completed',
              'completed': 'completed',
              'checked_in': 'in_progress',
              'in_progress': 'in_progress',
              'late': 'late',
              'absent': 'absent',
              'pending_approval': 'pending_approval'
            };
            if (mapping[record.status]) {
              newStatus = mapping[record.status] as any;
            }
          } else if (record.actualStart && record.actualEnd) {
            newStatus = 'completed';
          } else if (record.actualStart) {
            newStatus = (record.lateMinutes || 0) >= 15 ? 'late' : 'in_progress';
          }

          if (shiftDetail.status !== newStatus) {
            console.log(`  - Syncing date ${dateStr}: '${shiftDetail.status}' -> '${newStatus}'`);
            shiftDetail.status = newStatus as any;
            staffShifts.shifts.set(dateStr, shiftDetail);
            isModified = true;
            updatedShiftsCount++;
          }
        }
      }

      if (isModified) {
        await staffShifts.save();
        console.log(`  - ✅ Saved changes for staff.`);
        updatedStaffCount++;
      } else {
        console.log(`  - No changes needed for staff.`);
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('🎉 Synchronization completed successfully!');
    console.log(`- Staff documents updated: ${updatedStaffCount}`);
    console.log(`- Total shifts synchronized: ${updatedShiftsCount}`);

  } catch (error) {
    console.error('❌ An error occurred during synchronization:', error);
  } finally {
    await mongoose.connection.close();
    console.log('✅ Database connection closed.');
    process.exit(0);
  }
};

if (require.main === module) {
  syncAttendanceToShifts();
}
