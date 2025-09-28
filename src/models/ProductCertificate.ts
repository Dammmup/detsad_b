import { Schema, model, Document } from 'mongoose';

export interface IProductCertificate extends Document {
  number: string;
  date: Date;
  expiry: Date;
  product: string;
  control?: string;
}

const ProductCertificateSchema = new Schema<IProductCertificate>({
  number: { type: String, required: true },
  date: { type: Date, required: true },
  expiry: { type: Date, required: true },
  product: { type: String, required: true },
  control: { type: String },
});

export default model<IProductCertificate>('ProductCertificate', ProductCertificateSchema);