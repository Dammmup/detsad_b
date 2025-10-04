import mongoose, { Schema, Document, Date } from 'mongoose';
import User from '../users/user.model';
import { IProductCertificate } from './product-certificate.model';

export interface IOrganolepticRecord extends Document {
  productId: mongoose.Types.ObjectId; // Ссылка на продукт
  inspectionDate: Date; // Дата проверки
  inspectorId: mongoose.Types.ObjectId; // Кто провел проверку
  appearance: string; // Внешний вид
  color: string; // Цвет
  smell: string; // Запах
  taste?: string; // Вкус (для некоторых продуктов)
  texture?: string; // Консистенция
  temperature?: number; // Температура (если применимо)
  conclusion: 'passed' | 'failed' | 'conditional'; // Заключение
  notes?: string; // Примечания
  documents?: string[]; // Пути к документам
  createdAt: Date;
  updatedAt: Date;
}

const OrganolepticRecordSchema: Schema = new Schema({
  productId: { 
    type: Schema.Types.ObjectId, 
    ref: 'productCertificates',
    required: [true, 'ID продукта обязателен'],
    index: true
  },
  inspectionDate: { 
    type: Date, 
    required: [true, 'Дата проверки обязательна'],
    index: true
  },
  inspectorId: { 
    type: Schema.Types.ObjectId, 
    ref: 'users',
    required: [true, 'ID инспектора обязателен']
  },
  appearance: { 
    type: String,
    required: [true, 'Внешний вид обязателен'],
    trim: true,
    maxlength: [200, 'Внешний вид не может превышать 200 символов']
  },
  color: { 
    type: String,
    required: [true, 'Цвет обязателен'],
    trim: true,
    maxlength: [100, 'Цвет не может превышать 100 символов']
  },
  smell: { 
    type: String,
    required: [true, 'Запах обязателен'],
    trim: true,
    maxlength: [200, 'Запах не может превышать 200 символов']
  },
  taste: { 
    type: String,
    trim: true,
    maxlength: [200, 'Вкус не может превышать 200 символов']
  },
  texture: { 
    type: String,
    trim: true,
    maxlength: [200, 'Консистенция не может превышать 200 символов']
  },
  temperature: { 
    type: Number,
    min: [-50, 'Температура не может быть ниже -50°C'],
    max: [100, 'Температура не может быть выше 100°C']
  },
  conclusion: {
    type: String,
    required: [true, 'Заключение обязательно'],
    enum: ['passed', 'failed', 'conditional'],
    index: true
  },
  notes: {
    type: String,
    maxlength: [500, 'Примечания не могут превышать 500 символов']
  },
  documents: [{
    type: String
  }]
}, { timestamps: true });

export default mongoose.model<IOrganolepticRecord>('organolepticRecords', OrganolepticRecordSchema);