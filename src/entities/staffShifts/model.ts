import mongoose, { Schema, Document } from 'mongoose';
export interface IShift extends Document {
  staffId: mongoose.Types.ObjectId;
  date: string;
  startTime: string;
  endTime: string;
  status: 'absent' | 'scheduled' | 'completed' | 'in_progress' | 'pending_approval' | 'late';
  notes?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  alternativeStaffId?: mongoose.Types.ObjectId;
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


Shiftschema.pre('save', function (this: IShift, next) {

  if (this.isModified('status')) {
    next();
    return;
  }



  if (!this.status || this.status === 'scheduled') {
    this.status = 'scheduled';
  }

  next();
});


Shiftschema.methods.getScheduledMinutes = function () {
  const start = this.startTime.split(':').map(Number);
  const end = this.endTime.split(':').map(Number);

  const startMinutes = start[0] * 60 + start[1];
  const endMinutes = end[0] * 60 + end[1];

  return endMinutes - startMinutes;
};


export default mongoose.model<IShift>('Shift', Shiftschema, 'shifts');


import '../users/model';