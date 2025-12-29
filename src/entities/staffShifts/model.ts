import mongoose, { Schema, Document } from 'mongoose';
export interface IShift extends Document {
  staffId: mongoose.Types.ObjectId;
  date: string;
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

// Enforce unique shift per staff per day
Shiftschema.index({ staffId: 1, date: 1 }, { unique: true });


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


export default mongoose.model<IShift>('Shift', Shiftschema, 'shifts');


import '../users/model';