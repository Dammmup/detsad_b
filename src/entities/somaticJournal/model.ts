import mongoose, { Schema, Document } from 'mongoose';

export interface ISomaticJournal extends Document {
  childId: mongoose.Types.ObjectId;
  date: Date;
  diagnosis: string;
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

const SomaticJournalSchema = new Schema<ISomaticJournal>({
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
  diagnosis: {
    type: String,
    required: true,
    trim: true,
    maxlength: [200, 'Диагноз не может превышать 200 символов']
  },
  symptoms: [{
    type: String,
    trim: true,
    maxlength: [100, 'Симптом не может превышать 100 символов']
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
  }
}, {
  timestamps: true
});

// Индексы для оптимизации запросов
// Все необходимые индексы уже определены в схеме через свойство index: true
// Дополнительные составные индексы:
SomaticJournalSchema.index({ childId: 1, date: 1 });
SomaticJournalSchema.index({ doctor: 1, date: -1 });

export default mongoose.model<ISomaticJournal>('SomaticJournal', SomaticJournalSchema, 'somatic_journals');