import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  username: string;
  passwordHash?: string;
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
  access: boolean;
  coursesCompleted: number;
  createdAt: Date;
  level?: string;
}

const UserSchema: Schema = new Schema({
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
  access: { type: Boolean, default: false },
  coursesCompleted: { type: Number, default: 0 },
  createdAt: { type: Date, required: true },
  level: { type: String },
});

export default mongoose.model<IUser>('users', UserSchema);
