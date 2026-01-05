import mongoose, { Schema, Document } from 'mongoose';
export interface IShiftDetail {
  status: 'absent' | 'scheduled' | 'completed' | 'in_progress' | 'pending_approval' | 'late';
  notes?: string;
  createdBy: mongoose.Types.ObjectId;
  alternativeStaffId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IStaffShifts extends Document {
  staffId: mongoose.Types.ObjectId;
  shifts: Map<string, IShiftDetail>;
  createdAt: Date;
  updatedAt: Date;
}

const ShiftDetailSchema: Schema = new Schema({
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

const StaffShiftsSchema: Schema = new Schema({
  staffId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  shifts: {
    type: Map,
    of: ShiftDetailSchema,
    default: {}
  }
}, {
  timestamps: true
});


export default mongoose.model<IStaffShifts>('Shift', StaffShiftsSchema, 'shifts');


import '../users/model';