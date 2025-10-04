import mongoose, { Schema, Document, Date } from 'mongoose';
import Group from '../groups/group.model';
import User from '../users/user.model';

export interface IChild extends Document {
  fullName: string; // Полное имя ребенка
  groupId?: mongoose.Types.ObjectId; // Группа ребенка
  birthday?: Date; // Дата рождения
  medicalNotes?: string; // Медицинские заметки
  photo?: string; // Путь к фото
  active: boolean; // Активен ли ребенок
 ageGroup: 'infants' | 'toddlers' | 'preschoolers'; // Возрастная группа
 roomNumber?: string; // Номер комнаты/помещения
  notes?: string; // Примечания
  iin?: string; // ИИН ребенка
  createdAt: Date;
  updatedAt: Date;
}

const ChildSchema: Schema = new Schema({
  fullName: { 
    type: String, 
    required: [true, 'Полное имя ребенка обязательно'],
    trim: true,
    maxlength: [100, 'Полное имя ребенка не может превышать 100 символов'],
    index: true
  },
  groupId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Group',
    index: true
  },
  birthday: {
    type: Date,
    index: true
  },
  medicalNotes: { 
    type: String,
    maxlength: [1000, 'Медицинские заметки не могут превышать 1000 символов']
  },
  photo: { 
    type: String,
    maxlength: [200, 'Путь к фото не может превышать 200 символов']
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
  notes: {
    type: String,
    maxlength: [500, 'Примечания не могут превышать 500 символов']
  },
  iin: { 
    type: String,
    unique: true,
    trim: true,
    index: true,
    maxlength: [12, 'ИИН должен состоять из 12 цифр'],
    minlength: [12, 'ИИН должен состоять из 12 цифр']
  }
}, { timestamps: true });

// Индексы для поиска
ChildSchema.index({ fullName: 'text', parentName: 'text' });
ChildSchema.index({ groupId: 1, active: 1 });
ChildSchema.index({ parentId: 1, active: 1 });
ChildSchema.index({ ageGroup: 1, active: 1 });
ChildSchema.index({ birthday: 1, active: 1 });

export default mongoose.model<IChild>('Child', ChildSchema);