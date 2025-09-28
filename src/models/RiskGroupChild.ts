import mongoose, { Schema, Document } from 'mongoose';

export interface RiskGroupChildDoc extends Document {
  childId: string;
  fio: string;
  birthdate: string;
  group: string;
  address: string;
  reason: string;
  notes?: string;
}

const RiskGroupChildSchema = new Schema<RiskGroupChildDoc>({
  childId: { type: String, required: true },
  fio: { type: String, required: true },
  birthdate: { type: String, required: true },
  group: { type: String, required: true },
  address: { type: String, default: '' },
  reason: { type: String, required: true },
  notes: { type: String, default: '' },
}, { timestamps: true });

export default mongoose.model<RiskGroupChildDoc>('RiskGroupChild', RiskGroupChildSchema);
