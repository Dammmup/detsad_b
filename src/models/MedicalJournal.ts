import mongoose, { Schema, Document } from 'mongoose';

export interface IMedicalJournal extends Document {
  name: string;
  description?: string;
  type: string; // тип журнала (температура, дезинфекция и т.д.)
  date: Date;
  entries: Array<{
    time: string; // время или смена
    value: string; // значение (температура, отметка и т.д.)
    staff: mongoose.Types.ObjectId; // кто отметил
    notes?: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const MedicalJournalSchema: Schema = new Schema({
  name: { type: String, required: true },
  description: { type: String },
  type: { type: String, required: true },
  date: { type: Date, required: true },
  entries: [
    {
      time: { type: String, required: true },
      value: { type: String, required: true },
      staff: { type: Schema.Types.ObjectId, ref: 'users', required: true },
      notes: { type: String },
    }
  ]
}, { timestamps: true });

export default mongoose.model<IMedicalJournal>('MedicalJournal', MedicalJournalSchema);
