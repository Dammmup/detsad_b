import mongoose, { Schema, Document } from 'mongoose';

export interface IChildAttendance extends Document {
  childId: mongoose.Types.ObjectId;
  groupId: mongoose.Types.ObjectId;
  date: Date;
  status: 'present' | 'absent' | 'late' | 'sick' | 'vacation';
  checkInTime?: Date;
  checkOutTime?: Date;
  notes?: string;
  markedBy: mongoose.Types.ObjectId; // Teacher or admin who marked attendance
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
  checkInTime: Date,
  checkOutTime: Date,
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

// Составной индекс для уникальности записи на день
ChildAttendanceSchema.index({ childId: 1, date: 1 }, { unique: true });

// Индексы для быстрого поиска
ChildAttendanceSchema.index({ groupId: 1, date: 1 });
ChildAttendanceSchema.index({ date: 1, status: 1 });
ChildAttendanceSchema.index({ markedBy: 1 });

// Виртуальные поля
ChildAttendanceSchema.virtual('duration').get(function(this: IChildAttendance) {
  if (!this.checkInTime || !this.checkOutTime) return 0;
  return this.checkOutTime.getTime() - this.checkInTime.getTime();
});

// Методы
ChildAttendanceSchema.methods.isLate = function(scheduledTime: string = '08:00') {
  if (!this.checkInTime || this.status !== 'present') return false;
  
  const [hours, minutes] = scheduledTime.split(':').map(Number);
  const scheduled = new Date(this.date);
  scheduled.setHours(hours, minutes, 0, 0);
  
  return this.checkInTime > scheduled;
};

export default mongoose.model<IChildAttendance>('ChildAttendance', ChildAttendanceSchema);
