import mongoose, { Schema, Document } from 'mongoose';
export interface ISomaticJournalCreate {
  childId: Schema.Types.ObjectId;
  date: Date;
  diagnosis?: string;
  fromDate?: Date;
  toDate?: Date;
  days?: number;
  notes?: string;
  fio?: string;
  groupId?: Schema.Types.ObjectId;
}

export interface ISomaticJournal extends Document, ISomaticJournalCreate {
  createdAt: Date;
  updatedAt: Date;
}

const SomaticJournalSchema = new Schema<ISomaticJournal>({
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
  diagnosis: {
    type: String,
    trim: true,
    maxlength: [200, 'Диагноз не может превышать 200 символов']
  },
  fromDate: {
    type: Date
  },
  toDate: {
    type: Date
  },
  days: {
    type: Number,
    min: 0
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


export default mongoose.model<ISomaticJournal>('SomaticJournal', SomaticJournalSchema, 'somatic_journals');