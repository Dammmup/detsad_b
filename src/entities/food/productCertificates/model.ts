import mongoose, { Schema, Document } from 'mongoose';
import { createModelFactory } from '../../../config/database';

export interface IProductCertificate extends Document {
  productId: mongoose.Types.ObjectId;
  productName: string;
  certificateNumber: string;
  issueDate: Date;
  expiryDate: Date;
  issuer: string;
  issuerAddress: string;
  issuerContact: string;
  productDescription: string;
  productCategory: string;
  manufacturingDate: Date;
  batchNumber: string;
  quantity: number;
  unit: string;
  qualityStandards: string[];
  testingResults: string;
  inspector: mongoose.Types.ObjectId;
  inspectionDate: Date;
  notes?: string;
  attachments?: string[];
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  rejectionReason?: string;
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ProductCertificateSchema = new Schema<IProductCertificate>({
  productId: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
    index: true
  },
  productName: {
    type: String,
    required: true,
    trim: true,
    maxlength: [100, 'Название продукта не может превышать 100 символов']
  },
  certificateNumber: {
    type: String,
    required: true,
    trim: true,
    maxlength: [50, 'Номер сертификата не может превышать 50 символов'],
    index: true
  },
  issueDate: {
    type: Date,
    required: true,
    index: true
  },
  expiryDate: {
    type: Date,
    required: true,
    index: true
  },
  issuer: {
    type: String,
    required: true,
    trim: true,
    maxlength: [100, 'Издатель не может превышать 100 символов']
  },
  issuerAddress: {
    type: String,
    required: true,
    trim: true,
    maxlength: [200, 'Адрес издателя не может превышать 200 символов']
  },
  issuerContact: {
    type: String,
    required: true,
    trim: true,
    maxlength: [100, 'Контакт издателя не может превышать 100 символов']
  },
  productDescription: {
    type: String,
    required: true,
    trim: true,
    maxlength: [500, 'Описание продукта не может превышать 500 символов']
  },
  productCategory: {
    type: String,
    required: true,
    trim: true,
    maxlength: [50, 'Категория продукта не может превышать 50 символов'],
    index: true
  },
  manufacturingDate: {
    type: Date,
    required: true,
    index: true
  },
  batchNumber: {
    type: String,
    required: true,
    trim: true,
    maxlength: [50, 'Номер партии не может превышать 50 символов'],
    index: true
  },
  quantity: {
    type: Number,
    required: true,
    min: [0, 'Количество не может быть отрицательным']
  },
  unit: {
    type: String,
    required: true,
    trim: true,
    maxlength: [20, 'Единица измерения не может превышать 20 символов']
  },
  qualityStandards: [{
    type: String,
    trim: true,
    maxlength: [100, 'Стандарт качества не может превышать 100 символов']
  }],
  testingResults: {
    type: String,
    required: true,
    trim: true,
    maxlength: [1000, 'Результаты тестирования не могут превышать 1000 символов']
  },
  inspector: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  inspectionDate: {
    type: Date,
    required: true,
    index: true
  },
  notes: {
    type: String,
    maxlength: [500, 'Заметки не могут превышать 500 символов']
  },
  attachments: [String],
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'expired'],
    default: 'pending',
    index: true
  },
  rejectionReason: {
    type: String,
    maxlength: [300, 'Причина отказа не может превышать 300 символов']
  },
  approvedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  approvedAt: {
    type: Date,
    index: true
  }
}, {
  timestamps: true
});


const createProductCertificateModel = createModelFactory<IProductCertificate>(
  'ProductCertificate',
  ProductCertificateSchema,
  'product_certificates',
  'food'
);


export default createProductCertificateModel;