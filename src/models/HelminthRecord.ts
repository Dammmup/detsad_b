import mongoose, { Schema, Document } from 'mongoose';

export interface HelminthRecordDoc extends Document {
  childId: string;
  fio: string;
  birthdate: string;
  address: string;
  month: string;
  year: string;
  examType: 'primary' | 'annual';
  result: 'positive' | 'negative';
  notes?: string;
}

const HelminthRecordSchema = new Schema<HelminthRecordDoc>({
  childId: { type: String, required: true },
  fio: { type: String, required: true },
  birthdate: { type: String, required: true },
  address: { type: String, default: '' },
  month: { type: String, required: true },
  year: { type: String, required: true },
  examType: { type: String, enum: ['primary', 'annual'], required: true },
  result: { type: String, enum: ['positive', 'negative'], required: true },
  notes: { type: String, default: '' },
}, { timestamps: true });

export default mongoose.model<HelminthRecordDoc>('HelminthRecord', HelminthRecordSchema);