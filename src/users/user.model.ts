import mongoose, { Schema, Document, Date } from 'mongoose';
import Group from '../groups/group.model';

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
  role: string; // Для взрослых: admin, manager, staff, teacher, assistant, cook, cleaner, security, nurse
                  // Для детей: child
  
  // Общие поля
 active: boolean;
 photo?: string;
 birthday?: Date;
  notes?: string;

  salary?: number;
  shiftRate?: number;
  salaryType?: 'day' | 'month' | 'shift' | 'per_day' | 'per_month' | 'per_shift';
  penaltyType?: 'fixed' | 'percent' | 'per_minute' | 'per_5_minutes' | 'per_10_minutes';
  penaltyAmount?: number;
  totalFines?: number;
  latePenalties?: {
    minutes: number;
    amount: number;
    details: Array<{
      date: Date;
      minutes: number;
      amount: number;
      reason?: string;
    }>;
  };

  // Поля, используемые на фронтенде
  isVerified?: boolean;
  avatarUrl?: string;
 fines?: IFine[];
  permissions?: string[];
  username?: string;
  parentPhone?: string;
  parentName?: string;

  groupId?: mongoose.Types.ObjectId; // Группа ребенка
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
    select: false // исключаем по умолчанию из выборок
 },
  // Первичный пароль (plaintext) – виден только при выборке с '+initialPassword'
  initialPassword: { type: String, select: false },
  
  // Данные последнего логина
 lastLogin: { type: Date },
  

  role: {
    type: String,
    required: [true, 'Роль обязательна'],
    enum: {
      values: ['admin', 'manager', 'staff', 'teacher', 'assistant', 'cook', 'cleaner', 'security', 'nurse', 'child', 'doctor', 'psychologist','intern'],
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
  salaryType: {
    type: String,
    enum: ['day', 'month', 'shift'],
    default: 'per_month',
  },
  shiftRate: {
    type: Number,
    default: 0,
    min: [0, 'Ставка за смену не может быть отрицательной']
  },
  penaltyType: {
    type: String,
    enum: ['fixed', 'percent', 'per_minute', 'per_5_minutes', 'per_10_minutes'],
    default: 'per_5_minutes',
  },
  penaltyAmount: {
    type: Number,
    default: 0,
    min: [0, 'Штраф не может быть отрицательным']
  },
  totalFines: {
    type: Number,
    default: 0,
    min: [0, 'Общий штраф не может быть отрицательным']
  },
  latePenalties: {
    minutes: { type: Number, default: 0 },
    amount: { type: Number, default: 0 },
    details: [{
      date: { type: Date },
      minutes: { type: Number, default: 0 },
      amount: { type: Number, default: 0 },
      reason: { type: String }
    }]
  },
   
  groupId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Group',
  },
  iin: {
    type: String,
    unique: true,
    trim: true,
    index: true
  },
  
  // Поля, используемые на фронтенде
  isVerified: { type: Boolean, default: false },
  avatarUrl: { type: String },
  permissions: [{ type: String }],
  username: { type: String, unique: true, sparse: true, trim: true },
  parentPhone: { type: String, trim: true },
  parentName: { type: String, trim: true },
}, { timestamps: true });

export default mongoose.model<IUser>('User', UserSchema);