import mongoose, { Schema, Document } from 'mongoose';

export interface ISchedule extends Document {
  staffId: mongoose.Types.ObjectId;
  date: Date;
  shiftId: mongoose.Types.ObjectId;
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  breakStartTime?: string; // HH:MM format
  breakEndTime?: string; // HH:MM format
  actualStart?: string; // HH:MM format
  actualEnd?: string; // HH:MM format
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'no_show' | 'late';
  breakDuration?: number; // minutes
  overtimeDuration?: number; // minutes
  lateMinutes?: number; // minutes
  earlyLeaveMinutes?: number; // minutes
  groupId?: mongoose.Types.ObjectId;
  location: string;
  notes?: string;
  attachments?: string[];
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ScheduleSchema = new Schema<ISchedule>({
  staffId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  shiftId: {
    type: Schema.Types.ObjectId,
    ref: 'StaffShift',
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
  breakStartTime: {
    type: String,
    match: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
  },
  breakEndTime: {
    type: String,
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
    enum: ['scheduled', 'in_progress', 'completed', 'cancelled', 'no_show', 'late'],
    default: 'scheduled'
  },
  breakDuration: {
    type: Number,
    default: 0,
    min: [0, 'Продолжительность перерыва не может быть отрицательной']
  },
  overtimeDuration: {
    type: Number,
    default: 0,
    min: [0, 'Продолжительность сверхурочных не может быть отрицательной']
  },
  lateMinutes: {
    type: Number,
    default: 0,
    min: [0, 'Опоздание не может быть отрицательным']
  },
  earlyLeaveMinutes: {
    type: Number,
    default: 0,
    min: [0, 'Ранний уход не может быть отрицательным']
  },
  groupId: {
    type: Schema.Types.ObjectId,
    ref: 'Group'
  },
  location: {
    type: String,
    required: true,
    trim: true,
    maxlength: [100, 'Местоположение не может превышать 100 символов']
  },
  notes: {
    type: String,
    maxlength: [500, 'Заметки не могут превышать 500 символов']
  },
  attachments: [String],
  approvedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: {
    type: Date
  }
}, {
  timestamps: true
});

export default mongoose.model<ISchedule>('Schedule', ScheduleSchema, 'schedules');