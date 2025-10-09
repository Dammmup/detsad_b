import mongoose, { Schema, Document } from 'mongoose';

export interface IPayroll extends Document {
  staffId: mongoose.Types.ObjectId;
  period: string; // например, '2025-01'
  baseSalary: number;
  bonuses: number;
  deductions: number;
  total: number;
  status: 'draft' | 'approved' | 'paid';
  paymentDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  accruals: number;
  penalties: number;
  baseSalaryType: string;
  // Дополнительные поля
  shiftRate?: number;
  latePenalties?: number;
  absencePenalties?: number;
  userFines?: number;
  penaltyDetails?: {
    type: string;
    amount: number;
    latePenalties: number;
    absencePenalties: number;
    userFines: number;
  };
  history?: Array<{
    date: Date;
    action: string;
    comment?: string;
  }>;
}

const PayrollSchema = new Schema<IPayroll>({
  staffId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  period: {
    type: String,
    required: true
  },
  baseSalary: {
    type: Number,
    required: true
  },
  bonuses: {
    type: Number,
    default: 0
  },
  deductions: {
    type: Number,
    default: 0
  },
  total: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'approved', 'paid'],
    default: 'draft'
  },
  accruals: {
    type: Number,
    default: 0
  },
  penalties: {
    type: Number,
    default: 0
  },
  baseSalaryType: {
    type: String,
  },
  // Дополнительные поля
  shiftRate: Number,
  latePenalties: Number,
  absencePenalties: Number,
  userFines: Number,
  penaltyDetails: {
    type: {
      type: String,
      default: 'per_5_minutes'
    },
    amount: {
      type: Number,
      default: 0
    },
    latePenalties: Number,
    absencePenalties: Number,
    userFines: Number
  },
  history: [{
    date: Date,
    action: String,
    comment: String
  }],
  paymentDate: Date,
}, {
  timestamps: true
});

export default mongoose.model<IPayroll>('Payroll', PayrollSchema, 'payrolls');