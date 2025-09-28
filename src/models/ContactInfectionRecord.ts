import mongoose, { Schema, Document } from 'mongoose';

export interface ContactInfectionRecordDoc extends Document {
  childId: string;
  fio: string;
  birthdate: string;
  group: string;
  date: string;
  symptoms: string;
  stool: string;
  notes?: string;
}

const ContactInfectionRecordSchema = new Schema<ContactInfectionRecordDoc>({
  childId: { type: String, required: true },
  fio: { type: String, required: true },
  birthdate: { type: String, required: true },
  group: { type: String, required: true },
  date: { type: String, required: true },
  symptoms: { type: String, default: '' },
  stool: { type: String, default: '' },
  notes: { type: String, default: '' },
}, { timestamps: true });

export default mongoose.model<ContactInfectionRecordDoc>('ContactInfectionRecord', ContactInfectionRecordSchema);
