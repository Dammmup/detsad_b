import mongoose, { Schema, Document } from 'mongoose';

export interface OrganolepticRecord extends Document {
  date: Date;
  dish: string;
  group: string;
  appearance: string;
  taste: string;
  smell: string;
  decision: string;
  responsibleSignature?: string;
}

const OrganolepticSchema = new Schema<OrganolepticRecord>({
  date: { type: Date, required: true },
  dish: { type: String, required: true },
  group: { type: String, required: true },
  appearance: { type: String, default: '' },
  taste: { type: String, default: '' },
  smell: { type: String, default: '' },
  decision: { type: String, default: '' },
  responsibleSignature: { type: String },
}, { timestamps: true });

export default mongoose.model<OrganolepticRecord>('OrganolepticRecord', OrganolepticSchema);
