import mongoose, { Schema, Document, Date } from 'mongoose';
import User from './user.model';

export interface IFine extends Document {
  amount: number;
  reason: string;
  date: Date;
  type: 'late' | 'other';
  approved: boolean;
  createdBy: mongoose.Types.ObjectId;
  notes?: string;
}

const FineSchema: Schema = new Schema({
  amount: { 
    type: Number, 
    required: true,
    min: 0
  },
  reason: { 
    type: String, 
    required: true,
    maxlength: 200
  },
  date: { 
    type: Date, 
    required: true 
  },
  type: {
    type: String,
    enum: ['late', 'other'],
    default: 'late'
  },
  approved: {
    type: Boolean,
    default: false
  },
  createdBy: { 
    type: Schema.Types.ObjectId, 
    ref: 'users',
    required: true 
  },
  notes: {
    type: String,
    maxlength: 500
  }
}, { timestamps: true });

export default mongoose.model<IFine>('fines', FineSchema);