import mongoose, { Schema, Document } from 'mongoose';
import { createModelFactory } from '../../../config/database';

export interface IMedicalJournal extends Document {
  childId: mongoose.Types.ObjectId;
  type: 'somatic' | 'mantoux' | 'helminth' | 'infectious' | 'tubPositive' | 'riskGroup';
  date: Date;
  result: string;
  doctor: mongoose.Types.ObjectId;
  notes?: string;
  attachments?: string[];
  status: 'pending' | 'completed' | 'reviewed';
  nextAppointmentDate?: Date;
  recommendations?: string;
 createdAt: Date;
 updatedAt: Date;
}

const MedicalJournalSchema = new Schema<IMedicalJournal>({
  childId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['somatic', 'mantoux', 'helminth', 'infectious', 'tubPositive', 'riskGroup'],
    required: true
  },
  date: {
    type: Date,
    required: true,
    index: true
 },
  result: {
    type: String,
    required: true
  },
  doctor: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  notes: String,
  attachments: [String],
  status: {
    type: String,
    enum: ['pending', 'completed', 'reviewed'],
    default: 'pending'
  },
  nextAppointmentDate: Date,
  recommendations: String,
}, {
  timestamps: true
});

// Создаем фабрику модели для отложенного создания модели после подключения к базе данных
const createMedicalJournalModel = createModelFactory<IMedicalJournal>(
  'MedicalJournal',
  MedicalJournalSchema,
  'medical_journals',
  'medical'
);

// Экспортируем фабрику, которая будет создавать модель после подключения
export default createMedicalJournalModel;