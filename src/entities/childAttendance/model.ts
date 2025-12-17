import mongoose, { Schema, Document } from 'mongoose';
import { createModelFactory } from '../../config/database';

export interface IChildAttendance extends Document {
  childId: mongoose.Types.ObjectId;
  groupId: mongoose.Types.ObjectId;
  date: Date;
  status: 'present' | 'absent' | 'late' | 'sick' | 'vacation';
  actualStart?: Date;
  actualEnd?: Date;
  notes?: string;
  markedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ChildAttendanceSchema: Schema = new Schema({
  childId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  groupId: {
    type: Schema.Types.ObjectId,
    ref: 'Group',
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



ChildAttendanceSchema.virtual('duration').get(function (this: IChildAttendance) {
  if (!this.actualStart || !this.actualEnd) return 0;
  return this.actualEnd.getTime() - this.actualStart.getTime();
});


ChildAttendanceSchema.methods.isLate = function (scheduledTime: string = '08:00') {
  if (!this.actualStart || this.status !== 'present') return false;

  const [hours, minutes] = scheduledTime.split(':').map(Number);
  const scheduled = new Date(this.date);
  scheduled.setHours(hours, minutes, 0, 0);

  return this.actualStart > scheduled;
};


const createChildAttendanceModel = createModelFactory<IChildAttendance>(
  'ChildAttendance',
  ChildAttendanceSchema,
  'childattendances',
  'default'
);


export default createChildAttendanceModel;