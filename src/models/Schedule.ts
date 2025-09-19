import mongoose, { Schema, Document } from 'mongoose';

export interface ISchedule extends Document {
  userId: mongoose.Types.ObjectId;
  shiftId: mongoose.Types.ObjectId;
  date: Date;
  status: 'scheduled' | 'completed' | 'absent' | 'late' | 'cancelled' | 'no_show';
  actualClockIn?: Date;
  actualClockOut?: Date;
  startTime: Date; // Calculated from shift + date
  endTime: Date; // Calculated from shift + date
  notes?: string;
  assignedBy: mongoose.Types.ObjectId;
  assignedAt: Date;
  confirmedBy?: mongoose.Types.ObjectId;
  confirmedAt?: Date;
  isRecurring: boolean;
  recurringPattern?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    interval: number; // Every N days/weeks/months
    endDate?: Date;
    daysOfWeek?: number[]; // For weekly patterns
  };
  replacementFor?: mongoose.Types.ObjectId; // If this is a replacement shift
  timeEntryId?: mongoose.Types.ObjectId; // Link to actual time entry
  kindergartenId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ScheduleSchema: Schema = new Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: [true, 'ID сотрудника обязательно'],
    index: true
  },
  shiftId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Shift', 
    required: [true, 'ID смены обязательно'],
    index: true
  },
  date: { 
    type: Date, 
    required: [true, 'Дата смены обязательна'],
    index: true
  },
  status: { 
    type: String, 
    enum: ['scheduled', 'completed', 'absent', 'late', 'cancelled', 'no_show'],
    default: 'scheduled',
    index: true
  },
  actualClockIn: { type: Date },
  actualClockOut: { type: Date },
  startTime: { 
    type: Date, 
    required: [true, 'Запланированное время начала обязательно']
  },
  endTime: { 
    type: Date, 
    required: [true, 'Запланированное время окончания обязательно']
  },
  notes: { 
    type: String,
    maxlength: [500, 'Заметки не могут превышать 500 символов']
  },
  assignedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: [true, 'ID назначившего обязательно']
  },
  assignedAt: { 
    type: Date, 
    default: Date.now 
  },
  confirmedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User'
  },
  confirmedAt: { type: Date },
  isRecurring: { 
    type: Boolean, 
    default: false 
  },
  recurringPattern: {
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly']
    },
    interval: {
      type: Number,
      min: [1, 'Интервал должен быть больше 0']
    },
    endDate: { type: Date },
    daysOfWeek: [{
      type: Number,
      min: 0,
      max: 6
    }]
  },
  replacementFor: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Schedule'
  },
  timeEntryId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'TimeEntry'
  },
  kindergartenId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Kindergarten'
  }
}, {
  timestamps: true
});

// Compound indexes for performance
ScheduleSchema.index({ userId: 1, date: -1 });
ScheduleSchema.index({ date: 1, status: 1 });
ScheduleSchema.index({ shiftId: 1, date: 1 });
ScheduleSchema.index({ kindergartenId: 1, date: 1 });

// Unique constraint: one schedule per user per date (prevent double booking)
ScheduleSchema.index({ userId: 1, date: 1 }, { unique: true });

// Pre-save middleware to calculate scheduled times
ScheduleSchema.pre('save', async function(this: ISchedule, next) {
  if (this.isModified('shiftId') || this.isModified('date')) {
    try {
      const Shift = mongoose.model('Shift');
      const shift = await Shift.findById(this.shiftId);
      
      if (!shift) {
        return next(new Error('Смена не найдена'));
      }
      
      // Calculate scheduled start and end times
      const date = new Date(this.date);
      const [startHour, startMinute] = shift.startTime.split(':').map(Number);
      const [endHour, endMinute] = shift.endTime.split(':').map(Number);
      
      this.startTime = new Date(date.getFullYear(), date.getMonth(), date.getDate(), startHour, startMinute);
      this.endTime = new Date(date.getFullYear(), date.getMonth(), date.getDate(), endHour, endMinute);
      
      // Handle overnight shifts
      if (this.endTime <= this.startTime) {
        this.endTime.setDate(this.endTime.getDate() + 1);
      }
    } catch (error) {
      return next(error as Error);
    }
  }
  next();
});

// Method to check if employee is late
ScheduleSchema.methods.isLate = function(clockInTime?: Date): boolean {
  const checkTime = clockInTime || this.actualClockIn;
  if (!checkTime) return false;
  
  const graceMinutes = 15; // 15-minute grace period
  const lateThreshold = new Date(this.startTime.getTime() + (graceMinutes * 60 * 1000));
  
  return checkTime > lateThreshold;
};

// Method to calculate hours worked
ScheduleSchema.methods.getHoursWorked = function(): number {
  if (!this.actualClockIn || !this.actualClockOut) return 0;
  
  const totalMs = this.actualClockOut.getTime() - this.actualClockIn.getTime();
  return totalMs / (1000 * 60 * 60); // Convert to hours
};

// Method to get shift duration
ScheduleSchema.methods.getScheduledHours = function(): number {
  const totalMs = this.endTime.getTime() - this.startTime.getTime();
  return totalMs / (1000 * 60 * 60); // Convert to hours
};

// Static method to find conflicts
ScheduleSchema.statics.findConflicts = function(userId: mongoose.Types.ObjectId, startTime: Date, endTime: Date, excludeId?: mongoose.Types.ObjectId) {
  const query: any = {
    userId,
    status: { $in: ['scheduled', 'completed'] },
    $or: [
      // New schedule starts during existing schedule
      {
        startTime: { $lte: startTime },
        endTime: { $gt: startTime }
      },
      // New schedule ends during existing schedule
      {
        startTime: { $lt: endTime },
        endTime: { $gte: endTime }
      },
      // New schedule encompasses existing schedule
      {
        startTime: { $gte: startTime },
        endTime: { $lte: endTime }
      }
    ]
  };
  
  if (excludeId) {
    query._id = { $ne: excludeId };
  }
  
  return this.find(query);
};

export default mongoose.model<ISchedule>('Schedule', ScheduleSchema);
