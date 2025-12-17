import mongoose, { Schema, Document } from 'mongoose';
import { IChild } from '../children/model';
import { IUser } from '../users/model';
export interface IChildPayment extends Document {
  childId?: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId;
  period: {
    start: Date;
    end: Date;
  };
  amount: number;
  total: number;
  status: 'active' | 'overdue' | 'paid' | 'draft';
  latePenalties?: number;
  absencePenalties?: number;
  penalties?: number;
  latePenaltyRate?: number;
  accruals?: number;
  deductions?: number;
  comments?: string;
  paidAmount?: number;
  paymentDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ChildPaymentSchema = new Schema<IChildPayment>({
  childId: {
    type: Schema.Types.ObjectId,
    ref: 'Child',
    index: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  period: {
    start: {
      type: Date,
      required: true
    },
    end: {
      type: Date,
      required: true
    }
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
  deductions: Number,
  comments: String,
  paidAmount: Number,
  paymentDate: Date,
}, {
  timestamps: true
});


ChildPaymentSchema.pre('validate', function (next) {
  if (!this.childId && !this.userId) {
    this.invalidate('childId', 'Either childId or userId must be specified');
  }
  next();
});


export default mongoose.model<IChildPayment>('ChildPayment', ChildPaymentSchema, 'childPayments');