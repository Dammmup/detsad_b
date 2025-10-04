import mongoose, { Schema, Document, Date } from 'mongoose';
import User from '../users/user.model';

export interface IGroup extends Document {
  name: string; // Название группы
  description?: string; // Описание группы
  teacherId?: mongoose.Types.ObjectId; // Воспитатель
  assistantTeacherId?: mongoose.Types.ObjectId; // Помощник воспитателя
  maxChildren: number; // Максимальное количество детей
  currentChildrenCount: number; // Текущее количество детей
  schedule?: any; // Расписание группы
  notes?: string; // Заметки
  active: boolean; // Активна ли группа
  ageGroup: 'infants' | 'toddlers' | 'preschoolers'; // Возрастная группа
  roomNumber?: string; // Номер комнаты/помещения
  createdAt: Date;
 updatedAt: Date;
  
  // Поля для совместимости с фронтендом
  maxStudents?: number; // Максимальное количество студентов (альтернатива maxChildren)
  isActive?: boolean; // Активна ли группа (альтернатива active)
  ageGroups?: string[]; // Возрастные группы (альтернатива ageGroup)
}

const GroupSchema: Schema = new Schema({
  name: {
    type: String,
    required: [true, 'Название группы обязательно'],
    trim: true,
    unique: true,
    maxlength: [100, 'Название группы не может превышать 100 символов'],
    index: true
  },
  description: {
    type: String,
    maxlength: [500, 'Описание группы не может превышать 500 символов']
  },
  teacherId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  assistantTeacherId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  maxChildren: {
    type: Number,
    default: 20,
    min: [1, 'Максимальное количество детей должно быть не меньше 1'],
    index: true
  },
  currentChildrenCount: {
    type: Number,
    default: 0,
    min: [0, 'Текущее количество детей не может быть отрицательным'],
    index: true
  },
  schedule: {
    type: Schema.Types.Mixed // Расписание группы
 },
  notes: {
    type: String,
    maxlength: [1000, 'Заметки не могут превышать 1000 символов']
  },
  active: {
    type: Boolean,
    default: true,
    index: true
  },
  ageGroup: {
    type: String,
    required: [true, 'Возрастная группа обязательна'],
    enum: ['infants', 'toddlers', 'preschoolers'],
    index: true
  },
  roomNumber: {
    type: String,
    trim: true,
    maxlength: [20, 'Номер комнаты не может превышать 20 символов'],
    index: true
  },
  
  // Поля для совместимости с фронтендом
  maxStudents: {
    type: Number,
    default: 20,
    min: [1, 'Максимальное количество студентов должно быть не меньше 1'],
    index: true
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  ageGroups: [{
    type: String,
    trim: true,
    maxlength: [50, 'Возрастная группа не может превышать 50 символов'],
    index: true
  }]
}, { timestamps: true });

// Индексы для поиска
GroupSchema.index({ name: 'text', description: 'text' });
GroupSchema.index({ active: 1, ageGroup: 1 });
GroupSchema.index({ teacherId: 1, active: 1 });
GroupSchema.index({ assistantTeacherId: 1, active: 1 });
GroupSchema.index({ isActive: 1, ageGroups: 1 }); // Для совместимости с фронтендом

export default mongoose.model<IGroup>('Group', GroupSchema);