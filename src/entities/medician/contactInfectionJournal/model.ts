import mongoose, { Schema, Document } from 'mongoose';
export interface IContactInfectionJournalCreate {
  childId: mongoose.Types.ObjectId;
  date: Date;
  infectionType?: string;
  notes?: string;
  fio?: string;
  groupId?: mongoose.Types.ObjectId;
}

export interface IContactInfectionJournal extends Document, IContactInfectionJournalCreate {
  createdAt: Date;
  updatedAt: Date;
}

const ContactInfectionJournalSchema = new Schema<IContactInfectionJournal>({
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
  infectionType: {
    type: String,
    trim: true,
    maxlength: [100, 'Тип инфекции не может превышать 100 символов']
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


export default mongoose.model<IContactInfectionJournal>('ContactInfectionJournal', ContactInfectionJournalSchema, 'contact_infection_journals');