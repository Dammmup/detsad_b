import mongoose, { Schema, Document, Date } from 'mongoose';
import User from '../users/user.model';
import { IDocumentTemplate } from './document-template.model';

export interface IDocument extends Document {
  title: string; // Название документа
  description?: string; // Описание
  templateId?: mongoose.Types.ObjectId; // Ссылка на шаблон
  content: string; // Содержимое документа
  variables?: Record<string, any>; // Значения переменных
  documentType: 'contract' | 'certificate' | 'report' | 'order' | 'directive' | 'other'; // Тип документа
  relatedTo?: mongoose.Types.ObjectId; // Связанная сущность (пользователь, ребенок и т.д.)
  relatedModel?: string; // Модель связанной сущности
  status: 'draft' | 'signed' | 'approved' | 'archived' | 'deleted'; // Статус документа
  fileName?: string; // Имя файла
  filePath?: string; // Путь к файлу
  fileType?: string; // MIME тип
  fileSize?: number; // Размер файла в байтах
  createdBy: mongoose.Types.ObjectId; // Кто создал
  updatedBy?: mongoose.Types.ObjectId; // Кто обновил
  signedBy?: mongoose.Types.ObjectId[]; // Кто подписал
  signedAt?: Date[]; // Даты подписания
  approvedBy?: mongoose.Types.ObjectId; // Кто утвердил
  approvedAt?: Date; // Дата утверждения
  archivedAt?: Date; // Дата архивирования
  notes?: string; // Примечания
  tags?: string[]; // Теги для поиска
  isPublic: boolean; // Публичный ли документ
  createdAt: Date;
  updatedAt: Date;
}

const DocumentSchema: Schema = new Schema({
  title: { 
    type: String, 
    required: [true, 'Название документа обязательно'],
    trim: true,
    maxlength: [200, 'Название документа не может превышать 200 символов'],
    index: true
  },
  description: { 
    type: String,
    maxlength: [1000, 'Описание документа не может превышать 1000 символов']
  },
  templateId: { 
    type: Schema.Types.ObjectId, 
    ref: 'documentTemplates'
  },
  content: { 
    type: String,
    required: [true, 'Содержимое документа обязательно']
  },
  variables: { 
    type: Schema.Types.Mixed // Произвольные значения переменных
  },
  documentType: {
    type: String,
    required: [true, 'Тип документа обязателен'],
    enum: ['contract', 'certificate', 'report', 'order', 'directive', 'other'],
    index: true
  },
  relatedTo: { 
    type: Schema.Types.ObjectId // ID связанной сущности
  },
  relatedModel: { 
    type: String // Модель связанной сущности
  },
  status: {
    type: String,
    required: [true, 'Статус документа обязателен'],
    enum: ['draft', 'signed', 'approved', 'archived', 'deleted'],
    default: 'draft',
    index: true
  },
  fileName: { 
    type: String,
    trim: true,
    maxlength: [200, 'Имя файла не может превышать 200 символов']
  },
  filePath: { 
    type: String 
  },
  fileType: { 
    type: String,
    trim: true,
    maxlength: [100, 'MIME тип не может превышать 100 символов']
  },
  fileSize: { 
    type: Number,
    min: [0, 'Размер файла не может быть отрицательным']
  },
  createdBy: { 
    type: Schema.Types.ObjectId, 
    ref: 'users',
    required: [true, 'Создатель документа обязателен'],
    index: true
  },
  updatedBy: { 
    type: Schema.Types.ObjectId, 
    ref: 'users'
  },
  signedBy: [{ 
    type: Schema.Types.ObjectId, 
    ref: 'users' 
  }],
  signedAt: [{ 
    type: Date 
  }],
  approvedBy: { 
    type: Schema.Types.ObjectId, 
    ref: 'users'
  },
  approvedAt: { 
    type: Date 
  },
  archivedAt: { 
    type: Date 
  },
  notes: {
    type: String,
    maxlength: [1000, 'Примечания не могут превышать 1000 символов']
  },
  tags: [{ 
    type: String,
    trim: true,
    maxlength: [50, 'Тег не может превышать 50 символов'],
    index: true
  }],
  isPublic: { 
    type: Boolean, 
    default: false,
    index: true
  }
}, { timestamps: true });

// Индексы для поиска
DocumentSchema.index({ title: 'text', description: 'text' });
DocumentSchema.index({ createdBy: 1, status: 1 });
DocumentSchema.index({ relatedTo: 1, relatedModel: 1 });

export default mongoose.model<IDocument>('documents', DocumentSchema);