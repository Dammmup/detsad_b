import mongoose, { Schema, Document } from 'mongoose';

export interface VitaminizationRecord extends Document {
  date: Date;
  group: string;
  meal: string;
  dish: string;
  dose: number;
  portions: number;
  nurse: string;
  status: string;
  notes?: string;
}

const VitaminizationSchema = new Schema<VitaminizationRecord>({
  date: { type: Date, required: true },
  group: { type: String, required: true },
  meal: { type: String, required: true },
  dish: { type: String, required: true },
  dose: { type: Number, required: true },
  portions: { type: Number, required: true },
  nurse: { type: String, required: true },
  status: { type: String, required: true },
  notes: { type: String },
}, { timestamps: true });

export default mongoose.model<VitaminizationRecord>('VitaminizationRecord', VitaminizationSchema);