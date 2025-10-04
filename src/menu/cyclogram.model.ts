import mongoose, { Schema, Document, Date } from 'mongoose';
import User from '../users/user.model';

export interface ICyclogram extends Document {
  name: string; // Название циклограммы
  description?: string; // Описание
  startDate: Date; // Дата начала действия
  endDate?: Date; // Дата окончания действия
  isActive: boolean; // Активна ли циклограмма
  ageGroup: 'infants' | 'toddlers' | 'preschoolers' | 'all'; // Возрастная группа
  daysOfWeek: ('monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday')[]; // Дни недели
  meals: {
    type: 'breakfast' | 'lunch' | 'afternoon_snack' | 'dinner';
    time: string; // Время приема пищи (HH:mm)
    menuItems: mongoose.Types.ObjectId[]; // Блюда
    notes?: string; // Примечания
  }[]; // Приемы пищи
  notes?: string; // Общие примечания
  createdBy: mongoose.Types.ObjectId; // Кто создал
  updatedBy?: mongoose.Types.ObjectId; // Кто обновил
  createdAt: Date;
  updatedAt: Date;
}

const CyclogramSchema: Schema = new Schema({
  name: { 
    type: String, 
    required: [true, 'Название циклограммы обязательно'],
    trim: true,
    maxlength: [100, 'Название циклограммы не может превышать 100 символов'],
    index: true
  },
  description: { 
    type: String,
    maxlength: [500, 'Описание циклограммы не может превышать 500 символов']
  },
  startDate: { 
    type: Date, 
    required: [true, 'Дата начала обязательна'],
    index: true
  },
  endDate: { 
    type: Date 
  },
  isActive: { 
    type: Boolean, 
    default: true,
    index: true
  },
  ageGroup: {
    type: String,
    required: [true, 'Возрастная группа обязательна'],
    enum: ['infants', 'toddlers', 'preschoolers', 'all'],
    index: true
  },
  daysOfWeek: [{
    type: String,
    enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
  }],
  meals: [{
    type: {
      type: String,
      required: [true, 'Тип приема пищи обязателен'],
      enum: ['breakfast', 'lunch', 'afternoon_snack', 'dinner']
    },
    time: { 
      type: String,
      required: [true, 'Время приема пищи обязательно'],
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Неверный формат времени (HH:mm)']
    },
    menuItems: [{ 
      type: Schema.Types.ObjectId, 
      ref: 'menuItems' 
    }],
    notes: { 
      type: String,
      maxlength: [200, 'Примечания не могут превышать 200 символов']
    }
  }],
  notes: {
    type: String,
    maxlength: [1000, 'Примечания не могут превышать 1000 символов']
  },
  createdBy: { 
    type: Schema.Types.ObjectId, 
    ref: 'users',
    required: [true, 'Создатель циклограммы обязателен'],
    index: true
  },
  updatedBy: { 
    type: Schema.Types.ObjectId, 
    ref: 'users',
    index: true
  }
}, { timestamps: true });

// Индексы для поиска
CyclogramSchema.index({ name: 'text', description: 'text' });
CyclogramSchema.index({ isActive: 1, ageGroup: 1 });
CyclogramSchema.index({ startDate: 1, endDate: 1 });

export default mongoose.model<ICyclogram>('cyclograms', CyclogramSchema);