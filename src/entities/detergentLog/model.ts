import mongoose, { Schema, Document } from 'mongoose';

export interface IDetergentLog extends Document {
  productId: mongoose.Types.ObjectId;
  productName: string;
  batchNumber: string;
  expirationDate: Date;
  quantity: number;
  unit: string;
  supplier: string;
  supplierContact: string;
  deliveryDate: Date;
  deliveryPerson: string;
  receiver: mongoose.Types.ObjectId;
  notes?: string;
  attachments?: string[];
  status: 'received' | 'stored' | 'used' | 'disposed';
  usageDate?: Date;
  usagePerson?: string;
  disposalDate?: Date;
  disposalMethod?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DetergentLogSchema = new Schema<IDetergentLog>({
  productId: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  productName: {
    type: String,
    required: true,
    trim: true,
    maxlength: [100, 'Название продукта не может превышать 100 символов']
  },
  batchNumber: {
    type: String,
    required: true,
    trim: true,
    maxlength: [50, 'Номер партии не может превышать 50 символов']
  },
  expirationDate: {
    type: Date,
    required: true
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
  supplier: {
    type: String,
    required: true,
    trim: true,
    maxlength: [100, 'Поставщик не может превышать 100 символов']
  },
  supplierContact: {
    type: String,
    required: true,
    trim: true,
    maxlength: [100, 'Контакт поставщика не может превышать 100 символов']
  },
  deliveryDate: {
    type: Date,
    required: true
  },
  deliveryPerson: {
    type: String,
    required: true,
    trim: true,
    maxlength: [100, 'Получатель не может превышать 100 символов']
  },
  receiver: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  notes: {
    type: String,
    maxlength: [500, 'Заметки не могут превышать 500 символов']
  },
  attachments: [String],
  status: {
    type: String,
    enum: ['received', 'stored', 'used', 'disposed'],
    default: 'received'
  },
  usageDate: {
    type: Date
  },
  usagePerson: {
    type: String,
    trim: true,
    maxlength: [100, 'Пользователь не может превышать 100 символов']
  },
  disposalDate: {
    type: Date
  },
  disposalMethod: {
    type: String,
    trim: true,
    maxlength: [100, 'Метод утилизации не может превышать 100 символов']
  }
}, {
  timestamps: true
});



export default mongoose.model<IDetergentLog>('DetergentLog', DetergentLogSchema, 'detergent_logs');