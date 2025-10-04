import mongoose, { Schema, Document, Date } from 'mongoose';
import Child from '../children/child.model';
import User from '../users/user.model';

export interface IHelminthRecord extends Document {
  childId: mongoose.Types.ObjectId;
  date: Date;
  examinationType: 'egg' | 'scraping'; // Тип исследования: яйца глистов или соскоб
  result: 'negative' | 'positive';
  parasiteType?: string; // Тип паразита (если положительный результат)
  doctorId: mongoose.Types.ObjectId;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const HelminthRecordSchema: Schema = new Schema({
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
    enum: ['egg', 'scraping'],
    required: true
  },
  result: {
    type: String,
    enum: ['negative', 'positive'],
    required: true
  },
  parasiteType: { 
    type: String,
    maxlength: 100
  },
  doctorId: { 
    type: Schema.Types.ObjectId, 
    ref: 'users',
    required: true 
  },
  notes: {
    type: String,
    maxlength: 500
  }
}, { timestamps: true });

export default mongoose.model<IHelminthRecord>('helminthRecords', HelminthRecordSchema);