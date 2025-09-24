import mongoose, { Schema, Document } from 'mongoose';

export interface IDocumentTemplate extends Document {
  name: string;
  description?: string;
  type: 'contract' | 'certificate' | 'report' | 'policy' | 'other';
  category: 'staff' | 'children' | 'financial' | 'administrative' | 'other';
  fileName: string;
  fileSize: number;
  filePath: string;
  version: string;
  isActive: boolean;
  tags: string[];
  usageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const DocumentTemplateSchema: Schema = new Schema({
  name: {
    type: String,
    required: [true, 'Название шаблона обязательно'],
    trim: true,
    maxlength: [20, 'Название шаблона не может превышать 200 символов']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Описание не может превышать 1000 символов']
  },
  type: {
    type: String,
    required: [true, 'Тип шаблона обязателен'],
    enum: ['contract', 'certificate', 'report', 'policy', 'other']
  },
  category: {
    type: String,
    required: [true, 'Категория шаблона обязательна'],
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
  version: {
    type: String,
    default: '1.0'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  usageCount: {
    type: Number,
    default: 0,
    min: [0, 'Счетчик использования не может быть отрицательным']
  }
}, {
  timestamps: true
});

// Индексы для оптимизации запросов
DocumentTemplateSchema.index({ type: 1, category: 1 });
DocumentTemplateSchema.index({ isActive: 1 });
DocumentTemplateSchema.index({ tags: 1 });
DocumentTemplateSchema.index({ usageCount: -1 });

export default mongoose.model<IDocumentTemplate>('DocumentTemplate', DocumentTemplateSchema);