import mongoose, { Schema, Document } from 'mongoose';

export interface SomaticRecordDoc extends Document {
  childId: string;
  fio: string;
  birthdate: string;
  fromDate: string;
  toDate: string;
  diagnosis: string;
  date: string;
  notes?: string;
  days?: number;
  address: string;
}

const SomaticRecordSchema = new Schema<SomaticRecordDoc>({
  childId: { type: String, required: true },
  fio: { type: String, required: true },
  birthdate: { type: String, required: true },
  fromDate: { type: String, required: true },
  toDate: { type: String, required: true },
  diagnosis: { type: String, required: true },
  date: { type: String, default: '' },
  notes: { type: String, default: '' },
  days: { type: Number, default: 0 },
  address: { type: String, default: '' },
}, { timestamps: true });

export default mongoose.model<SomaticRecordDoc>('SomaticRecord', SomaticRecordSchema);