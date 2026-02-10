import mongoose, { Schema, Document } from 'mongoose';
export interface IMantouxJournalCreate {
  childId: mongoose.Types.ObjectId;
  date: Date;
  reactionSize: number;
  reactionType: 'negative' | 'positive' | 'hyperergic';
  injectionSite: string;
  doctor: mongoose.Types.ObjectId;
  notes?: string;
  attachments?: string[];
  status: 'pending' | 'completed' | 'reviewed';
  nextAppointmentDate?: Date;
  recommendations?: string;
  mm?: number;
  year?: string;
  atr?: string;
  diagnosis?: string;
  address?: string;
  birthdate?: Date;
  fio?: string;
  has063?: boolean;
  groupId?: mongoose.Types.ObjectId;
}

export interface IMantouxJournal extends Document, IMantouxJournalCreate {
  createdAt: Date;
  updatedAt: Date;
}

const MantouxJournalSchema = new Schema<IMantouxJournal>({
  childId: {
    type: Schema.Types.ObjectId,
    ref: 'Child',
    required: true,
    index: true
  },
  date: {
    type: Date,
    required: true,
    index: true
  },
  reactionSize: {
    type: Number,
    required: true,
    min: [0, 'Размер реакции не может быть отрицательным'],
    max: [50, 'Размер реакции не может превышать 50 мм']
  },
  reactionType: {
    type: String,
    enum: ['negative', 'positive', 'hyperergic'],
    required: true
  },
  injectionSite: {
    type: String,
    required: true,
    trim: true,
    maxlength: [100, 'Место инъекции не может превышать 100 символов']
  },
  doctor: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  notes: {
    type: String,
    maxlength: [50, 'Заметки не могут превышать 500 символов']
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
  mm: {
    type: Number,
    min: [0, 'Значение мм не может быть отрицательным'],
    max: [50, 'Значение мм не может превышать 50']
  },
  year: {
    type: String,
    trim: true
  },
  atr: {
    type: String,
    trim: true
  },
  diagnosis: {
    type: String,
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  birthdate: {
    type: Date
  },
  fio: {
    type: String,
    trim: true
  },
  has063: {
    type: Boolean,
    default: false
  },
  groupId: {
    type: Schema.Types.ObjectId,
    ref: 'Group',
    index: true
  }
}, {
  timestamps: true
});


export default mongoose.model<IMantouxJournal>('MantouxJournal', MantouxJournalSchema, 'mantoux_journals');