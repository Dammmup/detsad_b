import mongoose, { Schema, Document } from 'mongoose';

export interface ISimpleShift extends Document {
  staffId: mongoose.Types.ObjectId;
  date: string; // YYYY-MM-DD format
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  actualStart?: string; // HH:MM format
  actualEnd?: string; // HH:MM format
 status: 'scheduled' | 'completed' | 'cancelled' | 'no_show' | "in_progress";
  breakTime?: number; // minutes
  overtimeMinutes?: number;
  lateMinutes?: number;
  earlyLeaveMinutes?: number;
  notes?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  alternativeStaffId?: mongoose.Types.ObjectId; // Альтернативный сотрудник для отметки посещаемости
}

const Shiftschema: Schema = new Schema({
  staffId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  date: {
    type: String,
    required: true,
    index: true
  },
  startTime: {
    type: String,
    required: true,
    match: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
  },
  endTime: {
    type: String,
    required: true,
    match: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
  },
  actualStart: {
    type: String,
    match: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
  },
  actualEnd: {
    type: String,
    match: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
  },
  status: {
    type: String,
    enum: ['scheduled', 'completed', 'cancelled', 'no_show', 'confirmed', 'in_progress'],
    default: 'scheduled'
  },
  breakTime: {
    type: Number,
    default: 0
  },
  overtimeMinutes: {
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
  notes: String,
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  alternativeStaffId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    index: true
  }
}, {
  timestamps: true
});

// Pre-save middleware to update status based on check-in/check-out times
Shiftschema.pre('save', function(this: ISimpleShift, next) {
  // If we have actual start time but no actual end time, set status to in_progress
  if (this.actualStart && !this.actualEnd) {
    this.status = 'in_progress';
  }
  // If we have both actual start and end times, set status to completed
  else if (this.actualStart && this.actualEnd) {
    this.status = 'completed';
  }
  // If we have no actual times, keep original status or set to scheduled
  else if (!this.actualStart && !this.actualEnd) {
    // Only set to scheduled if status is not already set to a specific value
    if (!this.status) {
      this.status = 'scheduled';
    }
  }
  
  next();
});

// Методы для расчетов
Shiftschema.methods.getWorkMinutes = function() {
  if (!this.actualStart || !this.actualEnd) return 0;
  
  const start = this.actualStart.split(':').map(Number);
  const end = this.actualEnd.split(':').map(Number);
  
  const startMinutes = start[0] * 60 + start[1];
  const endMinutes = end[0] * 60 + end[1];
  
  return endMinutes - startMinutes - (this.breakTime || 0);
};

Shiftschema.methods.getScheduledMinutes = function() {
  const start = this.startTime.split(':').map(Number);
  const end = this.endTime.split(':').map(Number);
  
  const startMinutes = start[0] * 60 + start[1];
  const endMinutes = end[0] * 60 + end[1];
  
  return endMinutes - startMinutes;
};

// Методы для расчета штрафов
Shiftschema.methods.calculateLatePenalty = function(penaltyRatePerMinute: number = 500) {
  return (this.lateMinutes || 0) * penaltyRatePerMinute;
};

Shiftschema.methods.calculateEarlyLeavePenalty = function(penaltyRatePerMinute: number = 50) {
  return (this.earlyLeaveMinutes || 0) * penaltyRatePerMinute;
};

// Метод для расчета опоздания
Shiftschema.methods.calculateLateness = function() {
  if (!this.actualStart || !this.startTime) return 0;
  
  const scheduled = this.startTime.split(':').map(Number);
  const actual = this.actualStart.split(':').map(Number);
  
  const scheduledMinutes = scheduled[0] * 60 + scheduled[1];
  const actualMinutes = actual[0] * 60 + actual[1];
  
  return Math.max(0, actualMinutes - scheduledMinutes);
};

export default mongoose.model<ISimpleShift>('Shift', Shiftschema);

// Ensure the User model is registered
import '../users/model';