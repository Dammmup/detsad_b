import mongoose, { Schema, Document, Date } from 'mongoose';
import Child from '../children/child.model';
import User from '../users/user.model';

export interface ITubPositiveRecord extends Document {
  childId: mongoose.Types.ObjectId;
  date: Date;
  examinationType: 'mantoux' | 'diaskintest'; // Тип исследования
  reactionSize: number; // Размер реакции в мм
  result: 'negative' | 'positive' | 'doubtful' | 'hyperergic';
  doctorId: mongoose.Types.ObjectId;
  notes?: string;
  photo?: string; // Путь к фото реакции
  createdAt: Date;
  updatedAt: Date;
}

const TubPositiveRecordSchema: Schema = new Schema({
  childId: { 
    type: Schema.Types.ObjectId, 
    ref: 'children',
    required: true 
  },
  date: { 
    type: Date, 
    required: true 
  },
  examinationType: {
    type: String,
    enum: ['mantoux', 'diaskintest'],
    required: true
  },
  reactionSize: { 
    type: Number,
    required: true,
    min: 0,
    max: 50
  },
  result: {
    type: String,
    enum: ['negative', 'positive', 'doubtful', 'hyperergic'],
    required: true
  },
  doctorId: { 
    type: Schema.Types.ObjectId, 
    ref: 'users',
    required: true 
  },
  notes: {
    type: String,
    maxlength: 500
  },
  photo: {
    type: String
  }
}, { timestamps: true });

export default mongoose.model<ITubPositiveRecord>('tubPositiveRecords', TubPositiveRecordSchema);