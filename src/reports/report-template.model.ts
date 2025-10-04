import mongoose, { Schema, Document, Date } from 'mongoose';
import User from '../users/user.model';

export interface IReportTemplate extends Document {
  name: string; // Название отчета
  description?: string; // Описание
  category: 'financial' | 'attendance' | 'medical' | 'inventory' | 'staff' | 'children' | 'menu' | 'other'; // Категория
  query: string; // SQL запрос или путь к функции генерации
  parameters: {
    name: string; // Имя параметра
    label: string; // Метка параметра
    type: 'string' | 'number' | 'date' | 'boolean' | 'select'; // Тип параметра
    required: boolean; // Обязательный ли параметр
    defaultValue?: any; // Значение по умолчанию
    options?: string[]; // Опции для select
  }[]; // Параметры отчета
  format: 'pdf' | 'excel' | 'csv' | 'html'; // Формат вывода
  isActive: boolean; // Активен ли шаблон
  createdBy: mongoose.Types.ObjectId; // Кто создал
  updatedBy?: mongoose.Types.ObjectId; // Кто обновил
  notes?: string; // Примечания
  createdAt: Date;
  updatedAt: Date;
}

const ReportTemplateSchema: Schema = new Schema({
  name: { 
    type: String, 
    required: [true, 'Название отчета обязательно'],
    trim: true,
    maxlength: [100, 'Название отчета не может превышать 100 символов'],
    index: true
  },
  description: { 
    type: String,
    maxlength: [500, 'Описание отчета не может превышать 500 символов']
  },
  category: {
    type: String,
    required: [true, 'Категория отчета обязательна'],
    enum: ['financial', 'attendance', 'medical', 'inventory', 'staff', 'children', 'menu', 'other'],
    index: true
  },
  query: { 
    type: String,
    required: [true, 'Запрос отчета обязателен']
  },
  parameters: [{
    name: { 
      type: String,
      required: [true, 'Имя параметра обязательно'],
      trim: true,
      maxlength: [50, 'Имя параметра не может превышать 50 символов']
    },
    label: { 
      type: String,
      required: [true, 'Метка параметра обязательна'],
      trim: true,
      maxlength: [100, 'Метка параметра не может превышать 100 символов']
    },
    type: {
      type: String,
      required: [true, 'Тип параметра обязателен'],
      enum: ['string', 'number', 'date', 'boolean', 'select']
    },
    required: { 
      type: Boolean, 
      default: false 
    },
    defaultValue: { 
      type: Schema.Types.Mixed // Произвольное значение по умолчанию
    },
    options: [{ 
      type: String,
      trim: true,
      maxlength: [100, 'Опция не может превышать 100 символов']
    }]
  }],
  format: {
    type: String,
    required: [true, 'Формат отчета обязателен'],
    enum: ['pdf', 'excel', 'csv', 'html'],
    default: 'pdf'
  },
  isActive: { 
    type: Boolean, 
    default: true,
    index: true
  },
  createdBy: { 
    type: Schema.Types.ObjectId, 
    ref: 'users',
    required: [true, 'Создатель отчета обязателен']
  },
  updatedBy: { 
    type: Schema.Types.ObjectId, 
    ref: 'users'
  },
  notes: {
    type: String,
    maxlength: [500, 'Примечания не могут превышать 500 символов']
  }
}, { timestamps: true });

// Индекс для поиска по имени и категории
ReportTemplateSchema.index({ name: 1, category: 1 });

export default mongoose.model<IReportTemplate>('reportTemplates', ReportTemplateSchema);