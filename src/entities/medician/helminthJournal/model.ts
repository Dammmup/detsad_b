import mongoose, { Schema, Document } from 'mongoose';
export interface IHelminthJournalCreate {
  childId: mongoose.Types.ObjectId;
  date: Date;
  result?: string;
  notes?: string;
  examType?: string;
  month?: string;
  year?: string;
  groupId?: mongoose.Types.ObjectId;
}

export interface IHelminthJournal extends Document, IHelminthJournalCreate {
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
  },
  month: {
    type: String,
    trim: true
  },
  year: {
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


export default mongoose.model<IHelminthJournal>('HelminthJournal', HelminthJournalSchema, 'helminth_journals');