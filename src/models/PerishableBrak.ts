import { Schema, model, Document } from 'mongoose';

export interface IPerishableBrak extends Document {
  date: Date;
  product: string;
  assessment: string;
  expiry: Date;
  notes?: string;
}

const PerishableBrakSchema = new Schema<IPerishableBrak>({
  date: { type: Date, required: true },
  product: { type: String, required: true },
  assessment: { type: String, required: true },
  expiry: { type: Date, required: true },
  notes: { type: String },
});

export default model<IPerishableBrak>('PerishableBrak', PerishableBrakSchema);