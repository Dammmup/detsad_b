import mongoose, { Schema, Document, Date } from 'mongoose';
import Child from '../children/child.model';
import User from '../users/user.model';

export interface IInfectiousDiseaseRecord extends Document {
  childId: mongoose.Types.ObjectId;
  date: Date;
  diseaseName: string; // Название заболевания
  symptoms: string; // Симптомы
  treatment: string; // Лечение
  doctorId: mongoose.Types.ObjectId;
  notes?: string;
  recoveryDate?: Date; // Дата выздоровления
  isolationRequired: boolean; // Требуется ли изоляция
  isolationEndDate?: Date; // Дата окончания изоляции
  createdAt: Date;
  updatedAt: Date;
}

const InfectiousDiseaseRecordSchema: Schema = new Schema({
  childId: { 
    type: Schema.Types.ObjectId, 
    ref: 'children',
    required: true 
  },
  date: { 
    type: Date, 
    required: true 
  },
  diseaseName: { 
    type: String,
    required: true,
    maxlength: 100
  },
  symptoms: { 
    type: String,
    required: true,
    maxlength: 500
  },
  treatment: { 
    type: String,
    required: true,
    maxlength: 500
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
  recoveryDate: { 
    type: Date 
  },
  isolationRequired: {
    type: Boolean,
    default: false
  },
  isolationEndDate: { 
    type: Date 
  }
}, { timestamps: true });

export default mongoose.model<IInfectiousDiseaseRecord>('infectiousDiseaseRecords', InfectiousDiseaseRecordSchema);