import mongoose, { Schema, Document } from 'mongoose';
export interface IHelminthJournal extends Document {
  childId: mongoose.Types.ObjectId;
  date: Date;
  result?: string;
  notes?: string;
  examType?: string;
  createdAt: Date;
  updatedAt: Date;
}

const HelminthJournalSchema = new Schema<IHelminthJournal>({
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
  result: {
    type: String,
    trim: true,
    maxlength: [200, 'Результат не может превышать 200 символов']
  },
  notes: {
    type: String,
    maxlength: [500, 'Заметки не могут превышать 500 символов']
  },
  examType: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});


export default mongoose.model<IHelminthJournal>('HelminthJournal', HelminthJournalSchema, 'helminth_journals');