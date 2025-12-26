import mongoose, { Schema, Document } from 'mongoose';
export interface ISomaticJournal extends Document {
  childId: mongoose.Types.ObjectId;
  date: Date;
  diagnosis?: string;
  fromDate?: Date;
  toDate?: Date;
  days?: number;
  notes?: string;
  fio?: string;
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
  }
}, {
  timestamps: true
});


export default mongoose.model<ISomaticJournal>('SomaticJournal', SomaticJournalSchema, 'somatic_journals');