import mongoose, { Schema, Document } from 'mongoose';

export interface IAttendanceDetail {
  groupId: mongoose.Types.ObjectId;
  status: 'present' | 'absent' | 'late' | 'sick' | 'vacation';
  actualStart?: Date;
  actualEnd?: Date;
  notes?: string;
  markedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IChildAttendance extends Document {
  childId: mongoose.Types.ObjectId;
  attendance: Map<string, IAttendanceDetail>; // Key could be date string (e.g., "YYYY-MM-DD") or group ID if multiple groups per day
  createdAt: Date;
  updatedAt: Date;
}

const AttendanceDetailSchema: Schema = new Schema({
  groupId: {
    type: Schema.Types.ObjectId,
    ref: 'Group',
    required: true
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'late', 'sick', 'vacation'],
    required: true,
    default: 'absent'
  },
  actualStart: Date,
  actualEnd: Date,
  notes: {
    type: String,
    maxlength: 500
  },
  markedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

const ChildAttendanceSchema: Schema = new Schema({
  childId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  attendance: {
    type: Map,
    of: AttendanceDetailSchema,
    default: {}
  }
}, {
  timestamps: true
});

export default mongoose.model<IChildAttendance>('ChildAttendance', ChildAttendanceSchema, 'childattendances');