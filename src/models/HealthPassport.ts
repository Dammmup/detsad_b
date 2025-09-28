import mongoose, { Schema, Document } from 'mongoose';

export interface HealthPassportDoc extends Document {
  childId: string;
  fio: string;
  birthdate: string;
  group: string;
  main_diagnosis: string;
  vaccinations: string;
  notes?: string;
}

const HealthPassportSchema = new Schema<HealthPassportDoc>({
  childId: { type: String, required: true },
  fio: { type: String, required: true },
  birthdate: { type: String, required: true },
  group: { type: String, required: true },
  main_diagnosis: { type: String, default: '' },
  vaccinations: { type: String, default: '' },
  notes: { type: String, default: '' },
}, { timestamps: true });

export default mongoose.model<HealthPassportDoc>('HealthPassport', HealthPassportSchema);