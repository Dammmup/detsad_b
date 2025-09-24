import mongoose, { Schema, Document, Date } from 'mongoose';

export interface IFine extends Document {
  amount: number;
  reason: string;
  date: Date;
  type: 'late' | 'other';
  approved: boolean;
  createdBy: mongoose.Types.ObjectId;
  notes?: string;
}

export interface IUser extends Document {
  // Основная информация
  fullName: string;
  phone: string;

  // Хэш пароля (только для сотрудников и прочих взрослых пользователей)
  passwordHash?: string; // Хэш пароля

  // Первичный пароль (plaintext) для админа, удаляется после смены
  initialPassword?: string;

  // Тип пользователя и роль
  type: 'adult' | 'child';  // Взрослый (сотрудник) или ребенок
  role: string;  // Для взрослых: admin, teacher, assistant, cook, cleaner, security, nurse, manager
                 // Для детей: child
  
  // Общие поля
  active: boolean;
  photo?: string;
  birthday?: Date;
  notes?: string;

  // Поля для сотрудников (type: 'adult')
  salary?: number;
  totalFines: number;
  
  // Поля для детей (type: 'child')
  parentName?: string;
  parentPhone?: string;  // Номер телефона родителя
  groupId?: mongoose.Types.ObjectId;  // Группа ребенка
  iin?: string;
  
  // Служебные поля
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;  // Последний вход
}

const UserSchema: Schema = new Schema({
  // Основная информация
  fullName: { 
    type: String, 
    required: [true, 'Полное имя обязательно'],
    trim: true,
    maxlength: [100, 'Полное имя не может превышать 100 символов']
  },
  phone: { 
    type: String, 
    required: [true, 'Номер телефона обязателен'],
    trim: true,
    index: true
  },
  
  // Хэш пароля (только для сотрудников и прочих взрослых пользователей)
  passwordHash: {
    type: String,
    required: function(this: IUser) { return this.type === 'adult'; },
    select: false // исключаем по умолчанию из выборок
  },
  // Первичный пароль (plaintext) – виден только при выборке с '+initialPassword'
  initialPassword: { type: String, select: false },
  
  // Данные последнего логина
  lastLogin: { type: Date },
  
  // Тип пользователя и роль
  type: {
    type: String,
    enum: ['adult', 'child'],
    required: [true, 'Тип пользователя обязателен'],
    index: true
  },
  role: {
    type: String,
    required: [true, 'Роль обязательна'],
    enum: {
      values: ['admin', 'manager', 'teacher', 'assistant', 'cook', 'cleaner', 'security', 'nurse', 'child', 'null', 'doctor', 'psychologist','intern'],
      message: 'Неверная роль: {VALUE}'
    },
    index: true
  },
  
  // Общие поля
  active: { type: Boolean, default: true, index: true },
  photo: { type: String },
  birthday: { type: Date },
  notes: { 
    type: String,
    maxlength: [1000, 'Заметки не могут превышать 1000 символов']
  },
  
  // Поля для сотрудников (type: 'adult')
  salary: { 
    type: Number, 
    default: 0,
    min: [0, 'Зарплата не может быть отрицательной']
  },
  totalFines: { type: Number, default: 0 },
  
  // Поля для детей (type: 'child')
  parentName: { 
    type: String,
    required: function(this: IUser) { return this.type === 'child'; },
    maxlength: [100, 'Имя родителя не может превышать 100 символов']
  },
  parentPhone: { 
    type: String,
    validate: {
      validator: function(this: IUser, v: string) {
        return this.type !== 'child' || (v && v.length > 0);
      },
      message: 'Номер родителя обязателен для детей'
    }
  },
  groupId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Group',
    required: function(this: IUser) { return this.type === 'child'; }
  },
  iin: { 
    type: String,
    unique: true,
    trim: true,
    index: true
  },
}, { timestamps: true });

export default mongoose.model<IUser>('users', UserSchema);
