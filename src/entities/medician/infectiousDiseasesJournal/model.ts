import mongoose, { Schema, Document } from 'mongoose';
export interface IInfectiousDiseasesJournal extends Document {
  childId: mongoose.Types.ObjectId;
  date: Date;
  disease?: string;
  diagnosis?: string;
  notes?: string;
  fio?: string;
  createdAt: Date;
  updatedAt: Date;
}

const InfectiousDiseasesJournalSchema = new Schema<IInfectiousDiseasesJournal>({
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
  disease: {
    type: String,
    trim: true,
    maxlength: [100, 'Название заболевания не может превышать 100 символов']
  },
  diagnosis: {
    type: String,
    trim: true,
    maxlength: [200, 'Диагноз не может превышать 200 символов']
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


export default mongoose.model<IInfectiousDiseasesJournal>('InfectiousDiseasesJournal', InfectiousDiseasesJournalSchema, 'infectious_diseases_journals');