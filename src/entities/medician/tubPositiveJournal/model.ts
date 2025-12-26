import mongoose, { Schema, Document } from 'mongoose';
export interface ITubPositiveJournal extends Document {
  childId: mongoose.Types.ObjectId;
  date: Date;
  result?: string;
  notes?: string;
  fio?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TubPositiveJournalSchema = new Schema<ITubPositiveJournal>({
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
  fio: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});


export default mongoose.model<ITubPositiveJournal>('TubPositiveJournal', TubPositiveJournalSchema, 'tub_positive_journals');