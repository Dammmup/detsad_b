import mongoose, { Schema, Document } from 'mongoose';

export interface ILocation {
  name: string;
  radius: number; // meters
  timestamp: Date;
  coordinates: {
    latitude: number;
    longitude: number;
  };
}

export interface IStaffAttendanceTracking extends Document {
  staffId: mongoose.Types.ObjectId;
  date: Date;
 checkInTime?: Date;
 groupId: mongoose.Types.ObjectId;
  checkOutTime?: Date;
 workDuration?: number; // minutes
  breakDuration?: number; // minutes
  overtimeDuration?: number; // minutes
  status: 'active' | 'completed' | 'on_break' | 'overtime' | 'absent' | 'checked_in' | 'checked_out' | 'missed' | 'pending_approval';
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
  // Fields from timeTracking
  clockInLocation?: ILocation;
  clockOutLocation?: ILocation;
  photoClockIn?: string; // URL to photo taken during clock-in
  photoClockOut?: string; // URL to photo taken during clock-out
  breakStart?: Date;
  breakEnd?: Date;
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
  groupId:{
    type: Schema.Types.ObjectId,
    ref: 'Groups',
    required:false
},
  date: {
    type: Date,
    required: true,
    index: true
  },
  checkInTime: Date,
  checkOutTime: Date,
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
  status: {
    type: String,
    enum: ['active', 'completed', 'absent', 'checked_in', 'checked_out', 'missed', 'pending_approval'],
    default: 'absent',
    index: true
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
  // Fields from timeTracking
  clockInLocation: LocationSchema,
  clockOutLocation: LocationSchema,
  photoClockIn: String,
 photoClockOut: String,
  breakStart: Date,
  breakEnd: Date,
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

// Pre-save middleware to calculate hours
StaffAttendanceTrackingSchema.pre('save', function(this: IStaffAttendanceTracking, next) {
  if (this.checkInTime && this.checkOutTime) {
    const totalMs = this.checkOutTime.getTime() - this.checkInTime.getTime();
    let totalMinutes = Math.floor(totalMs / (1000 * 60));
    
    // Subtract break duration
    if (this.breakDuration) {
      totalMinutes -= this.breakDuration;
    }
    
    this.totalHours = Math.max(0, totalMinutes / 60);
    
    // Calculate regular vs overtime (assuming 8-hour standard)
    const standardHours = 8;
    this.regularHours = Math.min(this.totalHours, standardHours);
    this.overtimeHours = Math.max(0, this.totalHours - standardHours);
    
    // Update status if completed, but only if it's not already set to a final status
    const finalStatuses = ['completed', 'missed', 'pending_approval'];
    if (this.checkOutTime && !finalStatuses.includes(this.status)) {
      // Only update status if it's one of the in-progress statuses
      if (this.status === 'active' || this.status === 'checked_in' || this.status === 'on_break') {
        this.status = 'completed';
      }
    }
  }
  next();
});



export default mongoose.model<IStaffAttendanceTracking>('StaffAttendanceTracking', StaffAttendanceTrackingSchema, 'staff_attendance_tracking');