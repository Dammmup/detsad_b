import mongoose, { Schema, Document } from 'mongoose';

export interface IGroup extends Document {
  name: string;
  description?: string;
 ageRange?: string;
  ageGroup?: string;
  capacity?: number;
 maxStudents?: number;
  isActive: boolean;
 teacherId?: mongoose.Types.ObjectId;
  assistantId?: mongoose.Types.ObjectId;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// Интерфейс для групп с детьми
export interface IGroupWithChildren {
  _id: string;
  name: string;
  description?: string;
  ageRange?: string;
  ageGroup?: string;
  capacity?: number;
  maxStudents?: number;
  isActive: boolean;
  teacherId?: string;
  assistantId?: string;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
  children?: any[]; // Массив детей в группе
}

// Расширяем интерфейс для операций создания/обновления, чтобы включить вспомогательные поля
export interface IGroupInput extends Partial<IGroup> {
  teacher?: string; // Поле для передачи в запросе, которое будет преобразовано в teacherId
}

const GroupSchema: Schema = new Schema({
 name: {
    type: String,
    required: [true, 'Название группы обязательно'],
    unique: true,
    trim: true,
    maxlength: [100, 'Название группы не может превышать 100 символов'],
    index: true
  },
  description: String,
  ageRange: String,
  ageGroup: String,
  capacity: {
    type: Number,
    min: [0, 'Вместимость не может быть отрицательной']
  },
  maxStudents: {
    type: Number,
    min: [0, 'Максимальное количество студентов не может быть отрицательным']
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  teacherId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  assistantId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    index: true
  }
}, {
  timestamps: true
});

// Добавим индекс для поиска по названию группы

export default mongoose.model<IGroup>('Group', GroupSchema, 'groups');