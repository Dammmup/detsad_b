import mongoose, { Document, Schema } from 'mongoose';
export interface IMainEvent extends Document {
  name: string;
  description: string;
  dayOfMonth: number;
  enabled: boolean;
  exportCollections: string[];
  emailRecipients: string[];
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
    min: 1,
    max: 31
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


export default mongoose.model<IMainEvent>('MainEvent', MainEventSchema, 'mainEvents');