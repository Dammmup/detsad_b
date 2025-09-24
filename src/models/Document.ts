import mongoose, { Schema, Document } from 'mongoose';

export interface IDocument extends Document {
  title: string;
  description?: string;
  type: 'contract' | 'certificate' | 'report' | 'policy' | 'other';
  category: 'staff' | 'children' | 'financial' | 'administrative' | 'other';
  fileName: string;
  fileSize: number;
  filePath: string;
  uploadDate: Date;
  uploader: mongoose.Types.ObjectId;
  relatedId?: mongoose.Types.ObjectId; // ID связанного объекта (сотрудник, ребенок и т.д.)
  relatedType?: 'staff' | 'child' | 'group';
  status: 'active' | 'archived';
  tags: string[];
  version: string;
  expiryDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const DocumentSchema: Schema = new Schema({
  title: {
    type: String,
    required: [true, 'Название документа обязательно'],
    trim: true,
    maxlength: [200, 'Название документа не может превышать 200 символов']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Описание не может превышать 1000 символов']
  },
  type: {
    type: String,
    required: [true, 'Тип документа обязателен'],
    enum: ['contract', 'certificate', 'report', 'policy', 'other']
  },
  category: {
    type: String,
    required: [true, 'Категория документа обязательна'],
    enum: ['staff', 'children', 'financial', 'administrative', 'other']
  },
  fileName: {
    type: String,
    required: [true, 'Имя файла обязательно'],
    trim: true
  },
  fileSize: {
    type: Number,
    required: [true, 'Размер файла обязателен'],
    min: [0, 'Размер файла не может быть отрицательным']
  },
  filePath: {
    type: String,
    required: [true, 'Путь к файлу обязателен'],
    trim: true
  },
  uploadDate: {
    type: Date,
    default: Date.now
  },
  uploader: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Загрузчик документа обязателен']
  },
  relatedId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'relatedType'
  },
  relatedType: {
    type: String,
    enum: ['staff', 'child', 'group']
  },
  status: {
    type: String,
    required: [true, 'Статус документа обязателен'],
    enum: ['active', 'archived'],
    default: 'active'
  },
  tags: [{
    type: String,
    trim: true
  }],
  version: {
    type: String,
    default: '1.0'
  },
  expiryDate: {
    type: Date
  }
}, {
  timestamps: true
});

// Индексы для оптимизации запросов
DocumentSchema.index({ type: 1, category: 1 });
DocumentSchema.index({ uploader: 1, uploadDate: -1 });
DocumentSchema.index({ relatedId: 1, relatedType: 1 });
DocumentSchema.index({ status: 1 });
DocumentSchema.index({ tags: 1 });

// Валидация даты истечения срока
DocumentSchema.pre('validate', function(this: IDocument) {
  if (this.expiryDate && this.uploadDate && this.expiryDate < this.uploadDate) {
    this.invalidate('expiryDate', 'Дата истечения срока должна быть позже даты загрузки');
  }
});

export default mongoose.model<IDocument>('Document', DocumentSchema);