import mongoose, { Schema, Document } from 'mongoose';
import { createModelFactory } from '../../config/database';

export interface IShift extends Document {
  staffId: mongoose.Types.ObjectId;
  date: string; // YYYY-MM-DD format
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  status: 'absent' | 'scheduled' | 'completed' | 'in_progress' | 'pending_approval' | 'late';
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
  status: {
    type: String,
    enum: ['absent', 'scheduled', 'completed', 'in_progress', 'pending_approval', 'late'],
    default: 'scheduled'
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
  
  // Only update status if it's not already set to a specific value
  // Don't override pending_approval, late, completed, in_progress status
  if (!this.status || this.status === 'scheduled') {
    this.status = 'scheduled';
  }
  
  next();
});

// Методы для расчетов
Shiftschema.methods.getScheduledMinutes = function() {
 const start = this.startTime.split(':').map(Number);
  const end = this.endTime.split(':').map(Number);
  
  const startMinutes = start[0] * 60 + start[1];
  const endMinutes = end[0] * 60 + end[1];
  
  return endMinutes - startMinutes;
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