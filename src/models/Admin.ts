import mongoose, { Schema, Document } from 'mongoose';

export interface IAdmin extends Document {
  login: string;
  password: string;
}

const AdminSchema: Schema = new Schema({
  login: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

export default mongoose.model<IAdmin>('Admin', AdminSchema, 'admins');
