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
  debt?: number;
  overpayment?: number;
  paymentDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const RentSchema = new Schema<IRent>({
  tenantId: {
    type: Schema.Types.ObjectId,
    ref: 'ExternalSpecialist',
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
  debt: { type: Number, default: 0 },
  overpayment: { type: Number, default: 0 },
  paymentDate: Date,
}, {
  timestamps: true
});

RentSchema.pre('save', function (next) {
  const paid = this.paidAmount || 0;
  // total уже содержит сумму к выплате с учётом прошлых периодов (устанавливается в сервисе)
  const balance = (this.total || 0) - paid;

  if (balance > 0) {
    this.debt = Math.round(balance);
    this.overpayment = 0;
  } else if (balance < 0) {
    this.debt = 0;
    this.overpayment = Math.round(Math.abs(balance));
  } else {
    this.debt = 0;
    this.overpayment = 0;
  }
  next();
});

export default mongoose.model<IRent>('Rent', RentSchema, 'rents');