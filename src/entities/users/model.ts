import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  phone: string;
  fullName: string;
  password: string;
  passwordHash?: string;
  initialPassword?: string;
  role: string;
  avatar?: string;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  // Дополнительные поля из старой модели
  uniqNumber?: string;
  notes?: string;
  active: boolean;
  iin?: string;
  groupId?: mongoose.Types.ObjectId;
  // Поля из auth модели
  birthday?: Date;
  photo?: string;
}

const UserSchema: Schema = new Schema({
  phone: {
    type: String,
    required: [true, 'Телефон обязателен'],
    unique: true,
    trim: true,
    index: true
  },
  fullName: {
    type: String,
    required: [true, 'Имя обязательно'],
    trim: true,
    maxlength: [100, 'Имя не может превышать 100 символов']
  },
  password: {
    type: String,
    required: [true, 'Пароль обязателен'],
    minlength: [6, 'Пароль должен содержать не менее 6 символов']
  },
  passwordHash: {
    type: String,
    select: false
  },
  initialPassword: {
    type: String,
    select: false
  },
  role: {
    type: String,
    required: [true, 'Роль обязательна'],
    enum: ['admin', 'teacher', 'assistant', 'nurse', 'cook', 'cleaner', 'security', 'psychologist', 'music_teacher', 'physical_teacher', 'staff', 'parent', 'child'],
    default: 'staff',
    index: true
  },
  avatar: String,
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  lastLogin: Date,
  // Дополнительные поля из старой модели
  uniqNumber: {
    type: String,
    index: true
  },
  notes: String,
  active: {
    type: Boolean,
    default: true
  },
  iin: {
    type: String,
    index: true
  },
  groupId: {
    type: Schema.Types.ObjectId,
    ref: 'Group',
    index: true
  },
  // Поля из auth модели
  birthday: { type: Date },
  photo: { type: String }

}, {
  timestamps: true
});



export default mongoose.model<IUser>('User', UserSchema, 'users');