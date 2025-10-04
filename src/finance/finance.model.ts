import mongoose, { Schema, Document, Date } from 'mongoose';
import User from '../users/user.model';

export interface IFinance extends Document {
  title: string; // Название финансовой операции
  description?: string; // Описание
  amount: number; // Сумма
  type: 'income' | 'expense'; // Тип операции
  category: string; // Категория
  date: Date; // Дата операции
  paymentMethod: 'cash' | 'bank_transfer' | 'card' | 'other'; // Способ оплаты
  status: 'pending' | 'completed' | 'cancelled'; // Статус операции
  createdBy: mongoose.Types.ObjectId; // Кто создал
  approvedBy?: mongoose.Types.ObjectId; // Кто утвердил
  approvedAt?: Date; // Дата утверждения
  notes?: string; // Примечания
  documents?: string[]; // Пути к документам
  tags?: string[]; // Теги для поиска
  createdAt: Date;
  updatedAt: Date;
}

const FinanceSchema: Schema = new Schema({
  title: { 
    type: String, 
    required: [true, 'Название финансовой операции обязательно'],
    trim: true,
    maxlength: [200, 'Название финансовой операции не может превышать 200 символов'],
    index: true
  },
  description: { 
    type: String,
    maxlength: [1000, 'Описание финансовой операции не может превышать 1000 символов']
  },
  amount: { 
    type: Number, 
    required: [true, 'Сумма обязательна'],
    min: [0, 'Сумма не может быть отрицательной']
  },
  type: {
    type: String,
    required: [true, 'Тип операции обязателен'],
    enum: ['income', 'expense'],
    index: true
  },
  category: { 
    type: String, 
    required: [true, 'Категория обязательна'],
    trim: true,
    maxlength: [100, 'Категория не может превышать 100 символов'],
    index: true
  },
  date: { 
    type: Date, 
    required: [true, 'Дата операции обязательна'],
    index: true
  },
  paymentMethod: {
    type: String,
    required: [true, 'Способ оплаты обязателен'],
    enum: ['cash', 'bank_transfer', 'card', 'other'],
    default: 'cash',
    index: true
  },
  status: {
    type: String,
    required: [true, 'Статус операции обязателен'],
    enum: ['pending', 'completed', 'cancelled'],
    default: 'pending',
    index: true
  },
  createdBy: { 
    type: Schema.Types.ObjectId, 
    ref: 'User',
    required: [true, 'Создатель операции обязателен'],
    index: true
  },
  approvedBy: { 
    type: Schema.Types.ObjectId, 
    ref: 'User',
    index: true
  },
  approvedAt: { 
    type: Date,
    index: true
  },
  notes: {
    type: String,
    maxlength: [500, 'Примечания не могут превышать 500 символов']
  },
  documents: [{
    type: String
  }],
  tags: [{ 
    type: String,
    trim: true,
    maxlength: [50, 'Тег не может превышать 50 символов'],
    index: true
  }]
}, { timestamps: true });

// Индексы для поиска
FinanceSchema.index({ title: 'text', description: 'text' });
FinanceSchema.index({ type: 1, category: 1, date: -1 });
FinanceSchema.index({ status: 1, date: -1 });
FinanceSchema.index({ createdBy: 1, date: -1 });
FinanceSchema.index({ approvedBy: 1, approvedAt: -1 });

export default mongoose.model<IFinance>('Finance', FinanceSchema);