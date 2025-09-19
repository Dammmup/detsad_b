import mongoose, { Schema, Document } from 'mongoose';

export interface IStaffShift extends Document {
  staffId: mongoose.Types.ObjectId;
  date: Date;
  shiftType:  'full';
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  actualStart?: string; // HH:MM format
  actualEnd?: string; // HH:MM format
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  breakTime?: number; // minutes
  overtimeMinutes?: number;
  lateMinutes?: number;
  earlyLeaveMinutes?: number;
  notes?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const StaffShiftSchema: Schema = new Schema({
  staffId: {
    type: Schema.Types.ObjectId,
    ref: 'users',
    required: true,
    index: true
  },
  date: {
    type: Date,
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
    enum: ['scheduled', 'in_progress', 'completed', 'cancelled', 'no_show'],
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

// Индексы для оптимизации запросов
StaffShiftSchema.index({ staffId: 1, date: 1 });
StaffShiftSchema.index({ date: 1, status: 1 });
StaffShiftSchema.index({ createdBy: 1 });

// Виртуальные поля для расчетов
StaffShiftSchema.virtual('workMinutes').get(function(this: IStaffShift) {
  if (!this.actualStart || !this.actualEnd) return 0;
  
  const start = (this.actualStart as string).split(':').map(Number);
  const end = (this.actualEnd as string).split(':').map(Number);
  
  const startMinutes = start[0] * 60 + start[1];
  const endMinutes = end[0] * 60 + end[1];
  
  return endMinutes - startMinutes - (this.breakTime || 0);
});

StaffShiftSchema.virtual('scheduledMinutes').get(function(this: IStaffShift) {
  const start = (this.startTime as string).split(':').map(Number);
  const end = (this.endTime as string).split(':').map(Number);
  
  const startMinutes = start[0] * 60 + start[1];
  const endMinutes = end[0] * 60 + end[1];
  
  return endMinutes - startMinutes;
});

// Методы для расчета штрафов
StaffShiftSchema.methods.calculateLatePenalty = function(penaltyRatePerMinute: number = 500) {
  return (this.lateMinutes || 0) * penaltyRatePerMinute;
};

StaffShiftSchema.methods.calculateEarlyLeavePenalty = function(penaltyRatePerMinute: number = 500) {
  return (this.earlyLeaveMinutes || 0) * penaltyRatePerMinute;
};

export default mongoose.model<IStaffShift>('StaffShift', StaffShiftSchema);
