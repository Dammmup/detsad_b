import mongoose, { Schema, Document, Date } from 'mongoose';
import Child from '../children/child.model';
import User from '../users/user.model';

export interface IRiskGroupChild extends Document {
  childId: mongoose.Types.ObjectId;
  date: Date;
  riskFactors: string[]; // Факторы риска
  healthConditions: string[]; // Состояния здоровья
  recommendations: string; // Рекомендации
  doctorId: mongoose.Types.ObjectId;
  notes?: string;
  reviewDate?: Date; // Дата следующего осмотра
  createdAt: Date;
  updatedAt: Date;
}

const RiskGroupChildSchema: Schema = new Schema({
  childId: { 
    type: Schema.Types.ObjectId, 
    ref: 'children',
    required: true 
  },
  date: { 
    type: Date, 
    required: true 
  },
  riskFactors: [{
    type: String,
    maxlength: 100
  }],
  healthConditions: [{
    type: String,
    maxlength: 100
  }],
  recommendations: { 
    type: String,
    required: true,
    maxlength: 500
  },
  doctorId: { 
    type: Schema.Types.ObjectId, 
    ref: 'users',
    required: true 
  },
  notes: {
    type: String,
    maxlength: 500
  },
  reviewDate: { 
    type: Date 
  }
}, { timestamps: true });

export default mongoose.model<IRiskGroupChild>('riskGroupChildren', RiskGroupChildSchema);