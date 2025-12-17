import mongoose, { Schema, Document } from 'mongoose';
import { IUser } from '../users/model';

export interface IRent extends Document {
  tenantId: mongoose.Types.ObjectId;
  period: string;
  amount: number;
  total: number;
  status: 'active' | 'overdue' | 'paid' | 'draft';
  latePenalties?: number;
  absencePenalties?: number;
  penalties?: number;
  latePenaltyRate?: number;
  accruals?: number;
  paidAmount?: number;
  paymentDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const RentSchema = new Schema<IRent>({
  tenantId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  period: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  total: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'overdue', 'paid', 'draft'],
    default: 'active'
  },
  latePenalties: Number,
  absencePenalties: Number,
  penalties: Number,
  latePenaltyRate: Number,
  accruals: Number,
  paidAmount: Number,
  paymentDate: Date,
}, {
  timestamps: true
});


export default mongoose.model<IRent>('Rent', RentSchema, 'rents');