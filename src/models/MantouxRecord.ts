import mongoose, { Schema, Document } from 'mongoose';

export interface MantouxRecordDoc extends Document {
  childId: string;
  fio: string;
  address: string;
  birthdate: string;
  year: string;
  atr: string;
  diagnosis: string;
  mm: number;
  has063: boolean;
  // createdAt, updatedAt — по умолчанию
}

const MantouxRecordSchema = new Schema<MantouxRecordDoc>({
  childId: { type: String, required: true },
  fio: { type: String, required: true },
  address: { type: String, default: '' },
  birthdate: { type: String, required: true },
  year: { type: String, required: true },
  atr: { type: String, default: '' },
  diagnosis: { type: String, default: '' },
  mm: { type: Number, required: true },
  has063: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model<MantouxRecordDoc>('MantouxRecord', MantouxRecordSchema);