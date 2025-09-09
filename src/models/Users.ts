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
  phone: string;  // WhatsApp номер для входа и верификации

  
  // Верификация через WhatsApp
  verificationCode?: string;  // Код подтверждения
  verificationCodeExpires?: Date;  // Срок действия кода
  isVerified: boolean;  // Подтвержден ли номер
  lastLogin?: Date;  // Последний вход
  personalCode?: string;  // Персональный код для входа

  
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
  fines: IFine[];
  totalFines: number;
  
  // Поля для детей (type: 'child')
  parentName?: string;
  parentPhone?: string;  // WhatsApp родителя
  groupId?: mongoose.Types.ObjectId;  // Группа ребенка
  iin?: string;
  
  // Служебные поля
  createdAt: Date;
  updatedAt: Date;

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
    required: [true, 'WhatsApp номер обязателен'],
    unique: true,
    trim: true,
    index: true
  },
  
  // Верификация через WhatsApp
  verificationCode: { type: String },
  verificationCodeExpires: { type: Date },
  lastLogin: { type: Date },
  personalCode: { type: String },
  isVerified: { type: Boolean, default: false },
  
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
      values: ['admin', 'manager', 'teacher', 'assistant', 'cook', 'cleaner', 'security', 'nurse', 'child', 'null', 'doctor'],
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
  fines: [{
    amount: { type: Number, required: true },
    reason: { type: String, required: true },
    date: { type: Date, default: Date.now },
    type: { type: String, enum: ['late', 'other'], default: 'other' },
    approved: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    notes: String
  }],
  totalFines: { type: Number, default: 0 },
  
  // Поля для детей (type: 'child')
  parentName: { 
    type: String,
    required: function(this: IUser) { return this.type === 'child'; },
    maxlength: [100, 'Имя родителя не может превышать 100 символов']
  },
  parentPhone: { 
    type: String,
    required: function(this: IUser) { return this.type === 'child'; },
    validate: {
      validator: function(this: IUser, v: string) {
        return this.type !== 'child' || (v && v.length > 0);
      },
      message: 'WhatsApp номер родителя обязателен для детей'
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
