import mongoose, { Schema, Document, Date } from 'mongoose';
import User from '../users/user.model';
import { IProductCertificate } from './product-certificate.model';

export interface IFoodStockLog extends Document {
  productId: mongoose.Types.ObjectId; // Ссылка на продукт/сертификат
  date: Date; // Дата операции
  type: 'incoming' | 'outgoing' | 'adjustment'; // Тип операции
  quantity: number; // Количество
  unit: 'kg' | 'g' | 'l' | 'ml' | 'pcs'; // Единица измерения
  balanceAfter: number; // Остаток после операции
  notes?: string; // Примечания
  recordedBy: mongoose.Types.ObjectId; // Кто записал
  createdAt: Date;
  updatedAt: Date;
}

const FoodStockLogSchema: Schema = new Schema({
  productId: { 
    type: Schema.Types.ObjectId, 
    ref: 'productCertificates',
    required: [true, 'ID продукта обязателен']
  },
  date: { 
    type: Date, 
    required: [true, 'Дата операции обязательна'],
    index: true
  },
  type: {
    type: String,
    required: [true, 'Тип операции обязателен'],
    enum: ['incoming', 'outgoing', 'adjustment'],
    index: true
  },
  quantity: { 
    type: Number,
    required: [true, 'Количество обязательно'],
    min: [0, 'Количество не может быть отрицательным']
  },
  unit: {
    type: String,
    required: [true, 'Единица измерения обязательна'],
    enum: ['kg', 'g', 'l', 'ml', 'pcs']
  },
  balanceAfter: { 
    type: Number,
    required: [true, 'Остаток после операции обязателен'],
    min: [0, 'Остаток не может быть отрицательным']
  },
  notes: {
    type: String,
    maxlength: [500, 'Примечания не могут превышать 500 символов']
  },
  recordedBy: { 
    type: Schema.Types.ObjectId, 
    ref: 'users',
    required: [true, 'Записавший сотрудник обязателен']
  }
}, { timestamps: true });

export default mongoose.model<IFoodStockLog>('foodStockLogs', FoodStockLogSchema);