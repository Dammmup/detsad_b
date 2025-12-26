import mongoose, { Schema, Document } from 'mongoose';
export interface IRiskGroupChild extends Document {
  childId: mongoose.Types.ObjectId;
  date: Date;
  group?: string;
  reason?: string;
  notes?: string;
  fio?: string;
  createdAt: Date;
  updatedAt: Date;
}

const RiskGroupChildSchema = new Schema<IRiskGroupChild>({
  childId: {
    type: Schema.Types.ObjectId,
    ref: 'Child',
    required: true,
    index: true
  },
  date: {
    type: Date,
    required: true
  },
  group: {
    type: String,
    trim: true,
    maxlength: [100, 'Группа риска не может превышать 100 символов']
  },
  reason: {
    type: String,
    trim: true,
    maxlength: [500, 'Причина не может превышать 500 символов']
  },
  notes: {
    type: String,
    maxlength: [500, 'Заметки не могут превышать 500 символов']
  },
  fio: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});


export default mongoose.model<IRiskGroupChild>('RiskGroupChild', RiskGroupChildSchema, 'risk_group_children');