import mongoose, { Schema, Document, Date } from 'mongoose';
import User from '../users/user.model';

export interface IEvent extends Document {
  title: string; // Название события
  description?: string; // Описание события
  startDate: Date; // Дата и время начала
  endDate: Date; // Дата и время окончания
  eventType: 'holiday' | 'meeting' | 'activity' | 'maintenance' | 'other'; // Тип события
  location?: string; // Место проведения
  participants?: mongoose.Types.ObjectId[]; // Участники
  organizer: mongoose.Types.ObjectId; // Организатор
  isAllDay: boolean; // Весь день
  isRecurring?: boolean; // Повторяющееся событие
  recurrencePattern?: 'daily' | 'weekly' | 'monthly' | 'yearly'; // Паттерн повторения
  recurrenceEndDate?: Date; // Дата окончания повторения
  notificationsEnabled: boolean; // Включены ли уведомления
  notificationTime?: number; // За сколько минут до события уведомлять (по умолчанию 30)
  notes?: string; // Примечания
  attachments?: string[]; // Вложения
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled'; // Статус события
  createdAt: Date;
  updatedAt: Date;
}

const EventSchema: Schema = new Schema({
  title: { 
    type: String, 
    required: [true, 'Название события обязательно'],
    trim: true,
    maxlength: [200, 'Название события не может превышать 200 символов'],
    index: true
  },
  description: { 
    type: String,
    maxlength: [1000, 'Описание события не может превышать 1000 символов']
  },
  startDate: { 
    type: Date, 
    required: [true, 'Дата и время начала обязательны'],
    index: true
  },
  endDate: { 
    type: Date, 
    required: [true, 'Дата и время окончания обязательны']
  },
  eventType: {
    type: String,
    required: [true, 'Тип события обязателен'],
    enum: ['holiday', 'meeting', 'activity', 'maintenance', 'other'],
    index: true
  },
  location: { 
    type: String,
    maxlength: [200, 'Место проведения не может превышать 200 символов']
  },
  participants: [{ 
    type: Schema.Types.ObjectId, 
    ref: 'users' 
  }],
  organizer: { 
    type: Schema.Types.ObjectId, 
    ref: 'users',
    required: [true, 'Организатор обязателен']
  },
  isAllDay: { 
    type: Boolean, 
    default: false,
    index: true
  },
  isRecurring: { 
    type: Boolean, 
    default: false,
    index: true
  },
  recurrencePattern: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'yearly']
  },
  recurrenceEndDate: { 
    type: Date 
  },
  notificationsEnabled: { 
    type: Boolean, 
    default: true,
    index: true
  },
  notificationTime: { 
    type: Number,
    default: 30,
    min: [0, 'Время уведомления не может быть отрицательным'],
    max: [1440, 'Время уведомления не может превышать 1440 минут (24 часа)']
  },
  notes: {
    type: String,
    maxlength: [500, 'Примечания не могут превышать 500 символов']
  },
  attachments: [{
    type: String
  }],
  status: {
    type: String,
    required: [true, 'Статус события обязателен'],
    enum: ['planned', 'in_progress', 'completed', 'cancelled'],
    default: 'planned',
    index: true
  }
}, { timestamps: true });

// Индекс для поиска событий по дате
EventSchema.index({ startDate: 1, endDate: 1 });

export default mongoose.model<IEvent>('events', EventSchema);