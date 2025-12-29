import mongoose, { Schema, Document } from 'mongoose';

export interface IStaffAttendanceTracking extends Document {
  staffId: mongoose.Types.ObjectId;
  shiftId?: mongoose.Types.ObjectId;
  date: Date;
  actualStart?: Date;
  actualEnd?: Date;
  workDuration?: number; // в минутах
  breakDuration?: number; // в минутах
  overtimeDuration?: number; // в минутах
  lateMinutes?: number;
  earlyLeaveMinutes?: number;
  notes?: string;
  isManualEntry: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const StaffAttendanceTrackingSchema = new Schema<IStaffAttendanceTracking>({
  staffId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  shiftId: {
    type: Schema.Types.ObjectId,
    ref: 'Shift',
    required: false
  },
  date: {
    type: Date,
    required: true,
    index: true
  },
  actualStart: Date,
  actualEnd: Date,
  workDuration: {
    type: Number,
    default: 0
  },
  breakDuration: {
    type: Number,
    default: 0
  },
  overtimeDuration: {
    type: Number,
    default: 0
  },
  lateMinutes: {
    type: Number,
    default: 0
  },
  earlyLeaveMinutes: {
    type: Number,
    default: 0
  },
  notes: {
    type: String,
    maxlength: [500, 'Заметки не могут превышать 500 символов']
  },
  isManualEntry: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Enforce unique attendance record per staff per day
StaffAttendanceTrackingSchema.index({ staffId: 1, date: 1 }, { unique: true });


// Рассчитываем workDuration при сохранении
StaffAttendanceTrackingSchema.pre('save', function (this: IStaffAttendanceTracking, next) {
  if (this.actualStart && this.actualEnd) {
    const totalMs = this.actualEnd.getTime() - this.actualStart.getTime();
    let totalMinutes = Math.floor(totalMs / (1000 * 60));

    if (this.breakDuration) {
      totalMinutes -= this.breakDuration;
    }

    this.workDuration = Math.max(0, totalMinutes);
  }
  next();
});


// Пересчитываем Payroll после сохранения
StaffAttendanceTrackingSchema.post('save', async function (this: IStaffAttendanceTracking) {
  try {
    const attendanceDate = this.date || new Date();
    const period = `${attendanceDate.getFullYear()}-${String(attendanceDate.getMonth() + 1).padStart(2, '0')}`;

    const { PayrollService } = await import('../payroll/service');
    const payrollService = new PayrollService();

    await payrollService.ensurePayrollForUser(this.staffId.toString(), period);

    console.log(`Payroll recalculated for staff ${this.staffId} period ${period} after attendance update`);
  } catch (error) {
    console.error('Error recalculating payroll after attendance save:', error);
  }
});


export default mongoose.model<IStaffAttendanceTracking>('StaffAttendanceTracking', StaffAttendanceTrackingSchema, 'staff_attendance_tracking');
