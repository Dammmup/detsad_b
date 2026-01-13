import mongoose, { Schema, Document } from 'mongoose';

export interface IDeviceMetadata {
  userAgent?: string;
  platform?: string;
  language?: string;
  screenResolution?: string;
  timezone?: string;
  deviceType?: 'mobile' | 'tablet' | 'desktop';
  deviceModel?: string;  // Модель устройства (iPhone 12, Samsung Galaxy S21 и т.д.)
  browser?: string;      // Браузер (Chrome, Safari, Firefox и т.д.)
  os?: string;           // Операционная система
  ipAddress?: string;
}

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
  checkInDevice?: IDeviceMetadata;
  checkOutDevice?: IDeviceMetadata;
  createdAt: Date;
  updatedAt: Date;
}

const DeviceMetadataSchema = new Schema({
  userAgent: String,
  platform: String,
  language: String,
  screenResolution: String,
  timezone: String,
  deviceType: {
    type: String,
    enum: ['mobile', 'tablet', 'desktop']
  },
  deviceModel: String,
  browser: String,
  os: String,
  ipAddress: String,
}, { _id: false });

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
  },
  checkInDevice: DeviceMetadataSchema,
  checkOutDevice: DeviceMetadataSchema,
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
