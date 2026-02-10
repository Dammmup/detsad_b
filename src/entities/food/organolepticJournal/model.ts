import mongoose, { Schema, Document } from 'mongoose';
export interface IOrganolepticJournal extends Document {
  childId: mongoose.Types.ObjectId;
  date: Date;
  productName: string;
  appearance: string;
  color: string;
  smell: string;
  taste: string;
  temperature: number;
  consistency: string;
  packagingCondition: string;
  expirationDate: Date;
  batchNumber: string;
  supplier: string;
  quantity: number;
  unit: string;
  notes?: string;
  attachments?: string[];
  status: 'pending' | 'completed' | 'reviewed';
  nextInspectionDate?: Date;
  recommendations?: string;
  inspector: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const OrganolepticJournalSchema = new Schema<IOrganolepticJournal>({
  childId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  productName: {
    type: String,
    required: true,
    trim: true,
    maxlength: [100, 'Название продукта не может превышать 100 символов']
  },
  appearance: {
    type: String,
    required: true,
    trim: true,
    maxlength: [200, 'Внешний вид не может превышать 200 символов']
  },
  color: {
    type: String,
    required: true,
    trim: true,
    maxlength: [50, 'Цвет не может превышать 50 символов']
  },
  smell: {
    type: String,
    required: true,
    trim: true,
    maxlength: [100, 'Запах не может превышать 100 символов']
  },
  taste: {
    type: String,
    required: true,
    trim: true,
    maxlength: [100, 'Вкус не может превышать 100 символов']
  },
  temperature: {
    type: Number,
    required: true,
    min: [-20, 'Температура не может быть ниже -20°C'],
    max: [100, 'Температура не может быть выше 100°C']
  },
  consistency: {
    type: String,
    required: true,
    trim: true,
    maxlength: [100, 'Консистенция не может превышать 100 символов']
  },
  packagingCondition: {
    type: String,
    required: true,
    trim: true,
    maxlength: [100, 'Состояние упаковки не может превышать 100 символов']
  },
  expirationDate: {
    type: Date,
    required: true
  },
  batchNumber: {
    type: String,
    required: true,
    trim: true,
    maxlength: [50, 'Номер партии не может превышать 50 символов']
  },
  supplier: {
    type: String,
    required: false,
    trim: true,
    maxlength: [100, 'Поставщик не может превышать 100 символов']
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
  notes: {
    type: String,
    maxlength: [500, 'Заметки не могут превышать 500 символов']
  },
  attachments: [String],
  status: {
    type: String,
    enum: ['pending', 'completed', 'reviewed'],
    default: 'pending'
  },
  nextInspectionDate: {
    type: Date
  },
  recommendations: {
    type: String,
    maxlength: [300, 'Рекомендации не могут превышать 300 символов']
  },
  inspector: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});


export default mongoose.model<IOrganolepticJournal>('OrganolepticJournal', OrganolepticJournalSchema, 'organoleptic_journals');