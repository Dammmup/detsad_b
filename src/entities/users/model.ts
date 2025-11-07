import mongoose, { Schema, Document } from 'mongoose';
import { createModelFactory } from '../../config/database';

export interface IUser extends Document {
  phone: string;
  fullName: string;
 password: string;
 passwordHash?: string;
  initialPassword?: string;
  role: string;
  active: boolean;
  lastLogin?: Date;
  createdAt: Date;
 updatedAt: Date;
 // Дополнительные поля из старой модели
 uniqNumber?: string;
  notes?: string;
 iin?: string;
  groupId?: mongoose.Types.ObjectId;
  // Поля из auth модели
  birthday?: Date;
 photo?: string;
 tenant?: boolean; // Для арендаторов
  telegramChatId?: string;
 telegramLinkCode?: string;
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
    enum: ['admin', 'teacher', 'assistant', 'nurse', 'cook', 'cleaner', 'security', 'psychologist', 'music_teacher', 'physical_teacher', 'staff', 'parent', 'child', 'rent'],
    default: 'staff',
    index: true
  },
  active: {
    type: Boolean,
    default: true
  },
  lastLogin: Date,
 // Дополнительные поля из старой модели
  uniqNumber: {
    type: String,
    index: true
  },
  notes: String,
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
  photo: { type: String },
 tenant: {
    type: Boolean,
    default: false,
    index: true
  },
  telegramChatId: {
    type: String,
    required: false
  },
  telegramLinkCode: {
    type: String,
    required: false
 }

}, {
  timestamps: true
});

// Создаем фабрику модели для отложенного создания модели после подключения к базе данных
const createUserModel = createModelFactory<IUser>(
  'User',
  UserSchema,
  'users',
  'default'
);

// Экспортируем фабрику, которая будет создавать модель после подключения
export default createUserModel;