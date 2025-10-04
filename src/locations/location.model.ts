import mongoose, { Schema, Document, Date } from 'mongoose';
import User from '../users/user.model';

export interface ILocation extends Document {
  name: string; // Название помещения/зоны
  description?: string; // Описание
  type: 'room' | 'playground' | 'kitchen' | 'storage' | 'office' | 'bathroom' | 'hallway' | 'entrance' | 'other'; // Тип помещения
  floor?: number; // Этаж
  capacity?: number; // Вместимость
  area?: number; // Площадь в кв. метрах
  equipment?: string[]; // Оборудование в помещении
  responsiblePersonId?: mongoose.Types.ObjectId; // Ответственное лицо
  isActive: boolean; // Активно ли помещение
  maintenanceSchedule?: {
    cleaning: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'; // График уборки
    disinfection: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'; // График дезинфекции
    ventilation: 'daily' | 'as_needed'; // График проветривания
  }; // График обслуживания
  notes?: string; // Примечания
  tags?: string[]; // Теги для поиска
  createdAt: Date;
  updatedAt: Date;
}

const LocationSchema: Schema = new Schema({
  name: { 
    type: String, 
    required: [true, 'Название помещения обязательно'],
    trim: true,
    maxlength: [100, 'Название помещения не может превышать 100 символов'],
    index: true
  },
  description: { 
    type: String,
    maxlength: [500, 'Описание помещения не может превышать 500 символов']
  },
  type: {
    type: String,
    required: [true, 'Тип помещения обязателен'],
    enum: ['room', 'playground', 'kitchen', 'storage', 'office', 'bathroom', 'hallway', 'entrance', 'other'],
    index: true
  },
  floor: { 
    type: Number,
    min: [-2, 'Этаж не может быть меньше -2'],
    max: [20, 'Этаж не может быть больше 20'],
    index: true
  },
  capacity: { 
    type: Number,
    min: [0, 'Вместимость не может быть отрицательной']
  },
  area: { 
    type: Number,
    min: [0, 'Площадь не может быть отрицательной']
  },
  equipment: [{ 
    type: String,
    trim: true,
    maxlength: [100, 'Оборудование не может превышать 100 символов']
  }],
  responsiblePersonId: { 
    type: Schema.Types.ObjectId, 
    ref: 'users',
    index: true
  },
  isActive: { 
    type: Boolean, 
    default: true,
    index: true
  },
  maintenanceSchedule: {
    cleaning: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'],
      default: 'daily'
    },
    disinfection: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'],
      default: 'weekly'
    },
    ventilation: {
      type: String,
      enum: ['daily', 'as_needed'],
      default: 'daily'
    }
  },
  notes: {
    type: String,
    maxlength: [1000, 'Примечания не могут превышать 1000 символов']
  },
  tags: [{ 
    type: String,
    trim: true,
    maxlength: [50, 'Тег не может превышать 50 символов'],
    index: true
  }]
}, { timestamps: true });

// Индексы для поиска
LocationSchema.index({ name: 'text', description: 'text' });
LocationSchema.index({ type: 1, isActive: 1 });
LocationSchema.index({ responsiblePersonId: 1, type: 1 });

export default mongoose.model<ILocation>('locations', LocationSchema);