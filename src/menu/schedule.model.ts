import mongoose, { Schema, Document, Date } from 'mongoose';
import { ICyclogram } from './cyclogram.model';
import { IMenuItem } from './menu-item.model';

export interface ISchedule extends Document {
  date: Date; // Дата расписания
  cyclogramId: mongoose.Types.ObjectId; // Ссылка на циклограмму
  meals: {
    type: 'breakfast' | 'lunch' | 'afternoon_snack' | 'dinner';
    time: string; // Время приема пищи (HH:mm)
    menuItems: mongoose.Types.ObjectId[]; // Блюда
    plannedQuantity?: number; // Планируемое количество порций
    actualQuantity?: number; // Фактическое количество порций
    notes?: string; // Примечания
  }[]; // Приемы пищи
  notes?: string; // Примечания
  isPublished: boolean; // Опубликовано ли расписание
  publishedAt?: Date; // Дата публикации
  publishedBy?: mongoose.Types.ObjectId; // Кто опубликовал
  createdAt: Date;
  updatedAt: Date;
}

const ScheduleSchema: Schema = new Schema({
  date: { 
    type: Date, 
    required: [true, 'Дата расписания обязательна'],
    unique: true,
    index: true
  },
  cyclogramId: { 
    type: Schema.Types.ObjectId, 
    ref: 'cyclograms',
    required: [true, 'ID циклограммы обязателен']
  },
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
    plannedQuantity: { 
      type: Number,
      min: [0, 'Планируемое количество не может быть отрицательным']
    },
    actualQuantity: { 
      type: Number,
      min: [0, 'Фактическое количество не может быть отрицательным']
    },
    notes: { 
      type: String,
      maxlength: [200, 'Примечания не могут превышать 200 символов']
    }
  }],
  notes: {
    type: String,
    maxlength: [1000, 'Примечания не могут превышать 1000 символов']
  },
  isPublished: { 
    type: Boolean, 
    default: false,
    index: true
  },
  publishedAt: { 
    type: Date 
  },
  publishedBy: { 
    type: Schema.Types.ObjectId, 
    ref: 'users'
  }
}, { timestamps: true });

// Индекс для поиска по дате и опубликованности
ScheduleSchema.index({ date: 1, isPublished: 1 });

export default mongoose.model<ISchedule>('schedules', ScheduleSchema);