import mongoose, { Schema, Document, Date } from 'mongoose';
import User from '../users/user.model';

export interface IDocumentTemplate extends Document {
  name: string; // Название шаблона
  description?: string; // Описание
  category: 'contract' | 'certificate' | 'report' | 'order' | 'directive' | 'other'; // Категория
  content: string; // Содержимое шаблона (HTML или текст)
  variables: {
    name: string; // Имя переменной
    description?: string; // Описание переменной
    type: 'string' | 'number' | 'date' | 'boolean'; // Тип переменной
    required: boolean; // Обязательна ли переменная
  }[]; // Переменные шаблона
  isActive: boolean; // Активен ли шаблон
  createdBy: mongoose.Types.ObjectId; // Кто создал
  updatedBy?: mongoose.Types.ObjectId; // Кто обновил
  version: number; // Версия шаблона
  notes?: string; // Примечания
  createdAt: Date;
  updatedAt: Date;
}

const DocumentTemplateSchema: Schema = new Schema({
  name: { 
    type: String, 
    required: [true, 'Название шаблона обязательно'],
    trim: true,
    maxlength: [100, 'Название шаблона не может превышать 100 символов'],
    index: true
  },
  description: { 
    type: String,
    maxlength: [500, 'Описание шаблона не может превышать 500 символов']
  },
  category: {
    type: String,
    required: [true, 'Категория шаблона обязательна'],
    enum: ['contract', 'certificate', 'report', 'order', 'directive', 'other'],
    index: true
  },
  content: { 
    type: String,
    required: [true, 'Содержимое шаблона обязательно']
  },
  variables: [{
    name: { 
      type: String,
      required: [true, 'Имя переменной обязательно'],
      trim: true,
      maxlength: [50, 'Имя переменной не может превышать 50 символов']
    },
    description: { 
      type: String,
      maxlength: [200, 'Описание переменной не может превышать 200 символов']
    },
    type: {
      type: String,
      required: [true, 'Тип переменной обязателен'],
      enum: ['string', 'number', 'date', 'boolean']
    },
    required: { 
      type: Boolean, 
      default: false 
    }
  }],
  isActive: { 
    type: Boolean, 
    default: true,
    index: true
  },
  createdBy: { 
    type: Schema.Types.ObjectId, 
    ref: 'users',
    required: [true, 'Создатель шаблона обязателен']
  },
  updatedBy: { 
    type: Schema.Types.ObjectId, 
    ref: 'users'
  },
  version: { 
    type: Number,
    default: 1,
    min: [1, 'Версия должна быть положительным числом']
  },
  notes: {
    type: String,
    maxlength: [500, 'Примечания не могут превышать 500 символов']
  }
}, { timestamps: true });

// Индекс для поиска по имени и категории
DocumentTemplateSchema.index({ name: 1, category: 1 });

export default mongoose.model<IDocumentTemplate>('documentTemplates', DocumentTemplateSchema);