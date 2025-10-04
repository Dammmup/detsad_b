import mongoose, { Schema, Document, Date } from 'mongoose';
import User from '../users/user.model';

export interface IShift extends Document {
  staffId: mongoose.Types.ObjectId;
  date: Date;
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  status: 'planned' | 'in_progress' | 'completed' | 'no_show' | 'cancelled';
  notes?: string;
  lateMinutes?: number;
  createdAt: Date;
  updatedAt: Date;
}

const ShiftSchema: Schema = new Schema({
  staffId: { 
    type: Schema.Types.ObjectId, 
    ref: 'users',
    required: true 
  },
  date: { 
    type: Date, 
    required: true 
  },
  startTime: { 
    type: String, // HH:mm format
    required: true,
    match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
  },
  endTime: { 
    type: String, // HH:mm format
    required: true,
    match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
  },
  status: {
    type: String,
    enum: ['planned', 'in_progress', 'completed', 'no_show', 'cancelled'],
    default: 'planned'
  },
  notes: {
    type: String,
    maxlength: 500
  },
  lateMinutes: {
    type: Number,
    default: 0,
    min: 0
  }
}, { timestamps: true });

export default mongoose.model<IShift>('shifts', ShiftSchema);