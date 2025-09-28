import mongoose, { Schema, Document } from 'mongoose';

export interface InfectiousDiseaseRecordDoc extends Document {
  childId: string;
  fio: string;
  birthdate: string;
  diagnosis: string;
  date: string;
  group: string;
  quarantine_days: number;
  observation: string;
  notes?: string;
}

const InfectiousDiseaseRecordSchema = new Schema<InfectiousDiseaseRecordDoc>({
  childId: { type: String, required: true },
  fio: { type: String, required: true },
  birthdate: { type: String, required: true },
  diagnosis: { type: String, required: true },
  date: { type: String, required: true },
  group: { type: String, required: true },
  quarantine_days: { type: Number, default: 0 },
  observation: { type: String, default: '' },
  notes: { type: String, default: '' },
}, { timestamps: true });

export default mongoose.model<InfectiousDiseaseRecordDoc>('InfectiousDiseaseRecord', InfectiousDiseaseRecordSchema);
