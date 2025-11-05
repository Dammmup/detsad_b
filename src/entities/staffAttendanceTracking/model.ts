import mongoose, { Schema, Document } from 'mongoose';
import { createModelFactory } from '../../config/database';

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
  shiftId?: mongoose.Types.ObjectId; // Ссылка на смену
  date: Date;
 actualStart?: Date;
  groupId?: mongoose.Types.ObjectId;
  actualEnd?: Date;
 workDuration?: number; // minutes
  breakDuration?: number; // minutes
  overtimeDuration?: number; // minutes
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
  // Fields from timeTracking
  clockInLocation?: ILocation;
  clockOutLocation?: ILocation;
  photoClockIn?: string; // URL to photo taken during clock-in
 photoClockOut?: string; // URL to photo taken during clock-out
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
  // Fields from timeTracking
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

// Pre-save middleware to calculate hours
StaffAttendanceTrackingSchema.pre('save', function(this: IStaffAttendanceTracking, next) {
  if (this.actualStart && this.actualEnd) {
    const totalMs = this.actualEnd.getTime() - this.actualStart.getTime();
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
  }
 next();
});



// Создаем фабрику модели для отложенного создания модели после подключения к базе данных
const createStaffAttendanceTrackingModel = createModelFactory<IStaffAttendanceTracking>(
  'StaffAttendanceTracking',
  StaffAttendanceTrackingSchema,
  'staff_attendance_tracking',
  'default'
);

// Экспортируем фабрику, которая будет создавать модель после подключения
export default createStaffAttendanceTrackingModel;