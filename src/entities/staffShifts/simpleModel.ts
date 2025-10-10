import mongoose, { Schema, Document } from 'mongoose';

export interface ISimpleShift extends Document {
  staffId: mongoose.Types.ObjectId;
  date: string; // YYYY-MM-DD format
  shiftType: 'full' | 'day_off' | 'vacation' | 'sick_leave';
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  actualStart?: string; // HH:MM format
 actualEnd?: string; // HH:MM format
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'no_show' | 'late';
  breakTime?: number; // minutes
  overtimeMinutes?: number;
  lateMinutes?: number;
  earlyLeaveMinutes?: number;
  notes?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const SimpleShiftSchema: Schema = new Schema({
  staffId: {
    type: Schema.Types.ObjectId,
    ref: 'users',
    required: true,
    index: true
  },
  date: {
    type: String,
    required: true,
    index: true
  },
  shiftType: {
    type: String,
    enum: ['full', 'day_off', 'vacation', 'sick_leave'],
    required: true
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
    enum: ['scheduled', 'in_progress', 'completed', 'cancelled', 'no_show', 'late', 'confirmed'],
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
    ref: 'users',
    required: true
  }
}, {
  timestamps: true
});

// Методы для расчетов
SimpleShiftSchema.methods.getWorkMinutes = function() {
 if (!this.actualStart || !this.actualEnd) return 0;
  
 const start = this.actualStart.split(':').map(Number);
 const end = this.actualEnd.split(':').map(Number);
  
  const startMinutes = start[0] * 60 + start[1];
  const endMinutes = end[0] * 60 + end[1];
  
  return endMinutes - startMinutes - (this.breakTime || 0);
};

SimpleShiftSchema.methods.getScheduledMinutes = function() {
 const start = this.startTime.split(':').map(Number);
  const end = this.endTime.split(':').map(Number);
  
  const startMinutes = start[0] * 60 + start[1];
  const endMinutes = end[0] * 60 + end[1];
  
  return endMinutes - startMinutes;
};

// Методы для расчета штрафов
SimpleShiftSchema.methods.calculateLatePenalty = function(penaltyRatePerMinute: number = 500) {
  return (this.lateMinutes || 0) * penaltyRatePerMinute;
};

SimpleShiftSchema.methods.calculateEarlyLeavePenalty = function(penaltyRatePerMinute: number = 50) {
  return (this.earlyLeaveMinutes || 0) * penaltyRatePerMinute;
};

// Метод для расчета опоздания
SimpleShiftSchema.methods.calculateLateness = function() {
  if (!this.actualStart || !this.startTime) return 0;
  
  const scheduled = this.startTime.split(':').map(Number);
  const actual = this.actualStart.split(':').map(Number);
  
  const scheduledMinutes = scheduled[0] * 60 + scheduled[1];
  const actualMinutes = actual[0] * 60 + actual[1];
  
  return Math.max(0, actualMinutes - scheduledMinutes);
};

export default mongoose.model<ISimpleShift>('SimpleShift', SimpleShiftSchema);