import mongoose, { Schema, Document } from 'mongoose';

export interface IMantouxJournal extends Document {
  childId: mongoose.Types.ObjectId;
  date: Date;
  reactionSize: number; // mm
  reactionType: 'negative' | 'positive' | 'hyperergic';
  injectionSite: string;
  doctor: mongoose.Types.ObjectId;
  notes?: string;
  attachments?: string[];
  status: 'pending' | 'completed' | 'reviewed';
  nextAppointmentDate?: Date;
  recommendations?: string;
  createdAt: Date;
  updatedAt: Date;
}

const MantouxJournalSchema = new Schema<IMantouxJournal>({
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



export default mongoose.model<IMantouxJournal>('MantouxJournal', MantouxJournalSchema, 'mantoux_journals');