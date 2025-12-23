import mongoose, { Schema, Document } from 'mongoose';
export interface IProduct extends Document {
  name: string;
  description?: string;
  category: string;
  unit: string;
  supplier: string;
  price: number;
  stockQuantity: number;
  minStockLevel: number;
  maxStockLevel: number;
  expirationDate?: Date;
  batchNumber?: string;
  storageConditions: string;
  notes?: string;
  attachments?: string[];
  status: 'active' | 'inactive' | 'discontinued';
  // Поля для учета закупок
  childCount: number; // На сколько детей рассчитан продукт
  purchaseDays: number; // На сколько дней рассчитан продукт
  purchaseDate: Date; // Дата закупки
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>({
  name: {
    type: String,
    required: [true, 'Название продукта обязательно'],
    trim: true,
    maxlength: [100, 'Название продукта не может превышать 100 символов']
  },
  description: {
    type: String,
    maxlength: [500, 'Описание не может превышать 500 символов']
  },
  category: {
    type: String,
    required: [true, 'Категория продукта обязательна'],
    trim: true,
    maxlength: [50, 'Категория не может превышать 50 символов']
  },
  unit: {
    type: String,
    required: [true, 'Единица измерения обязательна'],
    trim: true,
    maxlength: [20, 'Единица измерения не может превышать 20 символов']
  },
  supplier: {
    type: String,
    required: [true, 'Поставщик обязателен'],
    trim: true,
    maxlength: [100, 'Поставщик не может превышать 100 символов']
  },
  price: {
    type: Number,
    required: [true, 'Цена обязательна'],
    min: [0, 'Цена не может быть отрицательной']
  },
  stockQuantity: {
    type: Number,
    required: [true, 'Количество на складе обязательно'],
    min: [0, 'Количество не может быть отрицательным'],
    default: 0
  },
  minStockLevel: {
    type: Number,
    required: [true, 'Минимальный уровень запаса обязателен'],
    min: [0, 'Минимальный уровень не может быть отрицательным'],
    default: 0
  },
  maxStockLevel: {
    type: Number,
    required: [true, 'Максимальный уровень запаса обязателен'],
    min: [0, 'Максимальный уровень не может быть отрицательным'],
    default: 1000
  },
  expirationDate: {
    type: Date
  },
  batchNumber: {
    type: String,
    trim: true,
    maxlength: [50, 'Номер партии не может превышать 50 символов']
  },
  storageConditions: {
    type: String,
    required: [true, 'Условия хранения обязательны'],
    trim: true,
    maxlength: [200, 'Условия хранения не могут превышать 200 символов']
  },
  notes: {
    type: String,
    maxlength: [500, 'Заметки не могут превышать 500 символов']
  },
  attachments: [String],
  childCount: {
    type: Number,
    min: [0, 'Количество детей не может быть отрицательным'],
    default: 0
  },
  purchaseDays: {
    type: Number,
    min: [0, 'Количество дней не может быть отрицательным'],
    default: 0
  },
  purchaseDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'discontinued'],
    default: 'active'
  }
}, {
  timestamps: true
});




export default mongoose.model<IProduct>('Product', ProductSchema, 'products');