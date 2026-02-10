import mongoose, { Schema, Document } from 'mongoose';
export interface ITubPositiveJournalCreate {
  childId: mongoose.Types.ObjectId;
  date: Date;
  result?: string;
  notes?: string;
  fio?: string;
  groupId?: mongoose.Types.ObjectId;
}

export interface ITubPositiveJournal extends Document, ITubPositiveJournalCreate {
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
  },
  groupId: {
    type: Schema.Types.ObjectId,
    ref: 'Group',
    index: true
  }
}, {
  timestamps: true
});


export default mongoose.model<ITubPositiveJournal>('TubPositiveJournal', TubPositiveJournalSchema, 'tub_positive_journals');