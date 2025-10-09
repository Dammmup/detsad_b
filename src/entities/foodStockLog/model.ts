import mongoose, { Schema, Document } from 'mongoose';

export interface IFoodStockLog extends Document {
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

const FoodStockLogSchema = new Schema<IFoodStockLog>({
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
  batchNumber: {
    type: String,
    required: true,
    trim: true,
    maxlength: [50, 'Номер партии не может превышать 50 символов'],
    index: true
  },
  expirationDate: {
    type: Date,
    required: true,
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
    required: true,
    index: true
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
    enum: ['received', 'stored', 'used', 'disposed'],
    default: 'received',
    index: true
  },
  usageDate: {
    type: Date,
    index: true
  },
  usagePerson: {
    type: String,
    trim: true,
    maxlength: [100, 'Пользователь не может превышать 100 символов']
  },
  disposalDate: {
    type: Date,
    index: true
  },
  disposalMethod: {
    type: String,
    trim: true,
    maxlength: [100, 'Метод утилизации не может превышать 100 символов']
  }
}, {
  timestamps: true
});



export default mongoose.model<IFoodStockLog>('FoodStockLog', FoodStockLogSchema, 'food_stock_logs');