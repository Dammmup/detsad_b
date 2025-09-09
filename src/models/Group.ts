import mongoose, { Schema, Document } from 'mongoose';

export interface IGroup extends Document {
  name: string;
  description: string;
  teacher: mongoose.Types.ObjectId;
  isActive: boolean;
  maxStudents: number;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  ageGroup: string[];
}

const GroupSchema: Schema = new Schema({
  name: { 
    type: String, 
    required: [true, 'Название группы обязательно'],
    trim: true,
    maxlength: [100, 'Название группы не может превышать 100 символов']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Описание не может превышать 1000 символов']
  },
  teacher: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'users', // Исправляем ссылку на модель users
    required: [true, 'Укажите преподавателя группы']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  maxStudents: {
    type: Number,
    min: [1, 'Минимальное количество студентов - 1'],
    default: 15
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users', // Исправляем ссылку на модель users
    required: [true, 'Обязательно указать создателя']
  },
  ageGroup: {
    type: [String],
    required: [true, 'Возрастная группа обязательна'],
    enum: ['1', '2', '3', '4', '5', '6', '7'],
    default: ['1'],
  },

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Индексы для оптимизации запросов
GroupSchema.index({ teacher: 1, isActive: 1 });
GroupSchema.index({ 'schedule.dayOfWeek': 1, 'schedule.startTime': 1 });

// Валидация расписания


export default mongoose.model<IGroup>('Group', GroupSchema, 'groups');
