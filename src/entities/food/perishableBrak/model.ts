import mongoose, { Schema, Document } from 'mongoose';
export interface IPerishableBrak extends Document {
  productId: mongoose.Types.ObjectId;
  productName: string;
  batchNumber: string;
  expirationDate: Date;
  quantity: number;
  unit: string;
  reason: string;
  inspector: mongoose.Types.ObjectId;
  inspectionDate: Date;
  disposalMethod: string;
  disposalDate?: Date;
  disposedBy?: mongoose.Types.ObjectId;
  notes?: string;
  attachments?: string[];
  status: 'pending' | 'disposed' | 'reviewed';
  createdAt: Date;
  updatedAt: Date;
}

const PerishableBrakSchema = new Schema<IPerishableBrak>({
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
    maxlength: [50, 'Номер партии не может превышать 50 символов']
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
  reason: {
    type: String,
    required: true,
    trim: true,
    maxlength: [200, 'Причина не может превышать 200 символов']
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
  disposalMethod: {
    type: String,
    required: true,
    trim: true,
    maxlength: [100, 'Метод утилизации не может превышать 100 символов']
  },
  disposalDate: {
    type: Date,
    index: true
  },
  disposedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  notes: {
    type: String,
    maxlength: [500, 'Заметки не могут превышать 500 символов']
  },
  attachments: [String],
  status: {
    type: String,
    enum: ['pending', 'disposed', 'reviewed'],
    default: 'pending',
    index: true
  }
}, {
  timestamps: true
});


export default mongoose.model<IPerishableBrak>('PerishableBrak', PerishableBrakSchema, 'perishable_braks');