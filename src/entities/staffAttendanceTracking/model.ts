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
  source?: string;           // Источник (telegram, web, app)
  telegramChatId?: string;
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  live?: boolean;           // Был ли использован Live Location
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
  status?: string;
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
  source: String,
  telegramChatId: String,
  latitude: Number,
  longitude: Number,
  accuracy: Number,
  live: Boolean,
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
  status: {
    type: String,
    enum: ['absent', 'scheduled', 'completed', 'in_progress', 'pending_approval', 'late', 'checked_in', 'checked_out', 'on_break', 'overtime'],
    default: undefined
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


// Пересчитываем Payroll и синхронизируем смены после сохранения
StaffAttendanceTrackingSchema.post('save', async function (this: IStaffAttendanceTracking) {
  try {
    const attendanceDate = this.date || new Date();
    // Используем sv-SE локаль для получения YYYY-MM-DD
    const dateStr = attendanceDate.toLocaleDateString('sv-SE', { timeZone: 'Asia/Almaty' });
    const period = dateStr.slice(0, 7);

    const { PayrollService } = await import('../payroll/service');
    const payrollService = new PayrollService();

    await payrollService.ensurePayrollForUser(this.staffId.toString(), period);

    console.log(`Payroll recalculated for staff ${this.staffId} period ${period} after attendance update`);

    // Синхронизация со статусом смены
    const ShiftModel = mongoose.model('Shift');
    const staffShifts = await ShiftModel.findOne({ staffId: this.staffId });

    if (staffShifts) {
      const shiftDetail = staffShifts.shifts.get(dateStr);
      if (shiftDetail) {
        let newStatus = shiftDetail.status;

        // Приоритет 1: Явный статус из записи посещаемости
        if (this.status) {
          const mapping: Record<string, string> = {
            'checked_out': 'completed',
            'completed': 'completed',
            'checked_in': 'in_progress',
            'in_progress': 'in_progress',
            'late': 'late',
            'absent': 'absent',
            'pending_approval': 'pending_approval'
          };
          if (mapping[this.status]) {
            newStatus = mapping[this.status] as any;
          }
        }
        // Приоритет 2: Автоматический расчет по временам
        else if (this.actualStart && this.actualEnd) {
          newStatus = 'completed';
        } else if (this.actualStart) {
          newStatus = (this.lateMinutes || 0) >= 15 ? 'late' : 'in_progress';
        }

        if (shiftDetail.status !== newStatus) {
          shiftDetail.status = newStatus as any;
          staffShifts.shifts.set(dateStr, shiftDetail);
          await staffShifts.save();
          console.log(`[SYNC-SHIFT-HOOK] Sync status for ${this.staffId} on ${dateStr}: ${newStatus}`);
        }
      }
    }
  } catch (error) {
    console.error('Error in post-save hook:', error);
  }
});


export default mongoose.model<IStaffAttendanceTracking>('StaffAttendanceTracking', StaffAttendanceTrackingSchema, 'staff_attendance_tracking');
