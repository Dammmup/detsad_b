import mongoose, { Schema, Document, Date } from 'mongoose';
import User from '../users/user.model';

export interface IProductCertificate extends Document {
  productName: string; // Название продукта
  supplier: string; // Поставщик
  certificateNumber: string; // Номер сертификата
  issueDate: Date; // Дата выдачи
  expiryDate: Date; // Дата окончания
  issuingAuthority: string; // Орган, выдавший сертификат
  productType: string; // Тип продукта
  batchNumber?: string; // Номер партии
  quantity: number; // Количество
  unit: 'kg' | 'g' | 'l' | 'ml' | 'pcs'; // Единица измерения
  storageConditions?: string; // Условия хранения
  notes?: string; // Примечания
  documents?: string[]; // Пути к документам
  isActive: boolean; // Активен ли сертификат
  createdAt: Date;
  updatedAt: Date;
}

const ProductCertificateSchema: Schema = new Schema({
  productName: { 
    type: String, 
    required: [true, 'Название продукта обязательно'],
    trim: true,
    maxlength: [100, 'Название продукта не может превышать 100 символов']
  },
  supplier: { 
    type: String, 
    required: [true, 'Поставщик обязателен'],
    trim: true,
    maxlength: [100, 'Поставщик не может превышать 100 символов']
  },
  certificateNumber: { 
    type: String, 
    required: [true, 'Номер сертификата обязателен'],
    trim: true,
    maxlength: [50, 'Номер сертификата не может превышать 50 символов']
  },
  issueDate: { 
    type: Date, 
    required: [true, 'Дата выдачи обязательна']
  },
  expiryDate: { 
    type: Date, 
    required: [true, 'Дата окончания обязательна']
  },
  issuingAuthority: { 
    type: String, 
    required: [true, 'Орган, выдавший сертификат, обязателен'],
    trim: true,
    maxlength: [100, 'Орган, выдавший сертификат, не может превышать 100 символов']
  },
  productType: { 
    type: String, 
    required: [true, 'Тип продукта обязателен'],
    trim: true,
    maxlength: [50, 'Тип продукта не может превышать 50 символов']
  },
  batchNumber: { 
    type: String,
    trim: true,
    maxlength: [50, 'Номер партии не может превышать 50 символов']
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
  storageConditions: {
    type: String,
    maxlength: [200, 'Условия хранения не могут превышать 200 символов']
  },
  notes: {
    type: String,
    maxlength: [500, 'Примечания не могут превышать 500 символов']
  },
  documents: [{
    type: String
  }],
  isActive: { 
    type: Boolean, 
    default: true,
    index: true
  }
}, { timestamps: true });

export default mongoose.model<IProductCertificate>('productCertificates', ProductCertificateSchema);