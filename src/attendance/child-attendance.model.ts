import mongoose, { Schema, Document, Date } from 'mongoose';
import Child from '../children/child.model';
import User from '../users/user.model';

export interface IChildAttendance extends Document {
  childId: mongoose.Types.ObjectId;
  date: Date;
  status: 'present' | 'absent' | 'late' | 'leave';
  checkInTime?: Date;
 checkOutTime?: Date;
  notes?: string;
  recordedBy: mongoose.Types.ObjectId; // Кто зафиксировал посещение
  createdAt: Date;
  updatedAt: Date;
}

const ChildAttendanceSchema: Schema = new Schema({
  childId: { 
    type: Schema.Types.ObjectId, 
    ref: 'children',
    required: true,
    index: true
  },
  date: { 
    type: Date, 
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'late', 'leave'],
    required: true,
    index: true
  },
  checkInTime: { 
    type: Date 
  },
  checkOutTime: { 
    type: Date 
  },
  notes: {
    type: String,
    maxlength: 500
  },
  recordedBy: { 
    type: Schema.Types.ObjectId, 
    ref: 'users',
    required: true,
    index: true
  }
}, { timestamps: true });

// Индексы для поиска
ChildAttendanceSchema.index({ childId: 1, date: -1 });
ChildAttendanceSchema.index({ date: 1, status: 1 });
ChildAttendanceSchema.index({ recordedBy: 1, createdAt: -1 });

export default mongoose.model<IChildAttendance>('childAttendance', ChildAttendanceSchema);