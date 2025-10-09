import mongoose, { Schema, Document } from 'mongoose';

export interface IShiftEntry {
  /**
   * Дата смены в формате YYYY-MM-DD
   */
  date: string;
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
}

export interface IStaffShift extends Document {
  staffId: mongoose.Types.ObjectId;
  /**
   * Объект смен, где ключ - дата в формате YYYY-MM-DD
   */
  shifts: {
    [date: string]: IShiftEntry;
  };
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ShiftEntrySchema = new Schema({
  date: {
    type: String,
    required: true
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
  notes: String
});

const StaffShiftSchema: Schema = new Schema({
  staffId: {
    type: Schema.Types.ObjectId,
    ref: 'users',
    required: true,
    index: true
  },
  shifts: {
    type: Map,
    of: ShiftEntrySchema,
    default: {}
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'users',
    required: true
  }
}, {
  timestamps: true
});


// Методы для расчетов по конкретной дате
StaffShiftSchema.methods.getWorkMinutesForDate = function(date: string) {
  const shift = this.shifts[date];
  if (!shift || !shift.actualStart || !shift.actualEnd) return 0;
  
  const start = shift.actualStart.split(':').map(Number);
  const end = shift.actualEnd.split(':').map(Number);
  
  const startMinutes = start[0] * 60 + start[1];
  const endMinutes = end[0] * 60 + end[1];
  
  return endMinutes - startMinutes - (shift.breakTime || 0);
};

StaffShiftSchema.methods.getScheduledMinutesForDate = function(date: string) {
  const shift = this.shifts[date];
 if (!shift) return 0;
  
  const start = shift.startTime.split(':').map(Number);
  const end = shift.endTime.split(':').map(Number);
  
  const startMinutes = start[0] * 60 + start[1];
  const endMinutes = end[0] * 60 + end[1];
  
  return endMinutes - startMinutes;
};

// Методы для расчета штрафов
StaffShiftSchema.methods.calculateLatePenaltyForDate = function(date: string, penaltyRatePerMinute: number = 500) {
  const shift = this.shifts[date];
  if (!shift) return 0;
  return (shift.lateMinutes || 0) * penaltyRatePerMinute;
};

StaffShiftSchema.methods.calculateEarlyLeavePenaltyForDate = function(date: string, penaltyRatePerMinute: number = 50) {
  const shift = this.shifts[date];
  if (!shift) return 0;
  return (shift.earlyLeaveMinutes || 0) * penaltyRatePerMinute;
};

// Метод для расчета опоздания
StaffShiftSchema.methods.calculateLatenessForDate = function(date: string) {
  const shift = this.shifts[date];
 if (!shift || !shift.actualStart || !shift.startTime) return 0;
  
  const scheduled = shift.startTime.split(':').map(Number);
  const actual = shift.actualStart.split(':').map(Number);
  
  const scheduledMinutes = scheduled[0] * 60 + scheduled[1];
  const actualMinutes = actual[0] * 60 + actual[1];
  
  return Math.max(0, actualMinutes - scheduledMinutes);
};

export default mongoose.model<IStaffShift>('StaffShift', StaffShiftSchema);