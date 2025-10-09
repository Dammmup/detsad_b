import mongoose, { Schema, Document } from 'mongoose';

export interface IHelminthJournal extends Document {
  childId: mongoose.Types.ObjectId;
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

const HelminthJournalSchema = new Schema<IHelminthJournal>({
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
  result: {
    type: String,
    required: true,
    trim: true,
    maxlength: [200, 'Результат не может превышать 200 символов']
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



export default mongoose.model<IHelminthJournal>('HelminthJournal', HelminthJournalSchema, 'helminth_journals');