import mongoose, { Schema, Document } from 'mongoose';
import { createModelFactory } from '../../../config/database';

export interface IRiskGroupChild extends Document {
  childId: mongoose.Types.ObjectId;
  date: Date;
  riskFactors: string[];
  assessment: string;
  doctor: mongoose.Types.ObjectId;
  notes?: string;
  attachments?: string[];
  status: 'pending' | 'completed' | 'reviewed';
  nextAssessmentDate?: Date;
  recommendations?: string;
  createdAt: Date;
  updatedAt: Date;
}

const RiskGroupChildSchema = new Schema<IRiskGroupChild>({
  childId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  riskFactors: [{
    type: String,
    trim: true,
    maxlength: [100, 'Фактор риска не может превышать 100 символов']
  }],
  assessment: {
    type: String,
    required: true,
    trim: true,
    maxlength: [500, 'Оценка не может превышать 500 символов']
  },
  doctor: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  notes: {
    type: String,
    maxlength: [500, 'Заметки не могут превышать 500 символов']
  },
  attachments: [String],
  status: {
    type: String,
    enum: ['pending', 'completed', 'reviewed'],
    default: 'pending'
  },
  nextAssessmentDate: {
    type: Date
  },
  recommendations: {
    type: String,
    maxlength: [300, 'Рекомендации не могут превышать 300 символов']
  }
}, {
  timestamps: true
});


const createRiskGroupChildModel = createModelFactory<IRiskGroupChild>(
  'RiskGroupChild',
  RiskGroupChildSchema,
  'risk_group_children',
  'medical'
);


export default createRiskGroupChildModel;