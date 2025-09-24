import mongoose, { Schema, Document } from 'mongoose';

export interface IStaffAttendance extends Document {
  staffId: mongoose.Types.ObjectId;
  groupId?: mongoose.Types.ObjectId;
  date: Date;
  shiftType:  'full' | 'overtime';
  startTime: string; // HH:MM format
  endTime: string;   // HH:MM format
  actualStart?: string;   // HH:MM format
  actualEnd?: string;     // HH:MM format
  breakTime?: number;     // minutes
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'no_show' | 'late';
  lateMinutes?: number;
  overtimeMinutes?: number;
  earlyLeaveMinutes?: number;
  location?: {
    checkIn?: {
      address?: string;
    };
    checkOut?: {
      address?: string;
    };
  };
  notes?: string;
  markedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const StaffAttendanceSchema: Schema = new Schema({
  staffId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  groupId: {
    type: Schema.Types.ObjectId,
    ref: 'Group',
    required: false
  },
  date: {
    type: Date,
    required: true
  },
  shiftType: {
    type: String,
    enum: ['full', 'day_off', 'vacation', 'sick_leave', 'overtime'],
    required: true,
    default: 'full'
  },
  startTime: {
    type: String,
    required: true,
    match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
  },
  endTime: {
    type: String,
    required: true,
    match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
  },
  actualStart: {
    type: String,
    match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
  },
  actualEnd: {
    type: String,
    match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
  },
  breakTime: {
    type: Number,
    default: 0,
    min: 0
  },
  status: {
    type: String,
    enum: ['scheduled', 'in_progress', 'completed', 'cancelled', 'no_show', 'late'],
    required: true,
    default: 'scheduled'
  },
  lateMinutes: {
    type: Number,
    default: 0,
    min: 0
  },
  overtimeMinutes: {
    type: Number,
    default: 0,
    min: 0
  },
  earlyLeaveMinutes: {
    type: Number,
    default: 0,
    min: 0
  },
  location: {
    checkIn: {
      address: String
    },
    checkOut: {
      address: String
    }
  },
  notes: String,
  markedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Indexes for better performance
StaffAttendanceSchema.index({ staffId: 1, date: 1 }, { unique: true });
StaffAttendanceSchema.index({ date: 1 });
StaffAttendanceSchema.index({ groupId: 1 });
StaffAttendanceSchema.index({ status: 1 });
StaffAttendanceSchema.index({ shiftType: 1 });
StaffAttendanceSchema.index({ markedBy: 1 });

// Virtual fields for calculations
StaffAttendanceSchema.virtual('workMinutes').get(function(this: IStaffAttendance) {
  if (!this.actualStart || !this.actualEnd) return 0;
  
  const start = (this.actualStart as string).split(':').map(Number);
  const end = (this.actualEnd as string).split(':').map(Number);
  
  const startMinutes = start[0] * 60 + start[1];
  const endMinutes = end[0] * 60 + end[1];
  
  return Math.max(0, endMinutes - startMinutes - (this.breakTime || 0));
});

StaffAttendanceSchema.virtual('scheduledMinutes').get(function(this: IStaffAttendance) {
  const start = (this.startTime as string).split(':').map(Number);
  const end = (this.endTime as string).split(':').map(Number);
  
  const startMinutes = start[0] * 60 + start[1];
  const endMinutes = end[0] * 60 + end[1];
  
  return endMinutes - startMinutes;
});

StaffAttendanceSchema.virtual('workHours').get(function(this: IStaffAttendance) {
  return Math.round(((this as any).workMinutes / 60) * 100) / 100;
});

// Methods for calculations
StaffAttendanceSchema.methods.calculateLateness = function() {
  if (!this.actualStart || !this.startTime) return 0;
  
  const scheduled = this.startTime.split(':').map(Number);
  const actual = this.actualStart.split(':').map(Number);
  
  const scheduledMinutes = scheduled[0] * 60 + scheduled[1];
  const actualMinutes = actual[0] * 60 + actual[1];
  
  return Math.max(0, actualMinutes - scheduledMinutes);
};

StaffAttendanceSchema.methods.calculateEarlyLeave = function() {
  if (!this.actualEnd || !this.endTime) return 0;
  
  const scheduled = this.endTime.split(':').map(Number);
  const actual = this.actualEnd.split(':').map(Number);
  
  const scheduledMinutes = scheduled[0] * 60 + scheduled[1];
  const actualMinutes = actual[0] * 60 + actual[1];
  
  return Math.max(0, scheduledMinutes - actualMinutes);
};

StaffAttendanceSchema.methods.calculateOvertime = function() {
  if (!this.actualEnd || !this.endTime) return 0;
  
  const scheduled = this.endTime.split(':').map(Number);
  const actual = this.actualEnd.split(':').map(Number);
  
  const scheduledMinutes = scheduled[0] * 60 + scheduled[1];
  const actualMinutes = actual[0] * 60 + actual[1];
  
  return Math.max(0, actualMinutes - scheduledMinutes);
};

// Pre-save middleware to calculate metrics
StaffAttendanceSchema.pre('save', function(this: IStaffAttendance, next) {
  if (this.actualStart && this.startTime) {
    this.lateMinutes = (this as any).calculateLateness();
  }
  
  if (this.actualEnd && this.endTime) {
    this.earlyLeaveMinutes = (this as any).calculateEarlyLeave();
    this.overtimeMinutes = (this as any).calculateOvertime();
  }
  
  // Update status based on times
  if (this.actualStart && !this.actualEnd) {
    this.status = 'in_progress';
  } else if (this.actualStart && this.actualEnd) {
    this.status = 'completed';
  }
  
  next();
});

export default mongoose.model<IStaffAttendance>('StaffAttendance', StaffAttendanceSchema, 'attendances');
