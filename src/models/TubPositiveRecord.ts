import mongoose, { Schema, Document } from 'mongoose';

export interface TubPositiveRecordDoc extends Document {
  childId: string;
  fio: string;
  birthdate: string;
  group: string;
  date: string;
  referral: string;
  doctor: string;
  notes?: string;
}

const TubPositiveRecordSchema = new Schema<TubPositiveRecordDoc>({
  childId: { type: String, required: true },
  fio: { type: String, required: true },
  birthdate: { type: String, required: true },
  group: { type: String, required: true },
  date: { type: String, required: true },
  referral: { type: String, default: '' },
  doctor: { type: String, default: '' },
  notes: { type: String, default: '' },
}, { timestamps: true });

export default mongoose.model<TubPositiveRecordDoc>('TubPositiveRecord', TubPositiveRecordSchema);
