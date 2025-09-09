import mongoose, { Document, Schema } from 'mongoose';

export interface IAttendance extends Document {
  userId: string;
  date: string; // YYYY-MM-DD
  status: 'present' | 'absent' | 'late' | 'early-leave' | 'sick' | 'vacation';
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const AttendanceSchema = new Schema<IAttendance>({
  userId: { type: String, required: true, index: true },
  date: { type: String, required: true, index: true },
  status: { type: String, enum: ['present', 'absent', 'late', 'early-leave', 'sick', 'vacation'], required: true },
  notes: { type: String },
}, { timestamps: true });

AttendanceSchema.index({ userId: 1, date: 1 }, { unique: true });

export default mongoose.model<IAttendance>('Attendance', AttendanceSchema);
