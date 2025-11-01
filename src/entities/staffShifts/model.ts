import mongoose, { Schema, Document } from 'mongoose';
import { createModelFactory } from '../../config/database';

export interface IShift extends Document {
  staffId: mongoose.Types.ObjectId;
  date: string; // YYYY-MM-DD format
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  actualStart?: string; // HH:MM format
  actualEnd?: string; // HH:MM format
 status: 'scheduled' | 'completed' | 'in_progress';
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
    enum: ['scheduled', 'completed', 'in_progress'],
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
Shiftschema.pre('save', function(this: IShift, next) {
  // If status was explicitly modified in this operation, don't override it
  if (this.isModified('status')) {
    next();
    return;
 }
  
  // If we have actual start time but no actual end time, set status to in_progress
 if (this.actualStart && !this.actualEnd) {
    this.status = 'in_progress';
  }
  // If we have both actual start and end times, set status to completed
 else if (this.actualStart && this.actualEnd) {
    // Only set to completed if actualStart and actualEnd were modified in this operation
    // This prevents overriding explicit status changes when both fields already existed
    if (this.isModified('actualStart') && this.isModified('actualEnd')) {
      // Both were modified in this operation, so mark as completed
      this.status = 'completed';
    } else if (this.isModified('actualStart') && !this.isModified('actualEnd')) {
      // Only actualStart was modified (check-in), keep as in_progress
      this.status = 'in_progress';
    } else if (!this.isModified('actualStart') && this.isModified('actualEnd')) {
      // Only actualEnd was modified (check-out), set to completed
      this.status = 'completed';
    }
    // If neither was modified, it means both existed before, so we don't change the status
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

// Создаем фабрику модели для отложенного создания модели после подключения к базе данных
const createShiftModel = createModelFactory<IShift>(
  'Shift',
  Shiftschema,
  'shifts',
  'default'
);

// Экспортируем фабрику, которая будет создавать модель после подключения
export default createShiftModel;

// Ensure the User model is registered
import '../users/model';