import mongoose, { Schema, Document, Date } from 'mongoose';
import User from '../users/user.model';

export interface ISettings extends Document {
  key: string; // Ключ настройки
  value: any; // Значение настройки
  type: 'string' | 'number' | 'boolean' | 'object' | 'array'; // Тип значения
  description?: string; // Описание настройки
  category: string; // Категория настройки (например: general, attendance, payroll)
  isPublic: boolean; // Может ли быть доступна клиенту
  createdAt: Date;
  updatedAt: Date;
}

const SettingsSchema: Schema = new Schema({
  key: { 
    type: String, 
    required: [true, 'Ключ настройки обязателен'],
    trim: true,
    unique: true,
    maxlength: [100, 'Ключ настройки не может превышать 100 символов'],
    index: true
  },
  value: { 
    type: Schema.Types.Mixed // Произвольное значение
  },
  type: {
    type: String,
    required: [true, 'Тип значения обязателен'],
    enum: ['string', 'number', 'boolean', 'object', 'array'],
    index: true
  },
  description: { 
    type: String,
    maxlength: [500, 'Описание настройки не может превышать 500 символов']
  },
  category: { 
    type: String, 
    required: [true, 'Категория настройки обязательна'],
    trim: true,
    index: true
  },
  isPublic: { 
    type: Boolean, 
    default: false,
    index: true
  }
}, { timestamps: true });

// Индексы для поиска
SettingsSchema.index({ key: 'text', description: 'text' });
SettingsSchema.index({ category: 1, isPublic: 1 });

export default mongoose.model<ISettings>('settings', SettingsSchema);