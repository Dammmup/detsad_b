import mongoose, { Schema, Document } from 'mongoose';
export interface ILocation {
  name: string;
  radius: number;
  timestamp: Date;
  coordinates: {
    latitude: number;
    longitude: number;
  };
}

export interface IStaffAttendanceTracking extends Document {
  staffId: mongoose.Types.ObjectId;
  shiftId?: mongoose.Types.ObjectId;
  date: Date;
  actualStart?: Date;
  groupId?: mongoose.Types.ObjectId;
  actualEnd?: Date;
  workDuration?: number;
  breakDuration?: number;
  overtimeDuration?: number;
  lateMinutes?: number;
  earlyLeaveMinutes?: number;
  penalties: {
    late: {
      minutes: number;
      amount: number;
      reason?: string;
    };
    earlyLeave: {
      minutes: number;
      amount: number;
      reason?: string;
    };
    unauthorized: {
      amount: number;
      reason?: string;
    };
  };
  bonuses: {
    overtime: {
      minutes: number;
      amount: number;
    };
    punctuality: {
      amount: number;
      reason?: string;
    };
  };
  notes?: string;
  attachments?: string[];
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  inZone?: boolean;

  clockInLocation?: ILocation;
  clockOutLocation?: ILocation;
  photoClockIn?: string;
  photoClockOut?: string;
  totalHours: number;
  regularHours: number;
  overtimeHours: number;
  approvedAtTimeTracking?: Date;
  approvedByTimeTracking?: mongoose.Types.ObjectId;
  isManualEntry: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const LocationSchema = new Schema({
  name: { type: String, required: true },
  radius: { type: Number, required: true, default: 100 },
  timestamp: { type: Date, default: Date.now },
  coordinates: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true }
  }
});

const StaffAttendanceTrackingSchema = new Schema<IStaffAttendanceTracking>({
  staffId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  groupId: {
    type: Schema.Types.ObjectId,
    ref: 'Groups',
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
  penalties: {
    late: {
      minutes: { type: Number, default: 0 },
      amount: { type: Number, default: 0 },
      reason: String
    },
    earlyLeave: {
      minutes: { type: Number, default: 0 },
      amount: { type: Number, default: 0 },
      reason: String
    },
    unauthorized: {
      amount: { type: Number, default: 0 },
      reason: String
    }
  },
  bonuses: {
    overtime: {
      minutes: { type: Number, default: 0 },
      amount: { type: Number, default: 0 }
    },
    punctuality: {
      amount: { type: Number, default: 0 },
      reason: String
    }
  },
  notes: {
    type: String,
    maxlength: [500, 'Заметки не могут превышать 500 символов']
  },
  attachments: [String],
  approvedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: Date,
  inZone: {
    type: Boolean,
    default: false,
    index: true
  },

  clockInLocation: LocationSchema,
  clockOutLocation: LocationSchema,
  photoClockIn: String,
  photoClockOut: String,
  totalHours: {
    type: Number,
    default: 0,
    min: 0,
    max: 24
  },
  regularHours: {
    type: Number,
    default: 0,
    min: 0
  },
  overtimeHours: {
    type: Number,
    default: 0,
    min: 0
  },
  approvedAtTimeTracking: Date,
  approvedByTimeTracking: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  isManualEntry: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});


StaffAttendanceTrackingSchema.pre('save', function (this: IStaffAttendanceTracking, next) {
  if (this.actualStart && this.actualEnd) {
    const totalMs = this.actualEnd.getTime() - this.actualStart.getTime();
    let totalMinutes = Math.floor(totalMs / (1000 * 60));


    if (this.breakDuration) {
      totalMinutes -= this.breakDuration;
    }

    this.totalHours = Math.max(0, totalMinutes / 60);


    const standardHours = 8;
    this.regularHours = Math.min(this.totalHours, standardHours);
    this.overtimeHours = Math.max(0, this.totalHours - standardHours);
  }
  next();
});


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