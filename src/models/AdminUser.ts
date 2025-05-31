import mongoose, { Schema, Document } from 'mongoose';

export interface IAdminUser extends Document {
  username: string;
  passwordHash: string | undefined;
  firstName: string;
  lastName: string;
  phone: string;
  country: string;
  language: string;
  photo?: string;
  role: string;
  active: boolean;
  blocked: boolean;
  emailVerified: boolean;
  lastLogin?: Date;
  gender: string;
  telegram?: string;
  whatsapp?: string;
  vk?: string;
  email: string;
  birthday?: string;
  notes?: string;
  access: string;
  coursesCompleted: number;
  createdAt: Date;
}

const AdminUserSchema: Schema = new Schema({
  username: { type: String, required: true, unique: true }, // phone
  passwordHash: { type: String, required: true }, // для соц.регистраций можно не требовать
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  country: { type: String, required: true },
  language: { type: String, required: true },
  photo: { type: String },
  role: { type: String, default: 'student' },
  active: { type: Boolean, default: true },
  blocked: { type: Boolean, default: false },
  emailVerified: { type: Boolean, default: false },
  lastLogin: { type: Date },
  gender: { type: String, default: 'male' },
  telegram: { type: String },
  whatsapp: { type: String },
  vk: { type: String },
  email: { type: String, required: true, unique: true },
  birthday: { type: String },
  notes: { type: String },
  access: { type: String, default: 'none' },
  coursesCompleted: { type: Number, default: 0 },
  createdAt: { type: Date, required: true },
});

export default mongoose.model<IAdminUser>('AdminUser', AdminUserSchema);
