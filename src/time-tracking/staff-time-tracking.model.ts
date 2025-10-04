import mongoose, { Schema, Document, Date } from 'mongoose';
import User from '../users/user.model';

export interface IStaffTimeTracking extends Document {
  staffId: mongoose.Types.ObjectId; // ID сотрудника
  date: Date; // Дата
  checkIn: Date; // Время прихода
  checkOut?: Date; // Время ухода
  status: 'working' | 'completed' | 'absent';
  totalHours?: number; // Общее количество часов
  notes?: string; // Примечания
 createdAt: Date;
 updatedAt: Date;
}

const StaffTimeTrackingSchema: Schema = new Schema({
  staffId: { 
    type: Schema.Types.ObjectId, 
    ref: 'users',
    required: true 
  },
  date: { 
    type: Date, 
    required: true,
    index: true
 },
  checkIn: { 
    type: Date,
    required: true
 },
  checkOut: { 
    type: Date 
  },
  status: {
    type: String,
    enum: ['working', 'completed', 'absent'],
    default: 'working'
  },
  totalHours: { 
    type: Number 
  },
  notes: {
    type: String,
    maxlength: 500
  }
}, { timestamps: true });

export default mongoose.model<IStaffTimeTracking>('staffTimeTracking', StaffTimeTrackingSchema);