import mongoose, { Schema, Document, Date } from 'mongoose';
import User from '../users/user.model';

export interface IDetergentLog extends Document {
  detergentName: string; // Название моющего средства
  supplier: string; // Поставщик
  batchNumber?: string; // Номер партии
  receiptDate: Date; // Дата получения
  expiryDate: Date; // Срок годности
  quantityReceived: number; // Полученное количество
  unit: 'kg' | 'g' | 'l' | 'ml' | 'pcs'; // Единица измерения
  storageLocation: string; // Место хранения
  safetySheet?: string; // Путь к паспорту безопасности
  notes?: string; // Примечания
  recordedBy: mongoose.Types.ObjectId; // Кто записал
  createdAt: Date;
  updatedAt: Date;
}

const DetergentLogSchema: Schema = new Schema({
  detergentName: { 
    type: String, 
    required: [true, 'Название моющего средства обязательно'],
    trim: true,
    maxlength: [100, 'Название моющего средства не может превышать 100 символов']
  },
  supplier: { 
    type: String, 
    required: [true, 'Поставщик обязателен'],
    trim: true,
    maxlength: [100, 'Поставщик не может превышать 100 символов']
  },
  batchNumber: { 
    type: String,
    trim: true,
    maxlength: [50, 'Номер партии не может превышать 50 символов']
  },
  receiptDate: { 
    type: Date, 
    required: [true, 'Дата получения обязательна'],
    index: true
  },
  expiryDate: { 
    type: Date, 
    required: [true, 'Срок годности обязателен']
  },
  quantityReceived: { 
    type: Number,
    required: [true, 'Полученное количество обязательно'],
    min: [0, 'Количество не может быть отрицательным']
  },
  unit: {
    type: String,
    required: [true, 'Единица измерения обязательна'],
    enum: ['kg', 'g', 'l', 'ml', 'pcs']
  },
  storageLocation: { 
    type: String, 
    required: [true, 'Место хранения обязательно'],
    trim: true,
    maxlength: [100, 'Место хранения не может превышать 100 символов']
  },
  safetySheet: { 
    type: String 
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

export default mongoose.model<IDetergentLog>('detergentLogs', DetergentLogSchema);