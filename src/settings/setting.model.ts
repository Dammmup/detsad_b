import mongoose, { Schema, Document, Date } from 'mongoose';

export interface ISetting extends Document {
  key: string; // Ключ настройки
  value: any; // Значение настройки
  type: 'string' | 'number' | 'boolean' | 'object' | 'array'; // Тип значения
  description?: string; // Описание настройки
  category: string; // Категория настройки (например: general, attendance, payroll)
  isPublic: boolean; // Может ли быть доступна клиенту
  createdAt: Date;
  updatedAt: Date;
}

const SettingSchema: Schema = new Schema({
  key: { 
    type: String, 
    required: [true, 'Ключ настройки обязателен'],
    trim: true,
    unique: true,
    maxlength: [100, 'Ключ настройки не может превышать 100 символов']
  },
  value: { 
    type: Schema.Types.Mixed // Произвольное значение
  },
  type: {
    type: String,
    enum: ['string', 'number', 'boolean', 'object', 'array'],
    required: true
  },
  description: { 
    type: String,
    maxlength: [500, 'Описание настройки не может превышать 500 символов']
  },
 category: { 
    type: String, 
    required: [true, 'Категория настройки обязательна'],
    trim: true
  },
  isPublic: { 
    type: Boolean, 
    default: false 
  }
}, { timestamps: true });

export default mongoose.model<ISetting>('settings', SettingSchema);