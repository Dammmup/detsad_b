import mongoose, { Schema, Document } from 'mongoose';
export interface IInfectiousDiseasesJournal extends Document {
  childId: mongoose.Types.ObjectId;
  date: Date;
  disease: string;
  symptoms: string[];
  treatment: string;
  doctor: mongoose.Types.ObjectId;
  notes?: string;
  attachments?: string[];
  status: 'pending' | 'completed' | 'reviewed';
  nextAppointmentDate?: Date;
  recommendations?: string;
  createdAt: Date;
  updatedAt: Date;
}

const InfectiousDiseasesJournalSchema = new Schema<IInfectiousDiseasesJournal>({
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
  disease: {
    type: String,
    required: true,
    trim: true,
    maxlength: [100, 'Название заболевания не может превышать 100 символов']
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
    required: true
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
  }
}, {
  timestamps: true
});


export default mongoose.model<IInfectiousDiseasesJournal>('InfectiousDiseasesJournal', InfectiousDiseasesJournalSchema, 'infectious_diseases_journals');