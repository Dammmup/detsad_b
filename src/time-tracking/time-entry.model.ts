import mongoose, { Schema, Document, Date } from 'mongoose';
import User from '../users/user.model';

export interface ITimeEntry extends Document {
  userId: mongoose.Types.ObjectId; // Ссылка на пользователя
  date: Date; // Дата
  startTime: Date; // Время начала
  endTime?: Date; // Время окончания
  duration?: number; // Продолжительность в минутах
  activityType: 'work' | 'break' | 'meeting' | 'training' | 'other'; // Тип деятельности
  description?: string; // Описание
  projectId?: mongoose.Types.ObjectId; // Ссылка на проект (если применимо)
  taskId?: mongoose.Types.ObjectId; // Ссылка на задачу (если применимо)
  locationId?: mongoose.Types.ObjectId; // Ссылка на место (если применимо)
  status: 'active' | 'completed' | 'paused' | 'cancelled'; // Статус записи
  notes?: string; // Примечания
  tags?: string[]; // Теги для поиска
  isBillable: boolean; // Оплачиваемая ли деятельность
  hourlyRate?: number; // Почасовая ставка (если применимо)
  totalAmount?: number; // Общая сумма (если применимо)
  approved: boolean; // Утверждена ли запись
  approvedBy?: mongoose.Types.ObjectId; // Кто утвердил
  approvedAt?: Date; // Дата утверждения
  createdAt: Date;
  updatedAt: Date;
}

const TimeEntrySchema: Schema = new Schema({
  userId: { 
    type: Schema.Types.ObjectId, 
    ref: 'users',
    required: [true, 'ID пользователя обязателен'],
    index: true
  },
  date: { 
    type: Date, 
    required: [true, 'Дата обязательна'],
    index: true
  },
  startTime: { 
    type: Date, 
    required: [true, 'Время начала обязательно'],
    index: true
  },
  endTime: { 
    type: Date,
    index: true
  },
  duration: { 
    type: Number,
    min: [0, 'Продолжительность не может быть отрицательной'],
    index: true
  },
  activityType: {
    type: String,
    required: [true, 'Тип деятельности обязателен'],
    enum: ['work', 'break', 'meeting', 'training', 'other'],
    index: true
  },
  description: { 
    type: String,
    maxlength: [500, 'Описание не может превышать 500 символов']
  },
  projectId: { 
    type: Schema.Types.ObjectId, 
    ref: 'projects',
    index: true
  },
  taskId: { 
    type: Schema.Types.ObjectId, 
    ref: 'tasks',
    index: true
  },
  locationId: { 
    type: Schema.Types.ObjectId, 
    ref: 'locations',
    index: true
  },
  status: {
    type: String,
    required: [true, 'Статус записи обязателен'],
    enum: ['active', 'completed', 'paused', 'cancelled'],
    default: 'active',
    index: true
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
  }],
  isBillable: { 
    type: Boolean, 
    default: true,
    index: true
  },
  hourlyRate: { 
    type: Number,
    min: [0, 'Почасовая ставка не может быть отрицательной']
  },
  totalAmount: { 
    type: Number,
    min: [0, 'Общая сумма не может быть отрицательной']
  },
  approved: { 
    type: Boolean, 
    default: false,
    index: true
  },
  approvedBy: { 
    type: Schema.Types.ObjectId, 
    ref: 'users',
    index: true
  },
  approvedAt: { 
    type: Date,
    index: true
  }
}, { timestamps: true });

// Индексы для поиска
TimeEntrySchema.index({ userId: 1, date: -1 });
TimeEntrySchema.index({ startTime: 1, endTime: 1 });
TimeEntrySchema.index({ activityType: 1, status: 1 });
TimeEntrySchema.index({ approved: 1, date: -1 });

export default mongoose.model<ITimeEntry>('timeEntries', TimeEntrySchema);