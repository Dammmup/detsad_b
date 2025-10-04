import mongoose, { Schema, Document, Date } from 'mongoose';
import User from '../users/user.model';
import { IProductCertificate } from './product-certificate.model';

export interface IPerishableBrak extends Document {
  productId: mongoose.Types.ObjectId; // Ссылка на продукт
  date: Date; // Дата списания
  reason: string; // Причина списания
  quantity: number; // Количество
  unit: 'kg' | 'g' | 'l' | 'ml' | 'pcs'; // Единица измерения
  responsiblePersonId: mongoose.Types.ObjectId; // Ответственное лицо
  disposalMethod: string; // Метод утилизации
  notes?: string; // Примечания
  documents?: string[]; // Пути к документам
  createdAt: Date;
  updatedAt: Date;
}

const PerishableBrakSchema: Schema = new Schema({
  productId: { 
    type: Schema.Types.ObjectId, 
    ref: 'productCertificates',
    required: [true, 'ID продукта обязателен'],
    index: true
  },
  date: { 
    type: Date, 
    required: [true, 'Дата списания обязательна'],
    index: true
  },
  reason: { 
    type: String,
    required: [true, 'Причина списания обязательна'],
    trim: true,
    maxlength: [200, 'Причина списания не может превышать 200 символов']
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
  responsiblePersonId: { 
    type: Schema.Types.ObjectId, 
    ref: 'users',
    required: [true, 'Ответственное лицо обязательно']
  },
  disposalMethod: { 
    type: String,
    required: [true, 'Метод утилизации обязателен'],
    trim: true,
    maxlength: [100, 'Метод утилизации не может превышать 100 символов']
  },
  notes: {
    type: String,
    maxlength: [500, 'Примечания не могут превышать 500 символов']
  },
  documents: [{
    type: String
  }]
}, { timestamps: true });

export default mongoose.model<IPerishableBrak>('perishableBrak', PerishableBrakSchema);