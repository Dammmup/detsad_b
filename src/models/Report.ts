import mongoose, { Schema, Document } from 'mongoose';

export interface IReport extends Document {
  title: string;
  type: 'attendance' | 'schedule' | 'staff' | 'salary' | 'children' | 'custom';
  description?: string;
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
  filters?: {
    userId?: mongoose.Types.ObjectId;
    groupId?: mongoose.Types.ObjectId;
    department?: string;
    status?: string;
  };
  data: any; // JSON data for the report
  format: 'pdf' | 'excel' | 'csv' | 'json';
  status: 'generating' | 'completed' | 'failed' | 'scheduled';
  filePath?: string; // Path to generated file
  fileSize?: number; // File size in bytes
  generatedAt?: Date;
  scheduledFor?: Date; // For scheduled reports
  emailRecipients?: string[]; // For automatic email sending
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ReportSchema: Schema = new Schema({
  title: { 
    type: String, 
    required: [true, 'Название отчета обязательно'],
    trim: true,
    maxlength: [200, 'Название отчета не может превышать 200 символов']
  },
  type: {
    type: String,
    required: [true, 'Тип отчета обязателен'],
    enum: ['attendance', 'schedule', 'staff', 'salary', 'children', 'custom']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Описание не может превышать 1000 символов']
  },
  dateRange: {
    startDate: {
      type: Date,
      required: [true, 'Начальная дата обязательна']
    },
    endDate: {
      type: Date,
      required: [true, 'Конечная дата обязательна']
    }
  },
  filters: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'users'
    },
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group'
    },
    department: {
      type: String,
      trim: true
    },
    status: {
      type: String,
      trim: true
    }
  },
  data: {
    type: Schema.Types.Mixed,
    default: {}
  },
  format: {
    type: String,
    required: [true, 'Формат отчета обязателен'],
    enum: ['pdf', 'excel', 'csv', 'json'],
    default: 'pdf'
  },
  status: {
    type: String,
    required: [true, 'Статус отчета обязателен'],
    enum: ['generating', 'completed', 'failed', 'scheduled'],
    default: 'generating'
  },
  filePath: {
    type: String,
    trim: true
  },
  fileSize: {
    type: Number,
    min: [0, 'Размер файла не может быть отрицательным']
  },
  generatedAt: {
    type: Date
  },
  scheduledFor: {
    type: Date
  },
  emailRecipients: [{
    type: String,
    validate: {
      validator: function(email: string) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      },
      message: 'Некорректный email адрес'
    }
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users',
    required: [true, 'Создатель отчета обязателен']
  }
}, { 
  timestamps: true 
});

// Индексы для оптимизации запросов
ReportSchema.index({ type: 1, status: 1 });
ReportSchema.index({ createdBy: 1, createdAt: -1 });
ReportSchema.index({ 'dateRange.startDate': 1, 'dateRange.endDate': 1 });
ReportSchema.index({ scheduledFor: 1, status: 1 });

// Валидация дат
ReportSchema.pre('validate', function(this: IReport) {
  if (this.dateRange && this.dateRange.startDate && this.dateRange.endDate) {
    if (this.dateRange.startDate >= this.dateRange.endDate) {
      this.invalidate('dateRange.endDate', 'Конечная дата должна быть больше начальной');
    }
  }
});

// Автоматическое обновление generatedAt при изменении статуса на completed
ReportSchema.pre('save', function(this: IReport) {
  if (this.isModified('status') && this.status === 'completed' && !this.generatedAt) {
    this.generatedAt = new Date();
  }
});

export default mongoose.model<IReport>('Report', ReportSchema);
