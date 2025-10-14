import mongoose, { Schema, Document } from 'mongoose';

export interface IFine extends Document {
  user: mongoose.Types.ObjectId;
  amount: number;
  reason: string;
  type: string;
  notes?: string;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

const FineSchema: Schema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
    index: true
  },
  reason: {
    type: String,
    required: true,
    maxlength: 500
  },
  type: {
    type: String,
    required: true,
    default: 'other',
    enum: ['late', 'early_leave', 'absence', 'violation', 'other'],
    index: true
  },
  notes: {
    type: String,
    maxlength: 1000
 },
  date: {
    type: Date,
    required: true,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});



export default mongoose.model<IFine>('Fine', FineSchema, 'fines');