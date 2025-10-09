import mongoose, { Schema, Document } from 'mongoose';

export interface IReport extends Document {
  title: string;
  description?: string;
  type: string; // 'attendance', 'payroll', 'inventory', 'medical', 'financial'
  data: any; // Данные отчета в формате JSON
  generatedBy: mongoose.Types.ObjectId;
  generatedAt: Date;
  filters: any; // Фильтры, использованные при генерации отчета
  format: 'pdf' | 'excel' | 'csv';
  filePath?: string; // Путь к сгенерированному файлу
  fileName?: string; // Имя файла
  status: 'draft' | 'generated' | 'sent';
  recipients?: string[]; // Email адреса получателей
  sentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ReportSchema = new Schema<IReport>({
  title: { 
    type: String, 
    required: true 
  },
  description: String,
  type: { 
    type: String, 
    required: true,
    enum: ['attendance', 'payroll', 'inventory', 'medical', 'financial', 'custom']
  },
  data: Schema.Types.Mixed,
  generatedBy: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  generatedAt: { 
    type: Date, 
    default: Date.now 
  },
  filters: Schema.Types.Mixed,
  format: { 
    type: String, 
    enum: ['pdf', 'excel', 'csv'], 
    default: 'pdf' 
  },
  filePath: String,
  fileName: String,
  status: { 
    type: String, 
    enum: ['draft', 'generated', 'sent'], 
    default: 'draft' 
  },
  recipients: [String],
  sentAt: Date,
}, { 
  timestamps: true 
});



export default mongoose.model<IReport>('Report', ReportSchema, 'reports');