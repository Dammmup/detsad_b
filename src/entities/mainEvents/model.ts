import mongoose, { Document, Schema } from 'mongoose';

export interface IMainEvent extends Document {
  name: string;
  description: string;
  dayOfMonth: number; // День месяца для экспорта (1-31)
  enabled: boolean;
  exportCollections: string[]; // Список коллекций для экспорта
  emailRecipients: string[]; // Email адреса получателей
  lastExecutedAt?: Date;
  nextExecutionAt?: Date;
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

export default mongoose.model<IMainEvent>('MainEvent', MainEventSchema);