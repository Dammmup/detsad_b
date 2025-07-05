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
  status?: string;
  cardColor?: string;
  access: boolean;
  blocked: boolean;
  emailVerified: boolean;
  lastLogin?: Date;
  gender: string;
  telegram?: string;
  whatsapp?: string;
  email: string;
  birthday?: string;
  notes?: string;
  coursesCompleted: number;
  createdAt: Date;
  completedLessons: mongoose.Types.ObjectId[];
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
  email: { type: String, required: true, unique: true },
  birthday: { type: String },
  notes: { type: String },
  status: { type: String, default: '' },
  cardColor: { type: String, default: '#1890ff' },
  access: { type: Boolean, default: false },
  coursesCompleted: { type: Number, default: 0 },
  completedLessons: { type: [mongoose.Schema.Types.ObjectId], default: [] },
  createdAt: { type: Date, required: true },
  level: { type: String, enum: ['none', 'beginner', 'intermediate', 'advanced', 'speaking'], default: 'none' },
});

export default mongoose.model<IUser>('users', UserSchema);
