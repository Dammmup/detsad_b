import mongoose, { Document, Schema } from 'mongoose';
import { createModelFactory } from '../../config/database';

export interface IMainEvent extends Document {
  name: string;
  description: string;
  dayOfMonth: number; // День месяца для экспорта (1-31)
  enabled: boolean;
  exportCollections: string[]; // Список коллекций для экспорта
  emailRecipients: string[]; // Email адреса получателей
  lastExecutedAt?: Date;
  nextExecutionAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const MainEventSchema: Schema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  dayOfMonth: {
    type: Number,
    required: true,
    min: 0,
    max: 6
  },
  enabled: {
    type: Boolean,
    default: true
  },
  exportCollections: [{
    type: String,
    enum: ['childAttendance', 'childPayment', 'staffShifts', 'payroll', 'rent']
  }],
  emailRecipients: [{
    type: String,
    lowercase: true
  }],
  lastExecutedAt: {
    type: Date
  },
  nextExecutionAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Создаем фабрику модели для отложенного создания после подключения к базе данных
const createMainEventModel = createModelFactory<IMainEvent>(
  'MainEvent',
  MainEventSchema,
  'mainEvents',
  'default'
);

export default createMainEventModel;