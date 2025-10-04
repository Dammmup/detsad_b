import mongoose, { Schema, Document, Date } from 'mongoose';
import Child from '../children/child.model';
import User from '../users/user.model';

export interface ISomaticRecord extends Document {
  childId: mongoose.Types.ObjectId;
  date: Date;
  height: number; // Рост в см
  weight: number; // Вес в кг
  headCircumference?: number; // Окружность головы в см
  chestCircumference?: number; // Окружность груди в см
  doctorId: mongoose.Types.ObjectId;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SomaticRecordSchema: Schema = new Schema({
  childId: { 
    type: Schema.Types.ObjectId, 
    ref: 'children',
    required: true 
  },
  date: { 
    type: Date, 
    required: true 
  },
  height: { 
    type: Number,
    required: true,
    min: 30,
    max: 200
  },
  weight: { 
    type: Number,
    required: true,
    min: 1,
    max: 100
  },
  headCircumference: { 
    type: Number,
    min: 20,
    max: 60
  },
  chestCircumference: { 
    type: Number,
    min: 30,
    max: 100
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

export default mongoose.model<ISomaticRecord>('somaticRecords', SomaticRecordSchema);