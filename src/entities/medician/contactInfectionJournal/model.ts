import mongoose, { Schema, Document } from 'mongoose';
import { createModelFactory } from '../../../config/database';

export interface IContactInfectionJournal extends Document {
  childId: mongoose.Types.ObjectId;
  date: Date;
  infectionType: string;
  symptoms: string[];
  treatment: string;
  doctor: mongoose.Types.ObjectId;
  notes?: string;
  attachments?: string[];
  status: 'pending' | 'completed' | 'reviewed';
  nextAppointmentDate?: Date;
  recommendations?: string;
  isolationPeriod?: number;
  isolationEndDate?: Date;
  contactsTraced?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ContactInfectionJournalSchema = new Schema<IContactInfectionJournal>({
  childId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  date: {
    type: Date,
    required: true,
    index: true
  },
  infectionType: {
    type: String,
    required: true,
    trim: true,
    maxlength: [100, 'Тип инфекции не может превышать 100 символов'],
    index: true
  },
  symptoms: [{
    type: String,
    trim: true,
    maxlength: [50, 'Симптом не может превышать 50 символов']
  }],
  treatment: {
    type: String,
    required: true,
    trim: true,
    maxlength: [500, 'Лечение не может превышать 500 символов']
  },
  doctor: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  notes: {
    type: String,
    maxlength: [500, 'Заметки не могут превышать 500 символов']
  },
  attachments: [String],
  status: {
    type: String,
    enum: ['pending', 'completed', 'reviewed'],
    default: 'pending',
    index: true
  },
  nextAppointmentDate: {
    type: Date,
    index: true
  },
  recommendations: {
    type: String,
    maxlength: [300, 'Рекомендации не могут превышать 300 символов']
  },
  isolationPeriod: {
    type: Number,
    min: [0, 'Период изоляции не может быть отрицательным'],
    max: [30, 'Период изоляции не может превышать 30 дней']
  },
  isolationEndDate: {
    type: Date,
    index: true
  },
  contactsTraced: {
    type: Boolean,
    default: false,
    index: true
  }
}, {
  timestamps: true
});


const createContactInfectionJournalModel = createModelFactory<IContactInfectionJournal>(
  'ContactInfectionJournal',
  ContactInfectionJournalSchema,
  'contact_infection_journals',
  'medical'
);


export default createContactInfectionJournalModel;