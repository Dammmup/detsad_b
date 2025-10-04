import mongoose, { Schema, Document } from 'mongoose';
import User from '../users/user.model';
import { IReportTemplate } from './report-template.model';

export interface IReport extends Document {
  templateId: mongoose.Types.ObjectId; // Ссылка на шаблон отчета
  name: string; // Название отчета
  description?: string; // Описание
  parameters: Record<string, any>; // Значения параметров
  format: 'pdf' | 'excel' | 'csv' | 'html'; // Формат отчета
  data: any; // Данные отчета
  fileName: string; // Имя файла
  filePath: string; // Путь к файлу
  fileSize?: number; // Размер файла в байтах
  generatedBy: mongoose.Types.ObjectId; // Кто сгенерировал
  generatedAt: Date; // Дата генерации
  status: 'pending' | 'generated' | 'failed' | 'archived'; // Статус отчета
  notes?: string; // Примечания
  tags?: string[]; // Теги для поиска
  isPublic: boolean; // Публичный ли отчет
  expiresAt?: Date; // Дата истечения срока хранения
  createdAt: Date;
  updatedAt: Date;
}

const ReportSchema: Schema = new Schema({
  templateId: { 
    type: Schema.Types.ObjectId, 
    ref: 'ReportTemplate',
    required: [true, 'ID шаблона отчета обязателен'],
    index: true
  },
  name: { 
    type: String, 
    required: [true, 'Название отчета обязательно'],
    trim: true,
    maxlength: [200, 'Название отчета не может превышать 200 символов'],
    index: true
  },
  description: { 
    type: String,
    maxlength: [1000, 'Описание отчета не может превышать 1000 символов']
  },
  parameters: { 
    type: Schema.Types.Mixed // Произвольные значения параметров
  },
  format: {
    type: String,
    required: [true, 'Формат отчета обязателен'],
    enum: ['pdf', 'excel', 'csv', 'html'],
    default: 'pdf',
    index: true
  },
  data: { 
    type: Schema.Types.Mixed // Произвольные данные отчета
  },
  fileName: { 
    type: String,
    required: [true, 'Имя файла обязательно'],
    trim: true,
    maxlength: [200, 'Имя файла не может превышать 200 символов']
  },
  filePath: { 
    type: String,
    required: [true, 'Путь к файлу обязателен']
  },
  fileSize: { 
    type: Number,
    min: [0, 'Размер файла не может быть отрицательным']
  },
  generatedBy: { 
    type: Schema.Types.ObjectId, 
    ref: 'User',
    required: [true, 'Генератор отчета обязателен'],
    index: true
  },
  generatedAt: { 
    type: Date, 
    required: [true, 'Дата генерации обязательна'],
    index: true,
    default: Date.now
  },
  status: {
    type: String,
    required: [true, 'Статус отчета обязателен'],
    enum: ['pending', 'generated', 'failed', 'archived'],
    default: 'pending',
    index: true
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
  },
  expiresAt: { 
    type: Date,
    index: true
  }
}, { timestamps: true });

// Индексы для поиска
ReportSchema.index({ name: 'text', description: 'text' });
ReportSchema.index({ generatedBy: 1, status: 1 });
ReportSchema.index({ templateId: 1, generatedAt: -1 });

export default mongoose.model<IReport>('Report', ReportSchema);